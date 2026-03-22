import {
  pgTable,
  uuid,
  text,
  real,
  timestamp,
  customType,
} from 'drizzle-orm/pg-core';
import { audioTracks } from './audio-tracks';

// Custom type for pgvector — Drizzle doesn't have built-in vector support
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(128)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    // pgvector returns values like "[1,2,3]"
    return value
      .replace(/[\[\]]/g, '')
      .split(',')
      .map(Number);
  },
});

export const audioFeatures = pgTable('audio_features', {
  id: uuid('id').primaryKey().defaultRandom(),
  audioTrackId: uuid('audio_track_id')
    .unique()
    .notNull()
    .references(() => audioTracks.id, { onDelete: 'cascade' }),
  featureVector: vector('feature_vector'),
  tempo: real('tempo'),
  key: text('key'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
