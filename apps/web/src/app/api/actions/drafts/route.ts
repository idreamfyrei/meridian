import {
  createActionDraft,
  getFollowUpItem,
  type ActionDraftKind,
} from "@meridian/db";
import { withRequestLogContext } from "@meridian/logger";

import { getCurrentWorkspace } from "@/lib/current-workspace";

export const runtime = "nodejs";

function getDraftKind(type: string): ActionDraftKind {
  if (type === "post_meeting_follow_up") {
    return "post_meeting_email";
  }

  if (type === "scheduling_needed") {
    return "calendar_invite";
  }

  return "email_reply";
}

function getDraftCopy(item: {
  title: string;
  suggestedAction: string | null;
  type: string;
}) {
  if (item.type === "post_meeting_follow_up") {
    return {
      subject: item.title,
      body: "Hi,\n\nThanks for the meeting. I wanted to follow up with next steps.\n\nBest,\n",
    };
  }

  if (item.type === "scheduling_needed") {
    return {
      subject: item.title,
      body: "Hi,\n\nI can send over a calendar invite. Please confirm what time works best.\n\nBest,\n",
    };
  }

  return {
    subject: item.title,
    body:
      item.suggestedAction ??
      "Hi,\n\nThanks for the note. I wanted to follow up on this.\n\nBest,\n",
  };
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const logger = withRequestLogContext(requestId, {
    route: "/api/actions/drafts",
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

  const body = (await request.json()) as {
    followUpItemId?: string;
  };

  if (!body.followUpItemId) {
    return Response.json(
      {
        ok: false,
        requestId,
        error: "followUpItemId is required.",
      },
      { status: 400 },
    );
  }

  try {
    const item = await getFollowUpItem(currentWorkspace.db, {
      workspaceId: currentWorkspace.workspace.id,
      id: body.followUpItemId,
    });

    if (!item) {
      return Response.json(
        {
          ok: false,
          requestId,
          error: "Follow-up item not found.",
        },
        { status: 404 },
      );
    }

    const draftCopy = getDraftCopy(item);

    const draft = await createActionDraft(currentWorkspace.db, {
      workspaceId: currentWorkspace.workspace.id,
      followUpItemId: item.id,
      kind: getDraftKind(item.type),
      subject: draftCopy.subject,
      body: draftCopy.body,
      payload: {
        sourceType: item.type,
      },
    });

    logger.info(
      {
        draftId: draft.id,
        followUpItemId: item.id,
        workspaceId: currentWorkspace.workspace.id,
      },
      "action draft created",
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
      "action draft creation failed",
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
