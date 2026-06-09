import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

export type MeridianDb = NodePgDatabase<typeof schema>;

let pool: Pool | undefined;
let db: MeridianDb | undefined;

export function getPgPool(): Pool {
  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  return pool;
}

export function getDb(): MeridianDb {
  db ??= drizzle(getPgPool(), { schema });
  return db;
}

export { schema };
