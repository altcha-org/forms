import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './db/schema.js';
import { env } from './env.js';

const pgClient = postgres(env.DATABASE_URL);

export const db = drizzle(pgClient, {
	schema
});
