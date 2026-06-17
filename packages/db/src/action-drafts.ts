import { and, desc, eq } from "drizzle-orm";

import type { MeridianDb } from "./index";
import { actionDrafts } from "./schema";

export type ActionDraftKind =
  | "email_reply"
  | "post_meeting_email"
  | "calendar_invite";

export type ActionDraftStatus = "draft" | "approved" | "sent" | "discarded";

export type CreateActionDraftInput = {
  workspaceId: string;
  followUpItemId: string;
  kind: ActionDraftKind;
  recipient?: string | null;
  subject?: string | null;
  body?: string | null;
  scheduledFor?: Date | null;
  payload?: Record<string, unknown> | null;
};

export type UpdateActionDraftStatusInput = {
  workspaceId: string;
  id: string;
  status: ActionDraftStatus;
};

export async function createActionDraft(
  db: MeridianDb,
  input: CreateActionDraftInput,
) {
  const [draft] = await db
    .insert(actionDrafts)
    .values({
      workspaceId: input.workspaceId,
      followUpItemId: input.followUpItemId,
      kind: input.kind,
      status: "draft",
      recipient: input.recipient ?? null,
      subject: input.subject ?? null,
      body: input.body ?? null,
      scheduledFor: input.scheduledFor ?? null,
      payload: input.payload ?? null,
      updatedAt: new Date(),
    })
    .returning();

  if (!draft) {
    throw new Error("Failed to create action draft.");
  }

  return draft;
}

export async function listActionDrafts(
  db: MeridianDb,
  input: {
    workspaceId: string;
    limit?: number;
  },
) {
  return db.query.actionDrafts.findMany({
    where: eq(actionDrafts.workspaceId, input.workspaceId),
    orderBy: desc(actionDrafts.createdAt),
    limit: input.limit ?? 10,
  });
}

export async function listActionDraftsForFollowUp(
  db: MeridianDb,
  input: {
    workspaceId: string;
    followUpItemId: string;
  },
) {
  return db.query.actionDrafts.findMany({
    where: and(
      eq(actionDrafts.workspaceId, input.workspaceId),
      eq(actionDrafts.followUpItemId, input.followUpItemId),
    ),
    orderBy: desc(actionDrafts.createdAt),
  });
}

export async function getActionDraft(
  db: MeridianDb,
  input: {
    workspaceId: string;
    id: string;
  },
) {
  return db.query.actionDrafts.findFirst({
    where: and(
      eq(actionDrafts.workspaceId, input.workspaceId),
      eq(actionDrafts.id, input.id),
    ),
  });
}

export async function markActionDraftSent(
  db: MeridianDb,
  input: {
    workspaceId: string;
    id: string;
  },
) {
  return updateActionDraftStatus(db, {
    workspaceId: input.workspaceId,
    id: input.id,
    status: "sent",
  });
}

export async function updateActionDraftStatus(
  db: MeridianDb,
  input: UpdateActionDraftStatusInput,
) {
  const [draft] = await db
    .update(actionDrafts)
    .set({
      status: input.status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(actionDrafts.id, input.id),
        eq(actionDrafts.workspaceId, input.workspaceId),
      ),
    )
    .returning();

  if (!draft) {
    throw new Error("Action draft not found.");
  }

  return draft;
}
