import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

export { getIntegrationConnectionStatuses } from "./integration-accounts";
export { ensureUserWorkspace } from "./workspaces";

import * as schema from "./schema";

export type MeridianDb = NodePgDatabase<typeof schema>;

let pool: Pool | undefined;
let db: MeridianDb | undefined;

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  return databaseUrl;
}

function getPoolConnectionConfig(): PoolConfig {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl.includes("supabase.com")) {
    return {
      connectionString: databaseUrl,
    };
  }

  const url = new URL(databaseUrl);

  return {
    database: url.pathname.slice(1),
    host: url.hostname,
    password: decodeURIComponent(url.password),
    port: Number(url.port),
    ssl: {
      rejectUnauthorized: false,
    },
    user: decodeURIComponent(url.username),
  };
}

export function getPgPool(): Pool {
  pool ??= new Pool(getPoolConnectionConfig());

  return pool;
}

export function getDb(): MeridianDb {
  db ??= drizzle(getPgPool(), { schema });
  return db;
}

export { schema };
