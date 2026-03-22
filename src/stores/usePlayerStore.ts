import { create } from 'zustand';

export type CanvasMode = 'video' | 'sheet' | 'midi' | 'lyrics';

export interface Release {
  id: string;
  title: string;
  creatorName: string;
  artworkUrl?: string;
  opusUrl?: string;
  flacUrl?: string;
  hlsManifestUrl?: string;
  gainOffsetDb: number;
  durationMs: number;
}

interface PlayerState {
  // Playback state
  activeRelease: Release | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0–1
  canvasMode: CanvasMode;
  gainOffsetDb: number;
  queue: Release[];

  // Actions
  play: (release: Release) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  setCanvasMode: (mode: CanvasMode) => void;
  setCurrentTime: (time: number) => void;
  addToQueue: (release: Release) => void;
  clearQueue: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  // Initial state
  activeRelease: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  canvasMode: 'video',
  gainOffsetDb: 0,
  queue: [],

  // Actions
  play: (release) =>
    set({
      activeRelease: release,
      isPlaying: true,
      currentTime: 0,
      duration: release.durationMs / 1000,
      gainOffsetDb: release.gainOffsetDb,
    }),

  pause: () => set({ isPlaying: false }),

  resume: () => set({ isPlaying: true }),

  seek: (time) => set({ currentTime: time }),

  setVolume: (vol) => set({ volume: Math.max(0, Math.min(1, vol)) }),

  setCanvasMode: (mode) => set({ canvasMode: mode }),

  setCurrentTime: (time) => set({ currentTime: time }),

  addToQueue: (release) =>
    set((state) => ({ queue: [...state.queue, release] })),

  clearQueue: () => set({ queue: [] }),
}));
