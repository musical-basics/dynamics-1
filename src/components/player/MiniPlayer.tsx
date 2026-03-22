'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import {
  loadAudio,
  playBuffer,
  stopPlayback,
  setSddGain,
  setVolume,
  resumeContext,
  auditAudioGraph,
  getCurrentTime,
} from '@/lib/audio/audioEngine';
import { startSyncLoop, stopSyncLoop, subscribe } from '@/lib/audio/masterClock';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function MiniPlayer() {
  const {
    activeRelease,
    isPlaying,
    currentTime,
    duration,
    volume,
    gainOffsetDb,
    pause,
    resume,
    seek,
    setVolume: storeSetVolume,
    setCurrentTime,
  } = usePlayerStore();

  const bufferRef = useRef<AudioBuffer | null>(null);
  const seekBarRef = useRef<HTMLInputElement>(null);

  // Load audio when release changes
  useEffect(() => {
    if (!activeRelease) return;

    const url = activeRelease.opusUrl || activeRelease.flacUrl;
    if (!url) return;

    let cancelled = false;
    (async () => {
      try {
        await resumeContext();
        const buffer = await loadAudio(url);
        if (!cancelled) {
          bufferRef.current = buffer;
          setSddGain(activeRelease.gainOffsetDb);
          playBuffer(buffer, 0);
          startSyncLoop();
          auditAudioGraph();
        }
      } catch (err) {
        console.error('Audio load error:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeRelease]);

  // Sync Master Clock → Zustand store
  useEffect(() => {
    const unsub = subscribe((time) => {
      setCurrentTime(time);
    });
    return unsub;
  }, [setCurrentTime]);

  // Play/pause
  useEffect(() => {
    if (isPlaying) {
      if (bufferRef.current) {
        playBuffer(bufferRef.current, currentTime);
        startSyncLoop();
      }
    } else {
      stopPlayback();
      stopSyncLoop();
    }
  }, [isPlaying]);

  // Volume
  useEffect(() => {
    setVolume(volume);
  }, [volume]);

  // SDD gain
  useEffect(() => {
    setSddGain(gainOffsetDb);
  }, [gainOffsetDb]);

  const handlePlayPause = useCallback(async () => {
    await resumeContext();
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      seek(time);
      if (bufferRef.current && isPlaying) {
        playBuffer(bufferRef.current, time);
      }
    },
    [seek, isPlaying]
  );

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      storeSetVolume(parseFloat(e.target.value));
    },
    [storeSetVolume]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(0, currentTime - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(Math.min(duration, currentTime + 5));
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handlePlayPause, seek, currentTime, duration]);

  if (!activeRelease) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface-elevated/95 backdrop-blur-sm border-t border-border">
      <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 py-3">
        {/* Track Info */}
        <div className="flex items-center gap-3 min-w-0 flex-shrink-0 w-48">
          {activeRelease.artworkUrl && (
            <img
              src={activeRelease.artworkUrl}
              alt=""
              className="w-10 h-10 rounded object-cover"
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{activeRelease.title}</p>
            <p className="text-xs text-text-secondary truncate">
              {activeRelease.creatorName}
            </p>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex flex-col items-center flex-1 gap-1">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayPause}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-foreground text-background hover:scale-105 transition-transform"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6,4 20,12 6,20" />
                </svg>
              )}
            </button>
          </div>

          {/* Seek Bar */}
          <div className="w-full flex items-center gap-2">
            <span className="text-[10px] text-text-tertiary w-10 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>
            <input
              ref={seekBarRef}
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 appearance-none bg-border rounded-full cursor-pointer accent-accent"
            />
            <span className="text-[10px] text-text-tertiary w-10 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 flex-shrink-0 w-32">
          <svg className="w-4 h-4 text-text-secondary" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1 appearance-none bg-border rounded-full cursor-pointer accent-accent"
          />
        </div>
      </div>
    </div>
  );
}
