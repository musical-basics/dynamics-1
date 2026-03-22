'use client';

/**
 * Sheet Music Canvas — Placeholder wrapper for OpenSheetMusicDisplay (OSMD) or VexFlow.
 * Per user note: existing code handles rendering, this just wires the placeholder.
 * Subscribe to Master Clock for auto-scroll/page-turn when integrated.
 */

import { useEffect } from 'react';
import { subscribe } from '@/lib/audio/masterClock';

export default function SheetMusicCanvas() {
  useEffect(() => {
    // Subscribe to Master Clock for future integration
    const unsub = subscribe((time: number) => {
      // When integrated with OSMD:
      // - Map currentTime → measure/beat position
      // - Auto-scroll/page-turn based on clock
    });
    return unsub;
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary p-8">
      <div className="text-4xl mb-4">🎼</div>
      <h3 className="text-lg font-serif mb-2">Sheet Music Mode</h3>
      <p className="text-sm text-text-tertiary text-center max-w-md">
        Sheet music rendering — connected to existing code.
        Upload a MusicXML file to see the score synced to playback.
      </p>
    </div>
  );
}
