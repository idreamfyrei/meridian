import { updateFollowUpItemStatus } from "@meridian/db";
import { withRequestLogContext } from "@meridian/logger";

import { getCurrentWorkspace } from "@/lib/current-workspace";

export const runtime = "nodejs";

type FollowUpStatusRequest = {
  id?: unknown;
  status?: unknown;
};

function isAllowedStatus(value: unknown) {
  return value === "handled" || value === "dismissed";
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const logger = withRequestLogContext(requestId, {
    route: "/api/loops/status",
  });

  const currentWorkspace = await getCurrentWorkspace();

  if (!currentWorkspace) {
    return Response.json(
      { ok: false, requestId, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = (await request.json()) as FollowUpStatusRequest;

  if (typeof body.id !== "string" || !isAllowedStatus(body.status)) {
    return Response.json(
      { ok: false, requestId, error: "Invalid follow-up status request." },
      { status: 400 },
    );
  }

  try {
    const item = await updateFollowUpItemStatus(currentWorkspace.db, {
      workspaceId: currentWorkspace.workspace.id,
      id: body.id,
      status: body.status,
    });

    logger.info(
      {
        followUpItemId: item.id,
        status: item.status,
        workspaceId: currentWorkspace.workspace.id,
      },
      "follow-up item status updated",
    );

    return Response.json({
      ok: true,
      requestId,
      item,
    });
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        workspaceId: currentWorkspace.workspace.id,
      },
      "follow-up item status update failed",
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
