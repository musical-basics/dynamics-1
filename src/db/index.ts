import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let _db: PostgresJsDatabase<typeof schema> | null = null;

function createDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const client = postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false, // Required for PgBouncer transaction mode
  });

  return drizzle(client, { schema });
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    if (!_db) {
      _db = createDb();
    }
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});

