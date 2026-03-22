/**
 * Master Clock — requestAnimationFrame sync loop.
 * AudioContext.currentTime is the single source of truth.
 * All canvas modes (video, sheet music, MIDI, lyrics) subscribe to this clock.
 */

import { getCurrentTime } from './audioEngine';

type SyncSubscriber = (timeSeconds: number) => void;

const subscribers = new Set<SyncSubscriber>();
let animationFrameId: number | null = null;
let isRunning = false;

function tick() {
  if (!isRunning) return;
  
  const time = getCurrentTime();
  subscribers.forEach((fn) => fn(time));
  
  animationFrameId = requestAnimationFrame(tick);
}

/**
 * Start the sync loop. Called when playback begins.
 */
export function startSyncLoop(): void {
  if (isRunning) return;
  isRunning = true;
  animationFrameId = requestAnimationFrame(tick);
}

/**
 * Stop the sync loop. Called when playback pauses.
 */
export function stopSyncLoop(): void {
  isRunning = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

/**
 * Subscribe a component to the Master Clock.
 * Returns an unsubscribe function.
 */
export function subscribe(fn: SyncSubscriber): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

/**
 * Get the current subscriber count (for debugging).
 */
export function getSubscriberCount(): number {
  return subscribers.size;
}
