import { ensureTenantCorsairSetup } from "@meridian/corsair";
import { withRequestLogContext } from "@meridian/logger";

import { getCurrentWorkspace } from "@/lib/current-workspace";

export const runtime = "nodejs";

export async function POST() {
  const requestId = crypto.randomUUID();
  const logger = withRequestLogContext(requestId, {
    route: "/api/corsair/setup",
  });

  const currentWorkspace = await getCurrentWorkspace();

  if (!currentWorkspace) {
    logger.warn("corsair setup requested without an authenticated user");

    return Response.json(
      {
        ok: false,
        requestId,
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }

  const { workspace } = currentWorkspace;

  logger.info(
    {
      workspaceId: workspace.id,
    },
    "corsair tenant setup started",
  );

  try {
    const output = await ensureTenantCorsairSetup(workspace.id);

    logger.info(
      {
        workspaceId: workspace.id,
      },
      "corsair tenant setup completed",
    );

    return Response.json({
      ok: true,
      requestId,
      workspaceId: workspace.id,
      output,
    });
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        workspaceId: workspace.id,
      },
      "corsair tenant setup failed",
    );

    return Response.json(
      {
        ok: false,
        requestId,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
