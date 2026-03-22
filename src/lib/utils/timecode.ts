/**
 * Timecode parsing and formatting utilities.
 * Used for comment timecodes and chapter timestamps.
 */

/**
 * Parse a timecode string "MM:SS" or "HH:MM:SS" into total seconds.
 */
export function parseTimecode(timecode: string): number {
  const parts = timecode.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

/**
 * Format seconds into "M:SS" or "H:MM:SS".
 */
export function formatTimecode(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Regex to match manual timecodes in comment text.
 * Matches: "14:32", "1:23:45", etc.
 */
export const timecodeRegex = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/g;

/**
 * Extract and render timecodes from comment body text as clickable elements.
 * Returns an array of text segments and timecode objects.
 */
export interface TextSegment {
  type: 'text' | 'timecode';
  content: string;
  seconds?: number;
}

export function parseCommentTimecodes(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  const regex = new RegExp(timecodeRegex.source, 'g');
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add preceding text
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }

    // Add timecode
    segments.push({
      type: 'timecode',
      content: match[0],
      seconds: parseTimecode(match[0]),
    });

    lastIndex = regex.lastIndex;
  }

  // Add trailing text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return segments;
}
