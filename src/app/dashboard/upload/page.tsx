'use client';

import { useState, useCallback } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';

interface SelectedFile {
  file: File;
  type: 'audio' | 'video' | 'score' | 'performance' | 'lyrics';
  status: 'selected' | 'uploading' | 'processing' | 'done' | 'error';
  progress: number;
}

const FILE_TYPE_MAP: Record<string, SelectedFile['type']> = {
  'audio/wav': 'audio',
  'audio/x-wav': 'audio',
  'audio/flac': 'audio',
  'audio/x-flac': 'audio',
  'audio/aiff': 'audio',
  'audio/x-aiff': 'audio',
  'video/mp4': 'video',
  'video/quicktime': 'video',
  'application/xml': 'score',
  'text/xml': 'score',
  'audio/midi': 'performance',
  'audio/x-midi': 'performance',
  'text/vtt': 'lyrics',
  'application/x-subrip': 'lyrics',
};

const EXTENSION_MAP: Record<string, SelectedFile['type']> = {
  wav: 'audio',
  flac: 'audio',
  aiff: 'audio',
  aif: 'audio',
  mp4: 'video',
  mov: 'video',
  mxl: 'score',
  musicxml: 'score',
  mid: 'performance',
  midi: 'performance',
  vtt: 'lyrics',
  srt: 'lyrics',
};

const TYPE_BADGES: Record<SelectedFile['type'], { label: string; color: string }> = {
  audio: { label: '🎵 Audio', color: 'bg-green-900/50 text-green-300 border-green-800' },
  video: { label: '🎬 Video', color: 'bg-blue-900/50 text-blue-300 border-blue-800' },
  score: { label: '🎼 Score', color: 'bg-purple-900/50 text-purple-300 border-purple-800' },
  performance: { label: '🎹 MIDI', color: 'bg-orange-900/50 text-orange-300 border-orange-800' },
  lyrics: { label: '📜 Lyrics', color: 'bg-pink-900/50 text-pink-300 border-pink-800' },
};

function getFileType(file: File): SelectedFile['type'] | null {
  // Try MIME type first
  if (FILE_TYPE_MAP[file.type]) return FILE_TYPE_MAP[file.type];
  // Fallback to extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext && EXTENSION_MAP[ext]) return EXTENSION_MAP[ext];
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function UploadPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: SelectedFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const type = getFileType(file);
      if (!type) {
        setError(`Unsupported file type: ${file.name}`);
        continue;
      }
      newFiles.push({ file, type, status: 'selected', progress: 0 });
    }
    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }
    if (!files.some((f) => f.type === 'audio')) {
      setError('At least one audio file is required');
      return;
    }

    setUploadState('uploading');
    setError(null);

    try {
      // 1. Get pre-signed URLs
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          files: files.map((f) => ({
            name: f.file.name,
            type: f.type,
            size: f.file.size,
            contentType: f.file.type,
          })),
        }),
      });

      if (!presignRes.ok) {
        throw new Error('Failed to get upload URLs');
      }

      const { releaseId, uploadUrls } = await presignRes.json();

      // 2. Upload each file directly to R2
      for (let i = 0; i < files.length; i++) {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'uploading' } : f
          )
        );

        const xhr = new XMLHttpRequest();
        await new Promise<void>((resolve, reject) => {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setFiles((prev) =>
                prev.map((f, idx) =>
                  idx === i ? { ...f, progress: pct } : f
                )
              );
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setFiles((prev) =>
                prev.map((f, idx) =>
                  idx === i ? { ...f, status: 'done', progress: 100 } : f
                )
              );
              resolve();
            } else {
              reject(new Error(`Upload failed for ${files[i].file.name}`));
            }
          };
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.open('PUT', uploadUrls[i].url);
          xhr.setRequestHeader('Content-Type', files[i].file.type || 'application/octet-stream');
          xhr.send(files[i].file);
        });
      }

      // 3. Confirm upload and trigger processing
      setUploadState('processing');
      const confirmRes = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ releaseId }),
      });

      if (!confirmRes.ok) {
        throw new Error('Failed to trigger processing');
      }

      setUploadState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadState('idle');
    }
  };

  return (
    <main className="flex flex-1 flex-col px-6 py-12 max-w-3xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-8">
        Upload<span className="text-accent">.</span>Release
      </h1>

      {/* Title & Description */}
      <div className="space-y-4 mb-8">
        <div>
          <label htmlFor="title" className="block text-sm text-text-secondary mb-1.5">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-accent transition-colors"
            placeholder="Beethoven: Symphony No. 7 in A major, Op. 92"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm text-text-secondary mb-1.5">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-accent transition-colors resize-none"
            placeholder="Add a description..."
          />
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
          dragOver
            ? 'border-accent bg-accent/5'
            : 'border-border hover:border-text-tertiary'
        }`}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.accept = '.wav,.flac,.aiff,.aif,.mp4,.mov,.mxl,.musicxml,.mid,.midi,.vtt,.srt';
          input.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            if (target.files) handleFiles(target.files);
          };
          input.click();
        }}
      >
        <div className="text-text-secondary">
          <p className="text-lg mb-1">Drag & drop your files here</p>
          <p className="text-sm text-text-tertiary">
            Audio (WAV, FLAC, AIFF) · Video (MP4, MOV) · Score (MusicXML) · MIDI · Lyrics (VTT, SRT)
          </p>
        </div>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-surface border border-border rounded-lg p-3"
            >
              <span
                className={`text-xs px-2 py-0.5 rounded border ${TYPE_BADGES[f.type].color}`}
              >
                {TYPE_BADGES[f.type].label}
              </span>
              <span className="flex-1 text-sm truncate">{f.file.name}</span>
              <span className="text-xs text-text-tertiary">
                {formatFileSize(f.file.size)}
              </span>
              {f.status === 'uploading' && (
                <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${f.progress}%` }}
                  />
                </div>
              )}
              {f.status === 'done' && (
                <span className="text-green-400 text-xs">✓</span>
              )}
              {f.status === 'selected' && (
                <button
                  onClick={() => removeFile(i)}
                  className="text-text-tertiary hover:text-red-400 transition-colors text-sm"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-4 text-red-500 text-sm">{error}</p>
      )}

      {/* Upload Button */}
      <div className="mt-8">
        {uploadState === 'done' ? (
          <div className="text-center space-y-2">
            <p className="text-green-400 font-medium">✓ Published</p>
            <p className="text-text-secondary text-sm">
              Your release is being processed and will be available shortly.
            </p>
          </div>
        ) : (
          <button
            onClick={handleUpload}
            disabled={uploadState !== 'idle' || files.length === 0}
            className="w-full bg-accent text-background font-medium py-3 rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-50"
          >
            {uploadState === 'uploading'
              ? 'Uploading...'
              : uploadState === 'processing'
              ? 'Processing...'
              : 'Upload & Publish'}
          </button>
        )}
      </div>
    </main>
  );
}
