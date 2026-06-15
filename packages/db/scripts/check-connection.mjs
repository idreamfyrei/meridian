/* global console, process, URL */

import { existsSync } from "node:fs";
import { resolve } from "node:path";

import pg from "pg";

const { Pool } = pg;

const envPath = resolve(process.cwd(), process.argv[2] ?? "../../.env");

if (!existsSync(envPath)) {
  throw new Error(`Env file not found: ${envPath}`);
}

delete process.env.DATABASE_URL;
process.loadEnvFile(envPath);

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(`DATABASE_URL is missing in ${envPath}`);
}

const url = new URL(databaseUrl);
const isSupabase = url.hostname.includes("supabase.com");

const pool = new Pool(
  isSupabase
    ? {
        database: url.pathname.slice(1),
        host: url.hostname,
        password: decodeURIComponent(url.password),
        port: Number(url.port),
        ssl: { rejectUnauthorized: false },
        user: decodeURIComponent(url.username),
      }
    : {
        connectionString: databaseUrl,
      },
);

try {
  console.log("Checking database connection", {
    database: url.pathname.slice(1),
    host: url.host,
    passwordLength: decodeURIComponent(url.password).length,
    user: decodeURIComponent(url.username),
  });

  const identity = await pool.query(
    "select current_user, current_database(), current_schema()",
  );

  const tables = await pool.query(
    "select to_regclass('public.users') as users_table, to_regclass('public.workspaces') as workspaces_table, to_regclass('public.integration_accounts') as integration_accounts_table, to_regclass('drizzle.__drizzle_migrations') as drizzle_history_table",
  );

  console.log("Connected", identity.rows[0]);
  console.log("Tables", tables.rows[0]);
} finally {
  await pool.end();
}
