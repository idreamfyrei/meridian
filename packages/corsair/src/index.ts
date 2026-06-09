import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";
import { createCorsair } from "corsair";
import { Pool } from "pg";

let pool: Pool | undefined;
let corsair: ReturnType<typeof createCorsair> | undefined;

function getCorsairPool(): Pool {
  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
  });

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
