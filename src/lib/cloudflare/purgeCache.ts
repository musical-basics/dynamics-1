/**
 * Cloudflare CDN cache purge utility.
 * Purges edge-cached media files when a release's assets are replaced.
 */

export async function purgeCache(releaseId: string): Promise<void> {
  const zoneId = process.env.CF_ZONE_ID;
  const apiToken = process.env.CF_API_TOKEN;
  const publicUrl = process.env.R2_PUBLIC_URL || '';

  if (!zoneId || !apiToken) {
    console.warn('Cloudflare credentials not configured, skipping cache purge');
    return;
  }

  // Purge all media files for this release
  const prefixedUrls = [
    `${publicUrl}/media/${releaseId}/audio/master.flac`,
    `${publicUrl}/media/${releaseId}/audio/stream.opus`,
    `${publicUrl}/media/${releaseId}/video/master.m3u8`,
    `${publicUrl}/media/${releaseId}/video/0/stream.m3u8`,
    `${publicUrl}/media/${releaseId}/video/1/stream.m3u8`,
    `${publicUrl}/media/${releaseId}/video/2/stream.m3u8`,
  ];

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: prefixedUrls }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cache purge failed: ${response.status} ${text}`);
  }
}
