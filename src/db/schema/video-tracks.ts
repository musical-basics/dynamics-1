import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';
import { mediaAssets } from './media-assets';

export const videoTracks = pgTable('video_tracks', {
  id: uuid('id').primaryKey().defaultRandom(),
  mediaAssetId: uuid('media_asset_id')
    .unique()
    .notNull()
    .references(() => mediaAssets.id, { onDelete: 'cascade' }),
  hlsManifestUrl: text('hls_manifest_url'),
  resolutionTiers: jsonb('resolution_tiers').default('["1080p","720p","480p"]'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
