import 'dotenv/config';
import fs from 'node:fs';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, {
	max: 1,
	ssl: process.env.DATABASE_CA
		? {
				ca: fs.readFileSync(process.env.DATABASE_CA).toString()
			}
		: void 0
});
const db = drizzle(sql);
await migrate(db, { migrationsFolder: 'drizzle' });
await sql.end();
