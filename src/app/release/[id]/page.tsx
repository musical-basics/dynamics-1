import { db } from '@/db/index';
import { releases } from '@/db/schema/releases';
import { mediaAssets } from '@/db/schema/media-assets';
import { audioTracks } from '@/db/schema/audio-tracks';
import { videoTracks } from '@/db/schema/video-tracks';
import { auxFiles } from '@/db/schema/aux-files';
import { chapters } from '@/db/schema/chapters';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ReleaseClient from './ReleaseClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReleasePage({ params }: Props) {
  const { id } = await params;

  // Fetch release with related data
  const release = await db.query.releases.findFirst({
    where: eq(releases.id, id),
  });

  if (!release || release.visibility === 'draft') {
    notFound();
  }

  const creator = await db.query.users.findFirst({
    where: eq(users.id, release.creatorId),
  });

  let audioTrack = null;
  let videoTrack = null;
  let releaseAuxFiles: { id: string; fileType: string; fileUrl: string; languageCode: string | null }[] = [];
  let releaseChapters: { id: string; title: string; timestampMs: number; sortOrder: number }[] = [];

  if (release.currentMediaAssetId) {
    audioTrack = await db.query.audioTracks.findFirst({
      where: eq(audioTracks.mediaAssetId, release.currentMediaAssetId),
    });
    videoTrack = await db.query.videoTracks.findFirst({
      where: eq(videoTracks.mediaAssetId, release.currentMediaAssetId),
    });
    releaseAuxFiles = await db
      .select()
      .from(auxFiles)
      .where(eq(auxFiles.mediaAssetId, release.currentMediaAssetId));
  }

  releaseChapters = await db
    .select()
    .from(chapters)
    .where(eq(chapters.releaseId, id));

  return (
    <ReleaseClient
      release={{
        id: release.id,
        title: release.title,
        description: release.description,
        creatorName: creator?.displayName || 'Unknown Artist',
        playCount: release.playCount || 0,
        opusUrl: audioTrack?.opusUrl || null,
        flacUrl: audioTrack?.flacUrl || null,
        hlsManifestUrl: videoTrack?.hlsManifestUrl || null,
        gainOffsetDb: audioTrack?.gainOffsetDb || 0,
        durationMs: 0, // Will be populated from media asset
        lufsRaw: audioTrack?.lufsRaw || null,
        spectralFlatness: audioTrack?.spectralFlatness || null,
      }}
      auxFiles={releaseAuxFiles}
      chapters={releaseChapters}
    />
  );
}
