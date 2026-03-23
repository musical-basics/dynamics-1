import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enqueueDspJob } from '@/lib/queue';
import { db } from '@/db/index';
import { releases } from '@/db/schema/releases';
import { mediaAssets } from '@/db/schema/media-assets';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { releaseId } = await request.json();

    if (!releaseId) {
      return NextResponse.json({ error: 'releaseId required' }, { status: 400 });
    }

    // Try to enqueue DSP processing job
    let workerQueued = false;
    try {
      await enqueueDspJob({
        releaseId,
        mediaAssetId: releaseId,
        audioKey: `uploads/${user.id}/${releaseId}/`,
      });
      workerQueued = true;
    } catch (workerError) {
      console.warn('Worker unavailable, marking release as ready without DSP:', workerError);

      // Fallback: mark release as public and media asset as ready
      await db.update(mediaAssets)
        .set({ status: 'ready' })
        .where(eq(mediaAssets.releaseId, releaseId));

      await db.update(releases)
        .set({ visibility: 'public', updatedAt: new Date() })
        .where(eq(releases.id, releaseId));
    }

    return NextResponse.json({
      success: true,
      workerQueued,
      message: workerQueued
        ? 'Processing started'
        : 'Published without DSP analysis (worker unavailable)',
    });
  } catch (error) {
    console.error('Upload confirm error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

