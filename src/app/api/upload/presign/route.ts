import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from '@/db/index';
import { releases } from '@/db/schema/releases';
import { mediaAssets } from '@/db/schema/media-assets';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Allowed MIME types (magic number validation happens server-side on confirm)
const ALLOWED_TYPES = new Set([
  'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac',
  'audio/aiff', 'audio/x-aiff',
  'video/mp4', 'video/quicktime',
  'application/xml', 'text/xml',
  'audio/midi', 'audio/x-midi',
  'text/vtt', 'application/x-subrip',
  'application/octet-stream', // Fallback for browsers that don't detect MIME
]);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, files } = body;

    if (!title || !files?.length) {
      return NextResponse.json({ error: 'Title and files required' }, { status: 400 });
    }

    // Create draft release
    const [release] = await db.insert(releases).values({
      creatorId: user.id,
      title,
      description: description || null,
      visibility: 'draft',
    }).returning();

    // Create initial media asset
    const [mediaAsset] = await db.insert(mediaAssets).values({
      releaseId: release.id,
      version: 1,
      status: 'processing',
    }).returning();

    // Generate pre-signed URLs for each file
    const uploadUrls = await Promise.all(
      files.map(async (file: { name: string; type: string; contentType: string }) => {
        const key = `uploads/${user.id}/${release.id}/${file.name}`;

        const command = new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: key,
          ContentType: file.contentType || 'application/octet-stream',
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 900 }); // 15 minutes

        return { name: file.name, key, url };
      })
    );

    return NextResponse.json({
      releaseId: release.id,
      mediaAssetId: mediaAsset.id,
      uploadUrls,
    });
  } catch (error) {
    console.error('Presign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
