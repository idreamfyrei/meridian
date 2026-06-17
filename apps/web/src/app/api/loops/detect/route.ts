import {
  listPostMeetingFollowUpCandidates,
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
    const replyCandidates = await listReplyNeededEmailCandidates(
      currentWorkspace.db,
      currentWorkspace.workspace.id,
      20,
    );

    let createdCount = 0;
    let postMeetingCandidateCount = 0;
    let postMeetingCreatedCount = 0;
    let replyCreatedCount = 0;
    let forwardedSubjectCount = 0;
    let missingSenderCount = 0;
    let missingSnippetCount = 0;
    let automatedSenderCount = 0;

    for (const candidate of replyCandidates) {
      if (!candidate.from) {
        missingSenderCount += 1;
        continue;
      }

      if (!candidate.snippet) {
        missingSnippetCount += 1;
        continue;
      }

      if (isLikelyAutomatedSender(candidate.from)) {
        automatedSenderCount += 1;
        continue;
      }

      if (candidate.subject?.toLowerCase().startsWith("fwd:")) {
        forwardedSubjectCount += 1;
        continue;
      }

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
      replyCreatedCount += 1;
    }

    const now = new Date();
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);

    const postMeetingCandidates = await listPostMeetingFollowUpCandidates(
      currentWorkspace.db,
      {
        workspaceId: currentWorkspace.workspace.id,
        timeMin: threeDaysAgo,
        timeMax: now,
        limit: 20,
      },
    );

    postMeetingCandidateCount = postMeetingCandidates.length;

    for (const candidate of postMeetingCandidates) {
      await upsertFollowUpItem(currentWorkspace.db, {
        workspaceId: currentWorkspace.workspace.id,
        type: "post_meeting_follow_up",
        title: `Follow up: ${candidate.summary ?? "Recent meeting"}`,
        reason: "Recent calendar event may need a follow-up.",
        suggestedAction: "Send a short recap or next-steps note.",
        confidence: 50,
        sourceCalendarEventId: candidate.id,
        dueAt: candidate.endsAt,
      });

      createdCount += 1;
      postMeetingCreatedCount += 1;
    }

    logger.info(
      {
        automatedSenderCount,
        candidateCount: replyCandidates.length,
        createdCount,
        forwardedSubjectCount,
        missingSenderCount,
        missingSnippetCount,
        postMeetingCandidateCount,
        postMeetingCreatedCount,
        replyCreatedCount,
        workspaceId: currentWorkspace.workspace.id,
      },
      "loop detection completed",
    );

    return Response.json({
      ok: true,
      requestId,
      automatedSenderCount,
      candidateCount: replyCandidates.length,
      createdCount,
      forwardedSubjectCount,
      missingSenderCount,
      missingSnippetCount,
      postMeetingCandidateCount,
      postMeetingCreatedCount,
      replyCreatedCount,
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
