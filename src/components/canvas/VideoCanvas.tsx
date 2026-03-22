'use client';

import { useEffect, useRef } from 'react';
import { subscribe } from '@/lib/audio/masterClock';

interface Props {
  hlsManifestUrl: string | null;
}

export default function VideoCanvas({ hlsManifestUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (!hlsManifestUrl || !videoRef.current) return;

    let hls: { destroy: () => void } | null = null;

    // Dynamic import hls.js (client-only)
    import('hls.js').then((HlsModule) => {
      const Hls = HlsModule.default;
      if (!videoRef.current) return;

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
        });
        (hls as InstanceType<typeof Hls>).loadSource(hlsManifestUrl);
        (hls as InstanceType<typeof Hls>).attachMedia(videoRef.current);
        hlsRef.current = hls;
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        videoRef.current.src = hlsManifestUrl;
      }
    });

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [hlsManifestUrl]);

  // Sync video to Master Clock
  useEffect(() => {
    const unsub = subscribe((audioTime: number) => {
      if (!videoRef.current) return;
      const drift = Math.abs(videoRef.current.currentTime - audioTime);
      // Force sync if drift > 50ms
      if (drift > 0.05) {
        videoRef.current.currentTime = audioTime;
      }
    });
    return unsub;
  }, []);

  if (!hlsManifestUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-text-tertiary">
        <p>No video available for this release</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-contain bg-black"
      muted // Audio comes from Web Audio API, not the video tag
      playsInline
    />
  );
}
