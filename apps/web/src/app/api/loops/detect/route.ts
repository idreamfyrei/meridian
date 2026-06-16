import {
  listReplyNeededEmailCandidates,
  upsertFollowUpItem,
} from "@meridian/db";
import { withRequestLogContext } from "@meridian/logger";

import { getCurrentWorkspace } from "@/lib/current-workspace";

export const runtime = "nodejs";

function isLikelyAutomatedSender(value: string) {
  const normalized = value.toLowerCase();

  return (
    normalized.includes("no-reply") ||
    normalized.includes("noreply") ||
    normalized.includes("notification") ||
    normalized.includes("newsletter") ||
    normalized.includes("updates@") ||
    normalized.includes("support@")
  );
}

function isUsefulReplyCandidate(candidate: {
  from: string | null;
  snippet: string | null;
  subject: string | null;
}) {
  if (!candidate.from || !candidate.snippet) {
    return false;
  }

  if (isLikelyAutomatedSender(candidate.from)) {
    return false;
  }

  if (candidate.subject?.toLowerCase().startsWith("fwd:")) {
    return false;
  }

  return true;
}

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
      if (!isUsefulReplyCandidate(candidate)) {
        continue;
      }

      await upsertFollowUpItem(currentWorkspace.db, {
        workspaceId: currentWorkspace.workspace.id,
        type: "reply_needed",
        title: candidate.subject ?? `Reply to ${candidate.from}`,
        reason: `Recent message from ${candidate.from} looks like it may need a response.`,
        suggestedAction: "Review the message and decide whether to reply.",
        confidence: 60,
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
