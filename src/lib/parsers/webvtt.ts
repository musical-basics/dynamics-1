/**
 * WebVTT / SRT parser.
 * Parses subtitle files into structured cue arrays.
 */

export interface VttCue {
  startMs: number;
  endMs: number;
  text: string;
  language?: string;
}

/**
 * Parse a timestamp string (HH:MM:SS.mmm or MM:SS.mmm) into milliseconds.
 */
function parseTimestamp(ts: string): number {
  const parts = ts.trim().split(':');
  let hours = 0, minutes = 0, seconds = 0;

  if (parts.length === 3) {
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
    seconds = parseFloat(parts[2]);
  } else if (parts.length === 2) {
    minutes = parseInt(parts[0], 10);
    seconds = parseFloat(parts[1]);
  }

  return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000);
}

/**
 * Parse a WebVTT file string into an array of cues.
 */
export function parseWebVTT(content: string, language?: string): VttCue[] {
  const cues: VttCue[] = [];
  const lines = content.split('\n');
  let i = 0;

  // Skip header
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.includes('-->')) {
      const [startStr, endStr] = line.split('-->').map((s) => s.trim());
      const startMs = parseTimestamp(startStr);
      const endMs = parseTimestamp(endStr);

      // Collect text lines
      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(lines[i].trim());
        i++;
      }

      if (textLines.length > 0) {
        cues.push({
          startMs,
          endMs,
          text: textLines.join('\n'),
          language,
        });
      }
    } else {
      i++;
    }
  }

  return cues;
}

/**
 * Parse an SRT file string into an array of cues.
 */
export function parseSRT(content: string, language?: string): VttCue[] {
  const cues: VttCue[] = [];
  // SRT uses comma for millisecond separator
  const normalizedContent = content.replace(/,/g, '.');
  const blocks = normalizedContent.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    // Find the timestamp line
    const tsLineIdx = lines.findIndex((l) => l.includes('-->'));
    if (tsLineIdx === -1) continue;

    const [startStr, endStr] = lines[tsLineIdx].split('-->').map((s) => s.trim());
    const textLines = lines.slice(tsLineIdx + 1);

    if (textLines.length > 0) {
      cues.push({
        startMs: parseTimestamp(startStr),
        endMs: parseTimestamp(endStr),
        text: textLines.join('\n'),
        language,
      });
    }
  }

  return cues;
}

/**
 * Binary search (or sequential) to find the active cue at a given time.
 */
export function findActiveCue(cues: VttCue[], timeMs: number): VttCue | null {
  // Binary search for efficiency
  let low = 0;
  let high = cues.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const cue = cues[mid];

    if (timeMs >= cue.startMs && timeMs <= cue.endMs) {
      return cue;
    } else if (timeMs < cue.startMs) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return null;
}
