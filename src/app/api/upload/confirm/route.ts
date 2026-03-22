import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enqueueDspJob } from '@/lib/queue';

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

    // TODO: Validate that all files are uploaded to R2
    // TODO: Perform magic-number file validation (The Trojan Problem)

    // Enqueue DSP processing job
    await enqueueDspJob({
      releaseId,
      mediaAssetId: releaseId, // Will be properly resolved from DB
      audioKey: `uploads/${user.id}/${releaseId}/`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Upload confirm error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
