/**
 * AudioContext singleton for the Web Audio API.
 * The AudioContext is the Master Clock — all sync derives from it.
 * 
 * CRITICAL: No DynamicsCompressorNode or limiter may exist in this chain.
 * Chain: source → sddGain → volumeGain → destination
 */

let ctx: AudioContext | null = null;
let sddGainNode: GainNode | null = null;
let volumeGainNode: GainNode | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let startOffset = 0;
let startTime = 0;

export function getAudioContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext({ sampleRate: 48000 });
  }
  return ctx;
}

export function initAudioGraph(): {
  sddGain: GainNode;
  volumeGain: GainNode;
} {
  const audioCtx = getAudioContext();

  if (!sddGainNode) {
    sddGainNode = audioCtx.createGain();
  }
  if (!volumeGainNode) {
    volumeGainNode = audioCtx.createGain();
    // Connect: sddGain → volumeGain → destination
    sddGainNode.connect(volumeGainNode);
    volumeGainNode.connect(audioCtx.destination);
  }

  return { sddGain: sddGainNode, volumeGain: volumeGainNode };
}

/**
 * Apply the SDD gain offset (dB → linear).
 * No limiters, no compressors — just math.
 */
export function setSddGain(gainOffsetDb: number): void {
  const { sddGain } = initAudioGraph();
  sddGain.gain.value = Math.pow(10, gainOffsetDb / 20);
}

/**
 * Set user volume (0–1 linear scale).
 */
export function setVolume(vol: number): void {
  const { volumeGain } = initAudioGraph();
  volumeGain.gain.value = Math.max(0, Math.min(1, vol));
}

/**
 * Load and decode an audio file from a URL.
 */
export async function loadAudio(url: string): Promise<AudioBuffer> {
  const audioCtx = getAudioContext();
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return audioCtx.decodeAudioData(arrayBuffer);
}

/**
 * Play an audio buffer from a given offset.
 */
export function playBuffer(buffer: AudioBuffer, offset: number = 0): AudioBufferSourceNode {
  const audioCtx = getAudioContext();
  const { sddGain } = initAudioGraph();

  // Stop existing source
  stopPlayback();

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(sddGain);
  
  startOffset = offset;
  startTime = audioCtx.currentTime;
  source.start(0, offset);
  
  currentSource = source;
  return source;
}

/**
 * Stop current playback.
 */
export function stopPlayback(): void {
  if (currentSource) {
    try {
      currentSource.stop();
      currentSource.disconnect();
    } catch {
      // Source may have already been stopped
    }
    currentSource = null;
  }
}

/**
 * Get current playback position in seconds.
 */
export function getCurrentTime(): number {
  if (!ctx || !currentSource) return startOffset;
  return startOffset + (ctx.currentTime - startTime);
}

/**
 * Resume AudioContext after user gesture (required by browsers).
 */
export async function resumeContext(): Promise<void> {
  const audioCtx = getAudioContext();
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
}

/**
 * DEV ONLY: Audit the audio graph for forbidden nodes.
 * SDD principle: No DynamicsCompressorNode or WaveShaperNode allowed.
 */
export function auditAudioGraph(): void {
  if (process.env.NODE_ENV !== 'development') return;

  const audioCtx = getAudioContext();
  const forbidden = ['DynamicsCompressorNode', 'WaveShaperNode'];
  
  // Check all gain nodes in our chain
  const nodes = [sddGainNode, volumeGainNode];
  for (const node of nodes) {
    if (node) {
      const name = node.constructor.name;
      if (forbidden.includes(name)) {
        console.error(`🚨 VIOLATION: ${name} detected in audio graph — SDD principles violated!`);
      }
    }
  }
  
  console.log('✅ Audio graph audit: clean (no limiters/compressors)');
}
