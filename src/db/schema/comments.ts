import {
  pgTable,
  uuid,
  text,
  bigint,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { releases } from './releases';
import { users } from './users';

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    releaseId: uuid('release_id')
      .notNull()
      .references(() => releases.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    timestampMs: bigint('timestamp_ms', { mode: 'number' }), // nullable for non-timestamped comments
    parentId: uuid('parent_id'), // self-referencing for threads
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_comments_release_ts').on(table.releaseId, table.timestampMs),
  ]
);
