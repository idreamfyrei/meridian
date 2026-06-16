import { listTenantInboxMessages } from "@meridian/corsair";
import { withRequestLogContext } from "@meridian/logger";

import { getCurrentWorkspace } from "@/lib/current-workspace";

export const runtime = "nodejs";

export async function GET() {
  const requestId = crypto.randomUUID();
  const logger = withRequestLogContext(requestId, {
    route: "/api/email/inbox",
  });

  const currentWorkspace = await getCurrentWorkspace();

  if (!currentWorkspace) {
    return Response.json(
      {
        ok: false,
        requestId,
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    const inbox = await listTenantInboxMessages({
      workspaceId: currentWorkspace.workspace.id,
    });

    logger.info(
      {
        workspaceId: currentWorkspace.workspace.id,
      },
      "gmail inbox loaded",
    );

    return Response.json({
      ok: true,
      requestId,
      inbox,
    });
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        workspaceId: currentWorkspace.workspace.id,
      },
      "gmail inbox failed",
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
