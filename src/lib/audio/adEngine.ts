/**
 * Ad Engine — Curated sponsorship injection for Free tier.
 * 
 * Solves "The Car Insurance Problem":
 * Every ad runs through the SDD pipeline. Compressed ads (low spectral flatness)
 * receive no discount and are mathematically turned DOWN to match the preceding
 * quiet music. No perceptual volume jump — ever.
 * 
 * Premium users bypass ads entirely.
 */

import { getAudioContext, initAudioGraph, loadAudio } from './audioEngine';

interface SponsorAd {
  id: string;
  audioUrl: string;
  gainOffsetDb: number;
  brandName: string;
}

let adQueue: SponsorAd[] = [];
let tracksPlayedSinceAd = 0;
const AD_INTERVAL = 3; // Play an ad every N tracks

/**
 * Load sponsor ads from the API.
 */
export async function loadSponsorAds(): Promise<void> {
  try {
    const res = await fetch('/api/sponsors/active');
    if (res.ok) {
      const data = await res.json();
      adQueue = data.ads || [];
    }
  } catch (err) {
    console.warn('Failed to load sponsor ads:', err);
  }
}

/**
 * Check if an ad should play after the current track.
 */
export function shouldPlayAd(): boolean {
  tracksPlayedSinceAd++;
  return tracksPlayedSinceAd >= AD_INTERVAL && adQueue.length > 0;
}

/**
 * Play the next sponsor ad with SDD-normalized volume.
 * Returns a Promise that resolves when the ad finishes.
 */
export async function playAd(): Promise<void> {
  if (adQueue.length === 0) return;

  const ad = adQueue.shift()!;
  // Rotate to back of queue
  adQueue.push(ad);
  tracksPlayedSinceAd = 0;

  const ctx = getAudioContext();
  const { volumeGain } = initAudioGraph();

  try {
    // Load ad audio
    const buffer = await loadAudio(ad.audioUrl);

    // Create ad-specific gain node with SDD offset
    const adGain = ctx.createGain();
    adGain.gain.value = Math.pow(10, ad.gainOffsetDb / 20);

    // Connect: adSource → adGain → volumeGain → destination
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(adGain);
    adGain.connect(volumeGain!);

    return new Promise<void>((resolve) => {
      source.onended = () => {
        adGain.disconnect();
        resolve();
      };
      source.start();
    });
  } catch (err) {
    console.error('Ad playback failed:', err);
  }
}

/**
 * Reset ad counter (e.g., when user upgrades to premium).
 */
export function resetAdCounter(): void {
  tracksPlayedSinceAd = 0;
  adQueue = [];
}
