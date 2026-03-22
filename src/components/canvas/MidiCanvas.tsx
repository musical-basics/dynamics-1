'use client';

/**
 * MIDI Visualizer Canvas — Placeholder for falling notes visualization.
 * Per user note: existing code handles rendering, this just wires the placeholder.
 * Subscribe to Master Clock for note-on/note-off rendering when integrated.
 */

import { useEffect, useRef } from 'react';
import { subscribe } from '@/lib/audio/masterClock';

export default function MidiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Subscribe to Master Clock for future integration
    const unsub = subscribe((time: number) => {
      // When integrated:
      // - Parse .mid file for note-on/note-off events
      // - Render falling notes mapped to currentTime
      // - Throttle to 30fps for dense orchestral files
    });
    return unsub;
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary p-8 relative">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="relative z-10 text-center">
        <div className="text-4xl mb-4">🎹</div>
        <h3 className="text-lg font-serif mb-2">MIDI Visualizer</h3>
        <p className="text-sm text-text-tertiary text-center max-w-md">
          MIDI visualizer — connected to existing code.
          Upload a MIDI file to see falling notes synced to playback.
        </p>
      </div>
    </div>
  );
}
