'use client';

import { type CanvasMode } from '@/stores/usePlayerStore';
import VideoCanvas from './VideoCanvas';
import SheetMusicCanvas from './SheetMusicCanvas';
import MidiCanvas from './MidiCanvas';
import LyricsCanvas from './LyricsCanvas';

interface AuxFile {
  id: string;
  fileType: string;
  fileUrl: string;
  languageCode: string | null;
}

interface Props {
  canvasMode: CanvasMode;
  hlsManifestUrl: string | null;
  auxFiles: AuxFile[];
}

export default function CanvasContainer({ canvasMode, hlsManifestUrl, auxFiles }: Props) {
  const vttFiles = auxFiles.filter((f) => f.fileType === 'webvtt' || f.fileType === 'srt');

  return (
    <div className="w-full aspect-video bg-surface rounded-xl overflow-hidden border border-border">
      {canvasMode === 'video' && (
        <VideoCanvas hlsManifestUrl={hlsManifestUrl} />
      )}
      {canvasMode === 'sheet' && (
        <SheetMusicCanvas />
      )}
      {canvasMode === 'midi' && (
        <MidiCanvas />
      )}
      {canvasMode === 'lyrics' && (
        <LyricsCanvas vttFiles={vttFiles} />
      )}
    </div>
  );
}
