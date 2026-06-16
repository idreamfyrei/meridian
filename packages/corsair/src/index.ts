import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";
import { createCorsair, setupCorsair } from "corsair";
import { Pool, type PoolConfig } from "pg";

import { getOptionalServerEnv } from "@meridian/config";

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

export async function ensureGoogleOAuthCredentials() {
  const env = getOptionalServerEnv();

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required to configure Google OAuth.",
    );
  }

  const corsair = getCorsair();

  await Promise.all([
    corsair.keys.gmail.set_client_id(env.GOOGLE_CLIENT_ID),
    corsair.keys.gmail.set_client_secret(env.GOOGLE_CLIENT_SECRET),
    corsair.keys.googlecalendar.set_client_id(env.GOOGLE_CLIENT_ID),
    corsair.keys.googlecalendar.set_client_secret(env.GOOGLE_CLIENT_SECRET),
  ]);
}
