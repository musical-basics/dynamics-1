import {
  pgTable,
  uuid,
  text,
  bigint,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { releases } from './releases';

export const chapters = pgTable(
  'chapters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    releaseId: uuid('release_id')
      .notNull()
      .references(() => releases.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    timestampMs: bigint('timestamp_ms', { mode: 'number' }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [
    index('idx_chapters_release').on(table.releaseId, table.sortOrder),
  ]
);
