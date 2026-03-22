import {
  pgTable,
  uuid,
  text,
  bigint,
  timestamp,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const releases = pgTable('releases', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  visibility: text('visibility', {
    enum: ['draft', 'public', 'unlisted', 'private'],
  })
    .notNull()
    .default('draft'),
  playCount: bigint('play_count', { mode: 'number' }).default(0),
  currentMediaAssetId: uuid('current_media_asset_id'), // FK added after media_assets created
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
