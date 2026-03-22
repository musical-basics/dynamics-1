import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { mediaAssets } from '@/db/schema/media-assets';
import { releases } from '@/db/schema/releases';
import { audioTracks } from '@/db/schema/audio-tracks';
import { videoTracks } from '@/db/schema/video-tracks';
import { audioFeatures } from '@/db/schema/audio-features';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Validate webhook secret
    const secret = request.headers.get('X-Webhook-Secret');
    if (secret !== process.env.WORKER_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      release_id,
      media_asset_id,
      status,
      audio,
      video,
      feature_vector,
      duration_ms,
    } = body;

    if (!release_id || !media_asset_id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update media asset status and duration
    await db
      .update(mediaAssets)
      .set({
        status,
        durationMs: duration_ms,
      })
      .where(eq(mediaAssets.id, media_asset_id));

    // Insert audio track data
    if (audio) {
      const [audioTrack] = await db.insert(audioTracks).values({
        mediaAssetId: media_asset_id,
        lufsRaw: audio.lufs_raw,
        spectralFlatness: audio.spectral_flatness,
        gainOffsetDb: audio.gain_offset_db,
        flacUrl: audio.flac_url,
        opusUrl: audio.opus_url,
        sampleRate: audio.sample_rate,
        bitDepth: audio.bit_depth,
      }).returning();

      // Insert feature vector if provided
      if (feature_vector && audioTrack) {
        await db.insert(audioFeatures).values({
          audioTrackId: audioTrack.id,
          featureVector: feature_vector,
          tempo: audio.tempo,
          key: audio.key,
        });
      }
    }

    // Insert video track data
    if (video) {
      await db.insert(videoTracks).values({
        mediaAssetId: media_asset_id,
        hlsManifestUrl: video.hls_manifest_url,
      });
    }

    // Update release to point to this media asset and set as published
    if (status === 'ready') {
      await db
        .update(releases)
        .set({
          currentMediaAssetId: media_asset_id,
          visibility: 'public',
          updatedAt: new Date(),
        })
        .where(eq(releases.id, release_id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
