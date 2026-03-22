import {
  pgTable,
  uuid,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { mediaAssets } from './media-assets';

export const auxFiles = pgTable('aux_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  mediaAssetId: uuid('media_asset_id')
    .notNull()
    .references(() => mediaAssets.id, { onDelete: 'cascade' }),
  fileType: text('file_type', {
    enum: ['midi', 'musicxml', 'webvtt', 'srt'],
  }).notNull(),
  fileUrl: text('file_url').notNull(),
  languageCode: text('language_code'), // e.g., 'it', 'en' for opera translations
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
