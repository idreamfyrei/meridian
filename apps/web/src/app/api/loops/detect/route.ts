import {
  listReplyNeededEmailCandidates,
  upsertFollowUpItem,
} from "@meridian/db";
import { withRequestLogContext } from "@meridian/logger";

import { getCurrentWorkspace } from "@/lib/current-workspace";

export const runtime = "nodejs";

export async function POST() {
  const requestId = crypto.randomUUID();
  const logger = withRequestLogContext(requestId, {
    route: "/api/loops/detect",
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
    const candidates = await listReplyNeededEmailCandidates(
      currentWorkspace.db,
      currentWorkspace.workspace.id,
      20,
    );

    let createdCount = 0;

    for (const candidate of candidates) {
      if (!candidate.from || !candidate.snippet) {
        continue;
      }

      await upsertFollowUpItem(currentWorkspace.db, {
        workspaceId: currentWorkspace.workspace.id,
        type: "reply_needed",
        title: candidate.subject ?? "Reply needed",
        reason: `Recent email from ${candidate.from}`,
        suggestedAction: "Review the thread and draft a reply.",
        confidence: 50,
        sourceEmailThreadId: candidate.id,
        dueAt: candidate.lastMessageAt,
      });

      createdCount += 1;
    }

    logger.info(
      {
        candidateCount: candidates.length,
        createdCount,
        workspaceId: currentWorkspace.workspace.id,
      },
      "loop detection completed",
    );

    return Response.json({
      ok: true,
      requestId,
      candidateCount: candidates.length,
      createdCount,
    });
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        workspaceId: currentWorkspace.workspace.id,
      },
      "loop detection failed",
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
