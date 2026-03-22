import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Use the pooled connection string from Supabase PgBouncer
const connectionString = process.env.DATABASE_URL;

// For serverless: limit connection pool
const client = postgres(connectionString, {
  max: 1,
  prepare: false, // Required for PgBouncer transaction mode
});

export const db = drizzle(client);
