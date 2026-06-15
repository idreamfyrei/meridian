import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "drizzle-kit";

const rootEnvPath = resolve(process.cwd(), "../../.env");

if (!process.env.DATABASE_URL && existsSync(rootEnvPath)) {
  process.loadEnvFile(rootEnvPath);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run Drizzle commands.");
}

const dbUrl = new URL(databaseUrl);
const dbCredentials = databaseUrl.includes("supabase.com")
  ? {
      database: dbUrl.pathname.slice(1),
      host: dbUrl.hostname,
      password: decodeURIComponent(dbUrl.password),
      port: Number(dbUrl.port),
      ssl: { rejectUnauthorized: false },
      user: decodeURIComponent(dbUrl.username),
    }
  : {
      url: databaseUrl,
    };

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials,
});
