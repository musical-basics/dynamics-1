'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { subscribe } from '@/lib/audio/masterClock';
import { parseWebVTT, parseSRT, findActiveCue, type VttCue } from '@/lib/parsers/webvtt';

interface AuxFile {
  id: string;
  fileType: string;
  fileUrl: string;
  languageCode: string | null;
}

interface Props {
  vttFiles: AuxFile[];
}

type LangMode = 'source' | 'translation' | 'both';

export default function LyricsCanvas({ vttFiles }: Props) {
  const [cues, setCues] = useState<VttCue[]>([]);
  const [translationCues, setTranslationCues] = useState<VttCue[]>([]);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [langMode, setLangMode] = useState<LangMode>('source');
  const containerRef = useRef<HTMLDivElement>(null);

  // Load and parse VTT files
  useEffect(() => {
    if (vttFiles.length === 0) return;

    const loadCues = async () => {
      for (const file of vttFiles) {
        try {
          const response = await fetch(file.fileUrl);
          const content = await response.text();
          const parsed =
            file.fileType === 'srt'
              ? parseSRT(content, file.languageCode || undefined)
              : parseWebVTT(content, file.languageCode || undefined);

          // First file = source, second = translation
          if (cues.length === 0) {
            setCues(parsed);
          } else {
            setTranslationCues(parsed);
          }
        } catch (err) {
          console.error('Failed to load lyrics:', err);
        }
      }
    };

    loadCues();
  }, [vttFiles]);

  // Subscribe to Master Clock — use direct DOM manipulation to avoid re-render lag
  useEffect(() => {
    const unsub = subscribe((time: number) => {
      const timeMs = time * 1000;
      const activeCue = findActiveCue(cues, timeMs);
      if (activeCue) {
        const idx = cues.indexOf(activeCue);
        setActiveIdx(idx);

        // Smooth scroll active line into view
        const activeEl = containerRef.current?.querySelector(`[data-cue-idx="${idx}"]`);
        if (activeEl) {
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
    return unsub;
  }, [cues]);

  if (cues.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary p-8">
        <div className="text-4xl mb-4">📜</div>
        <h3 className="text-lg font-serif mb-2">Lyrics Mode</h3>
        <p className="text-sm text-text-tertiary text-center max-w-md">
          Upload a WebVTT or SRT file to see lyrics synced to playback.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Language Toggle */}
      {translationCues.length > 0 && (
        <div className="flex gap-1 p-2 border-b border-border">
          {(['source', 'translation', 'both'] as LangMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setLangMode(mode)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                langMode === mode
                  ? 'bg-accent text-background'
                  : 'text-text-secondary hover:text-foreground'
              }`}
            >
              {mode === 'source' ? 'Original' : mode === 'translation' ? 'Translation' : 'Both'}
            </button>
          ))}
        </div>
      )}

      {/* Lyrics Display */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-8 space-y-4"
      >
        {cues.map((cue, idx) => {
          const isActive = idx === activeIdx;
          const translationCue = translationCues[idx];

          return (
            <div
              key={idx}
              data-cue-idx={idx}
              className={`transition-all duration-300 ${
                isActive
                  ? 'opacity-100 scale-100'
                  : 'opacity-30 scale-[0.98]'
              }`}
            >
              {(langMode === 'source' || langMode === 'both') && (
                <p
                  className={`font-serif text-xl leading-relaxed whitespace-pre-line ${
                    isActive ? 'text-foreground' : 'text-text-secondary'
                  }`}
                >
                  {cue.text}
                </p>
              )}
              {(langMode === 'translation' || langMode === 'both') && translationCue && (
                <p
                  className={`text-base leading-relaxed mt-1 italic whitespace-pre-line ${
                    isActive ? 'text-text-secondary' : 'text-text-tertiary'
                  }`}
                >
                  {translationCue.text}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
