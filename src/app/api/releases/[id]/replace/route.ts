import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db/index';
import { releases } from '@/db/schema/releases';
import { mediaAssets } from '@/db/schema/media-assets';
import { eq } from 'drizzle-orm';
import { enqueueDspJob } from '@/lib/queue';
import { purgeCache } from '@/lib/cloudflare/purgeCache';

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: releaseId } = await params;
    const body = await request.json();

    // Verify ownership
    const release = await db.query.releases.findFirst({
      where: eq(releases.id, releaseId),
    });

    if (!release || release.creatorId !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const { replaceType, uploadKey, confirmDrift } = body;

    // Get current media asset
    const currentAsset = release.currentMediaAssetId
      ? await db.query.mediaAssets.findFirst({
          where: eq(mediaAssets.id, release.currentMediaAssetId),
        })
      : null;

    // Create new media_assets row with version N+1
    const newVersion = (currentAsset?.version || 0) + 1;
    const [newAsset] = await db.insert(mediaAssets).values({
      releaseId,
      version: newVersion,
      status: 'processing',
    }).returning();

    // Duration validation (if we have the old duration)
    if (currentAsset?.durationMs && !confirmDrift) {
      // TODO: Get new file duration from worker pre-flight
      // For now, return to client that processing will check duration
    }

    // Soft-delete old media asset
    if (currentAsset) {
      await db
        .update(mediaAssets)
        .set({ status: 'replaced' })
        .where(eq(mediaAssets.id, currentAsset.id));
    }

    // Update release pointer
    await db
      .update(releases)
      .set({
        currentMediaAssetId: newAsset.id,
        updatedAt: new Date(),
      })
      .where(eq(releases.id, releaseId));

    // If audio replacement, trigger SDD recalculation
    if (replaceType === 'audio') {
      await enqueueDspJob({
        releaseId,
        mediaAssetId: newAsset.id,
        audioKey: uploadKey,
      });
    }

    // Purge CDN cache for old URLs
    try {
      await purgeCache(releaseId);
    } catch (err) {
      console.warn('Cache purge failed (non-critical):', err);
    }

    return NextResponse.json({
      success: true,
      newMediaAssetId: newAsset.id,
      version: newVersion,
    });
  } catch (error) {
    console.error('Replace error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
