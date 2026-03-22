import {
  pgTable,
  uuid,
  text,
  real,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';
import { mediaAssets } from './media-assets';

export const audioTracks = pgTable('audio_tracks', {
  id: uuid('id').primaryKey().defaultRandom(),
  mediaAssetId: uuid('media_asset_id')
    .unique()
    .notNull()
    .references(() => mediaAssets.id, { onDelete: 'cascade' }),
  lufsRaw: real('lufs_raw'),
  spectralFlatness: real('spectral_flatness'),
  gainOffsetDb: real('gain_offset_db'),
  flacUrl: text('flac_url'),
  opusUrl: text('opus_url'),
  sampleRate: integer('sample_rate'),
  bitDepth: integer('bit_depth'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
