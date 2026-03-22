import {
  pgTable,
  uuid,
  text,
  real,
  timestamp,
} from 'drizzle-orm/pg-core';

export const sponsorAudioTracks = pgTable('sponsor_audio_tracks', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandName: text('brand_name').notNull(),
  campaignName: text('campaign_name'),
  status: text('status', {
    enum: ['pending', 'approved', 'active', 'expired'],
  })
    .notNull()
    .default('pending'),
  audioUrl: text('audio_url').notNull(),
  lufsRaw: real('lufs_raw'),
  spectralFlatness: real('spectral_flatness'),
  gainOffsetDb: real('gain_offset_db'),
  targetGenres: text('target_genres'), // JSON string of genre tags
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
