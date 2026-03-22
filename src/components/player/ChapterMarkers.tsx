'use client';

interface Props {
  chapters: {
    id: string;
    title: string;
    timestampMs: number;
    sortOrder: number;
  }[];
  duration: number; // total duration in seconds
  onSeek: (time: number) => void;
}

export default function ChapterMarkers({ chapters, duration, onSeek }: Props) {
  if (chapters.length === 0 || duration <= 0) return null;

  return (
    <div className="absolute inset-x-0 top-0 h-full pointer-events-none">
      {chapters.map((ch) => {
        const position = (ch.timestampMs / 1000 / duration) * 100;
        return (
          <div
            key={ch.id}
            className="absolute top-0 h-full w-0.5 bg-accent/50 pointer-events-auto cursor-pointer group"
            style={{ left: `${position}%` }}
            onClick={() => onSeek(ch.timestampMs / 1000)}
          >
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-surface-elevated border border-border rounded text-xs text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {ch.title}
            </div>
          </div>
        );
      })}
    </div>
  );
}
