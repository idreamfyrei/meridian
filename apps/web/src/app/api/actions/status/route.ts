import { updateActionDraftStatus } from "@meridian/db";
import { withRequestLogContext } from "@meridian/logger";

import { getCurrentWorkspace } from "@/lib/current-workspace";

export const runtime = "nodejs";

type ActionDraftStatusRequest = {
  id?: unknown;
  status?: unknown;
};

function isAllowedStatus(value: unknown) {
  return value === "approved" || value === "discarded";
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const logger = withRequestLogContext(requestId, {
    route: "/api/actions/status",
  });

  const currentWorkspace = await getCurrentWorkspace();

  if (!currentWorkspace) {
    return Response.json(
      { ok: false, requestId, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = (await request.json()) as ActionDraftStatusRequest;

  if (typeof body.id !== "string" || !isAllowedStatus(body.status)) {
    return Response.json(
      { ok: false, requestId, error: "Invalid action draft status request." },
      { status: 400 },
    );
  }

  try {
    const draft = await updateActionDraftStatus(currentWorkspace.db, {
      workspaceId: currentWorkspace.workspace.id,
      id: body.id,
      status: body.status,
    });

    logger.info(
      {
        actionDraftId: draft.id,
        status: draft.status,
        workspaceId: currentWorkspace.workspace.id,
      },
      "action draft status updated",
    );

    return Response.json({
      ok: true,
      requestId,
      draft,
    });
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        workspaceId: currentWorkspace.workspace.id,
      },
      "action draft status update failed",
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
