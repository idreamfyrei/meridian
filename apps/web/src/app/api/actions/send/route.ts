import { getActionDraft, markActionDraftSent } from "@meridian/db";
import { withRequestLogContext } from "@meridian/logger";

import { getCurrentWorkspace } from "@/lib/current-workspace";

export const runtime = "nodejs";

type SendActionDraftRequest = {
  id?: unknown;
};

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const logger = withRequestLogContext(requestId, {
    route: "/api/actions/send",
  });

  const currentWorkspace = await getCurrentWorkspace();

  if (!currentWorkspace) {
    return Response.json(
      { ok: false, requestId, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = (await request.json()) as SendActionDraftRequest;

  if (typeof body.id !== "string") {
    return Response.json(
      { ok: false, requestId, error: "Action draft id is required." },
      { status: 400 },
    );
  }

  try {
    const draft = await getActionDraft(currentWorkspace.db, {
      workspaceId: currentWorkspace.workspace.id,
      id: body.id,
    });

    if (!draft) {
      return Response.json(
        { ok: false, requestId, error: "Action draft not found." },
        { status: 404 },
      );
    }

    if (draft.status !== "approved") {
      return Response.json(
        {
          ok: false,
          requestId,
          error: "Only approved drafts can be sent.",
        },
        { status: 409 },
      );
    }

    const sentDraft = await markActionDraftSent(currentWorkspace.db, {
      workspaceId: currentWorkspace.workspace.id,
      id: draft.id,
    });

    logger.info(
      {
        actionDraftId: sentDraft.id,
        dryRun: true,
        workspaceId: currentWorkspace.workspace.id,
      },
      "action draft send dry-run completed",
    );

    return Response.json({
      ok: true,
      requestId,
      dryRun: true,
      draft: sentDraft,
    });
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        workspaceId: currentWorkspace.workspace.id,
      },
      "action draft send failed",
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
