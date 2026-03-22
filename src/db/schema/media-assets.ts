import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  timestamp,
} from 'drizzle-orm/pg-core';
import { releases } from './releases';

export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  releaseId: uuid('release_id')
    .notNull()
    .references(() => releases.id, { onDelete: 'cascade' }),
  version: integer('version').notNull().default(1),
  status: text('status', {
    enum: ['processing', 'ready', 'failed', 'replaced'],
  })
    .notNull()
    .default('processing'),
  durationMs: bigint('duration_ms', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
