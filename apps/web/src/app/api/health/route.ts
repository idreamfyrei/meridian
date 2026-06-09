import { getOptionalServerEnv } from "@meridian/config";
import { withRequestLogContext } from "@meridian/logger";

export const runtime = "nodejs";

export function GET() {
  const requestId = crypto.randomUUID();
  const logger = withRequestLogContext(requestId, { route: "/api/health" });
  const env = getOptionalServerEnv();

  logger.info("health check requested");

  return Response.json({
    ok: true,
    service: "meridian-web",
    requestId,
    environment: env.NODE_ENV ?? "development",
  });
}
