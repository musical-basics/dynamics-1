'use client';

import { useState, useCallback } from 'react';

interface Props {
  params: { id: string };
}

export default function ReplaceMediaPage() {
  const [replaceType, setReplaceType] = useState<'audio' | 'video' | 'aux' | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [driftWarning, setDriftWarning] = useState<{ deltaMs: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  }, []);

  const handleReplace = async () => {
    if (!file || !replaceType) return;
    setStatus('uploading');
    setError(null);

    try {
      // Get the release ID from the URL
      const releaseId = window.location.pathname.split('/').slice(-2)[0];

      // Request pre-signed URL for replacement file
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'replacement',
          description: null,
          files: [{
            name: file.name,
            type: replaceType,
            size: file.size,
            contentType: file.type,
          }],
        }),
      });

      if (!presignRes.ok) throw new Error('Failed to get upload URL');
      const { releaseId: newReleaseId, uploadUrls } = await presignRes.json();

      // Upload to R2
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject();
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open('PUT', uploadUrls[0].url);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
      });

      // Trigger replacement processing
      setStatus('processing');
      const replaceRes = await fetch(`/api/releases/${releaseId}/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replaceType,
          uploadKey: uploadUrls[0].key,
        }),
      });

      if (!replaceRes.ok) throw new Error('Replacement processing failed');
      const result = await replaceRes.json();

      // Check for duration drift
      if (result.driftWarning) {
        setDriftWarning(result.driftWarning);
        setStatus('idle');
        return;
      }

      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Replacement failed');
      setStatus('error');
    }
  };

  const handleConfirmDrift = async () => {
    // User accepts drift — proceed with replacement
    const releaseId = window.location.pathname.split('/').slice(-2)[0];
    try {
      await fetch(`/api/releases/${releaseId}/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmDrift: true,
        }),
      });
      setDriftWarning(null);
      setStatus('done');
    } catch {
      setError('Failed to confirm replacement');
    }
  };

  return (
    <main className="flex flex-1 flex-col px-6 py-12 max-w-2xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-8">
        Replace<span className="text-accent">.</span>Media
      </h1>

      {/* Replace Type Selection */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {([
          { type: 'audio' as const, label: 'Audio Master', icon: '🎵', accept: '.wav,.flac,.aiff' },
          { type: 'video' as const, label: 'Video Track', icon: '🎬', accept: '.mp4,.mov' },
          { type: 'aux' as const, label: 'Auxiliary Files', icon: '📄', accept: '.mxl,.musicxml,.mid,.midi,.vtt,.srt' },
        ]).map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => setReplaceType(type)}
            className={`p-4 rounded-xl border text-center transition-colors ${
              replaceType === type
                ? 'border-accent bg-accent/5'
                : 'border-border hover:border-text-tertiary'
            }`}
          >
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-sm">{label}</div>
          </button>
        ))}
      </div>

      {/* File Picker */}
      {replaceType && (
        <div className="space-y-4">
          <input
            type="file"
            onChange={handleFileSelect}
            accept={
              replaceType === 'audio' ? '.wav,.flac,.aiff'
              : replaceType === 'video' ? '.mp4,.mov'
              : '.mxl,.musicxml,.mid,.midi,.vtt,.srt'
            }
            className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-surface file:text-foreground hover:file:bg-surface-elevated"
          />

          {file && (
            <div className="flex items-center gap-3 bg-surface border border-border rounded-lg p-3">
              <span className="text-sm">{file.name}</span>
              <span className="text-xs text-text-tertiary">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>
          )}

          <button
            onClick={handleReplace}
            disabled={!file || status === 'uploading' || status === 'processing'}
            className="w-full bg-accent text-background font-medium py-2.5 rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-50"
          >
            {status === 'uploading' ? 'Uploading...'
              : status === 'processing' ? 'Processing...'
              : 'Replace'}
          </button>
        </div>
      )}

      {/* Drift Warning Modal */}
      {driftWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="bg-surface border border-border rounded-xl p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-yellow-400">⚠️ Duration Drift Detected</h2>
            <p className="text-sm text-text-secondary">
              The new file is{' '}
              <strong className="text-foreground">
                {Math.abs(driftWarning.deltaMs / 1000).toFixed(1)}s
              </strong>{' '}
              {driftWarning.deltaMs > 0 ? 'longer' : 'shorter'} than the original.
            </p>
            <p className="text-sm text-text-secondary">
              Synced interactive data (MIDI, sheet music, lyrics) and timestamped comments
              may become out-of-sync.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmDrift}
                className="flex-1 bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
              >
                Proceed Anyway
              </button>
              <button
                onClick={() => {
                  setDriftWarning(null);
                  setFile(null);
                }}
                className="flex-1 border border-border py-2 rounded-lg hover:bg-surface-elevated transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {status === 'done' && (
        <div className="mt-4 text-center text-green-400">
          ✓ Replacement complete. SDD recalculation triggered.
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-4 text-red-500 text-sm">{error}</p>
      )}
    </main>
  );
}
