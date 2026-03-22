'use client';

import { useState, useEffect, useRef } from 'react';
import { usePlayerStore, type Release } from '@/stores/usePlayerStore';

export default function UpNextSidebar() {
  const { activeRelease, queue, play } = usePlayerStore();
  const [autoplay, setAutoplay] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // When current track ends, start countdown to next
  useEffect(() => {
    // TODO: Hook into AudioBufferSourceNode.onended event
    // For now, placeholder for autoplay countdown
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const playNext = (release: Release) => {
    play(release);
  };

  if (!activeRelease || queue.length === 0) return null;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Up Next</h3>
        <button
          onClick={() => setAutoplay(!autoplay)}
          className={`text-xs px-2 py-0.5 rounded transition-colors ${
            autoplay
              ? 'bg-accent/20 text-accent'
              : 'bg-surface text-text-tertiary'
          }`}
        >
          Autoplay {autoplay ? 'On' : 'Off'}
        </button>
      </div>

      {/* Countdown */}
      {countdown !== null && (
        <div className="text-center py-2 text-sm text-text-secondary">
          Playing next in <span className="text-accent font-medium">{countdown}</span>...
        </div>
      )}

      {/* Queue */}
      <div className="space-y-1">
        {queue.map((release, i) => (
          <button
            key={release.id}
            onClick={() => playNext(release)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-surface transition-colors text-left"
          >
            <span className="text-xs text-text-tertiary w-4">{i + 1}</span>
            {release.artworkUrl && (
              <img
                src={release.artworkUrl}
                alt=""
                className="w-8 h-8 rounded object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate">{release.title}</p>
              <p className="text-xs text-text-tertiary truncate">
                {release.creatorName}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
