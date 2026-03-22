'use client';

import { useEffect } from 'react';
import { usePlayerStore, type CanvasMode } from '@/stores/usePlayerStore';
import CanvasContainer from '@/components/canvas/CanvasContainer';

interface ReleaseData {
  id: string;
  title: string;
  description: string | null;
  creatorName: string;
  playCount: number;
  opusUrl: string | null;
  flacUrl: string | null;
  hlsManifestUrl: string | null;
  gainOffsetDb: number;
  durationMs: number;
  lufsRaw: number | null;
  spectralFlatness: number | null;
}

interface AuxFile {
  id: string;
  fileType: string;
  fileUrl: string;
  languageCode: string | null;
}

interface Chapter {
  id: string;
  title: string;
  timestampMs: number;
  sortOrder: number;
}

interface Props {
  release: ReleaseData;
  auxFiles: AuxFile[];
  chapters: Chapter[];
}

export default function ReleaseClient({ release, auxFiles, chapters }: Props) {
  const { play, activeRelease, canvasMode, setCanvasMode } = usePlayerStore();

  const handlePlay = () => {
    play({
      id: release.id,
      title: release.title,
      creatorName: release.creatorName,
      opusUrl: release.opusUrl || undefined,
      flacUrl: release.flacUrl || undefined,
      hlsManifestUrl: release.hlsManifestUrl || undefined,
      gainOffsetDb: release.gainOffsetDb,
      durationMs: release.durationMs,
    });
  };

  const hasVideo = !!release.hlsManifestUrl;
  const hasMidi = auxFiles.some((f) => f.fileType === 'midi');
  const hasSheet = auxFiles.some((f) => f.fileType === 'musicxml');
  const hasLyrics = auxFiles.some((f) => f.fileType === 'webvtt' || f.fileType === 'srt');

  const canvasModes: { mode: CanvasMode; label: string; icon: string; available: boolean }[] = [
    { mode: 'video', label: 'Video', icon: '🎬', available: hasVideo },
    { mode: 'sheet', label: 'Sheet Music', icon: '🎼', available: hasSheet },
    { mode: 'midi', label: 'MIDI', icon: '🎹', available: hasMidi },
    { mode: 'lyrics', label: 'Lyrics', icon: '📜', available: hasLyrics },
  ];

  const availableModes = canvasModes.filter((m) => m.available);

  return (
    <main className="flex flex-1 flex-col lg:flex-row gap-6 px-6 py-8 pb-24 max-w-7xl mx-auto w-full">
      {/* Canvas Area */}
      <div className="flex-1 min-w-0">
        {/* Mode Toggle Tabs */}
        {availableModes.length > 0 && (
          <div className="flex gap-1 mb-4 p-1 bg-surface rounded-lg w-fit">
            {availableModes.map(({ mode, label, icon }) => (
              <button
                key={mode}
                onClick={() => setCanvasMode(mode)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  canvasMode === mode
                    ? 'bg-surface-elevated text-foreground'
                    : 'text-text-secondary hover:text-foreground'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        )}

        {/* Canvas */}
        <CanvasContainer
          canvasMode={canvasMode}
          hlsManifestUrl={release.hlsManifestUrl}
          auxFiles={auxFiles}
        />
      </div>

      {/* Sidebar — Metadata */}
      <aside className="w-full lg:w-80 flex-shrink-0 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{release.title}</h1>
          <p className="text-text-secondary mt-1">{release.creatorName}</p>
        </div>

        {activeRelease?.id !== release.id && (
          <button
            onClick={handlePlay}
            className="w-full bg-accent text-background font-medium py-2.5 rounded-lg hover:bg-accent-dim transition-colors"
          >
            ▶ Play
          </button>
        )}

        {release.description && (
          <p className="text-sm text-text-secondary leading-relaxed">
            {release.description}
          </p>
        )}

        <div className="text-xs text-text-tertiary space-y-1">
          <p>{release.playCount.toLocaleString()} plays</p>
          {release.lufsRaw !== null && (
            <p>LUFS: {release.lufsRaw.toFixed(1)} dB</p>
          )}
          {release.gainOffsetDb !== 0 && (
            <p>SDD Offset: {release.gainOffsetDb > 0 ? '+' : ''}{release.gainOffsetDb.toFixed(1)} dB</p>
          )}
        </div>

        {/* Chapters */}
        {chapters.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Chapters</h3>
            <div className="space-y-1">
              {chapters
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((ch) => (
                  <button
                    key={ch.id}
                    className="w-full text-left text-sm py-1.5 px-2 rounded hover:bg-surface transition-colors flex justify-between"
                    onClick={() => {
                      const { seek } = usePlayerStore.getState();
                      seek(ch.timestampMs / 1000);
                    }}
                  >
                    <span className="truncate">{ch.title}</span>
                    <span className="text-text-tertiary text-xs ml-2">
                      {Math.floor(ch.timestampMs / 60000)}:{String(Math.floor((ch.timestampMs % 60000) / 1000)).padStart(2, '0')}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </aside>
    </main>
  );
}
