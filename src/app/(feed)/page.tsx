import { db } from '@/db/index';
import { releases } from '@/db/schema/releases';
import { users } from '@/db/schema/users';
import { mediaAssets } from '@/db/schema/media-assets';
import { audioTracks } from '@/db/schema/audio-tracks';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';

export default async function DiscoveryFeed() {
  // Fetch public releases with creator info
  const feedReleases = await db
    .select({
      id: releases.id,
      title: releases.title,
      description: releases.description,
      playCount: releases.playCount,
      createdAt: releases.createdAt,
      creatorName: users.displayName,
      durationMs: mediaAssets.durationMs,
      gainOffsetDb: audioTracks.gainOffsetDb,
    })
    .from(releases)
    .leftJoin(users, eq(releases.creatorId, users.id))
    .leftJoin(mediaAssets, eq(releases.currentMediaAssetId, mediaAssets.id))
    .leftJoin(audioTracks, eq(audioTracks.mediaAssetId, mediaAssets.id))
    .where(eq(releases.visibility, 'public'))
    .orderBy(desc(releases.createdAt))
    .limit(30);

  function formatDuration(ms: number | null): string {
    if (!ms) return '—';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-8 pb-24">
      <div className="max-w-7xl mx-auto w-full">
        <h1 className="text-4xl font-bold mb-8">
          Discover<span className="text-accent">.</span>
        </h1>

        {/* Sorting Tabs */}
        <div className="flex gap-4 mb-8">
          {['Trending', 'New', 'For You'].map((tab) => (
            <button
              key={tab}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                tab === 'New'
                  ? 'bg-surface-elevated text-foreground'
                  : 'text-text-secondary hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Masonry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {feedReleases.map((release) => (
            <Link
              key={release.id}
              href={`/release/${release.id}`}
              className="group block bg-surface rounded-xl border border-border overflow-hidden hover:border-text-tertiary transition-all hover:scale-[1.02]"
            >
              {/* Thumbnail placeholder */}
              <div className="aspect-video bg-surface-elevated flex items-center justify-center">
                <span className="text-4xl opacity-30">🎵</span>
              </div>

              {/* Info */}
              <div className="p-4 space-y-1">
                <h3 className="font-medium text-sm truncate group-hover:text-accent transition-colors">
                  {release.title}
                </h3>
                <p className="text-xs text-text-secondary truncate">
                  {release.creatorName || 'Unknown Artist'}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-text-tertiary pt-1">
                  <span>{(release.playCount || 0).toLocaleString()} plays</span>
                  <span>{formatDuration(release.durationMs)}</span>
                  {release.gainOffsetDb !== null && release.gainOffsetDb !== 0 && (
                    <span className="text-accent/60">
                      SDD {release.gainOffsetDb > 0 ? '+' : ''}{release.gainOffsetDb?.toFixed(1)} dB
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {feedReleases.length === 0 && (
          <div className="text-center py-20">
            <p className="text-text-secondary">No releases yet. Be the first to upload!</p>
          </div>
        )}
      </div>
    </main>
  );
}
