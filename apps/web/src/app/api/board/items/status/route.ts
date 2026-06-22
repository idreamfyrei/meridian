import { updateWorkItemStatus, type WorkItemStatus } from "@meridian/db";
import { withRequestLogContext } from "@meridian/logger";

import { getCurrentWorkspace } from "@/lib/current-workspace";

export const runtime = "nodejs";

type WorkItemStatusRequest = {
  id?: unknown;
  status?: unknown;
};

function isAllowedStatus(value: unknown): value is WorkItemStatus {
  return (
    value === "triage" ||
    value === "ready" ||
    value === "in_progress" ||
    value === "waiting" ||
    value === "done"
  );
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const logger = withRequestLogContext(requestId, {
    route: "/api/board/items/status",
  });

  const currentWorkspace = await getCurrentWorkspace();

  if (!currentWorkspace) {
    return Response.json(
      { ok: false, requestId, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = (await request.json()) as WorkItemStatusRequest;

  if (typeof body.id !== "string" || !isAllowedStatus(body.status)) {
    return Response.json(
      { ok: false, requestId, error: "Invalid work item status request." },
      { status: 400 },
    );
  }

  try {
    const item = await updateWorkItemStatus(currentWorkspace.db, {
      workspaceId: currentWorkspace.workspace.id,
      id: body.id,
      status: body.status,
    });

    logger.info(
      {
        status: item.status,
        workItemId: item.id,
        workspaceId: currentWorkspace.workspace.id,
      },
      "work item status updated",
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
      "work item status update failed",
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
