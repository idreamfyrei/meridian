import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";
import { createCorsair, setupCorsair } from "corsair";
import { Pool, type PoolConfig } from "pg";

let pool: Pool | undefined;
let corsair: ReturnType<typeof createCorsair> | undefined;

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  return databaseUrl;
}

function getCorsairPoolConfig(): PoolConfig {
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

function getCorsairPool(): Pool {
  pool ??= new Pool(getCorsairPoolConfig());

  return pool;
}

export function getCorsair() {
  corsair ??= createCorsair({
    database: getCorsairPool(),
    kek: process.env.CORSAIR_KEK ?? "",
    multiTenancy: true,
    plugins: [gmail(), googlecalendar()],
  });

  return corsair;
}

export function getTenantCorsair(workspaceId: string) {
  return getCorsair().withTenant(workspaceId);
}

export async function ensureTenantCorsairSetup(workspaceId: string) {
  return setupCorsair(getCorsair(), {
    tenantId: workspaceId,
  });
}
