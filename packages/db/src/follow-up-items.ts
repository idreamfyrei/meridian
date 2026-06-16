import { and, asc, eq } from "drizzle-orm";

import type { MeridianDb } from "./index";
import { followUpItems } from "./schema";

export type FollowUpItemType =
  | "reply_needed"
  | "scheduling_needed"
  | "post_meeting_follow_up";

export type FollowUpItemStatus = "open" | "snoozed" | "dismissed" | "handled";

export type UpsertFollowUpItemInput = {
  workspaceId: string;
  type: FollowUpItemType;
  title: string;
  reason?: string | null;
  suggestedAction?: string | null;
  confidence?: number | null;
  sourceEmailThreadId?: string | null;
  sourceCalendarEventId?: string | null;
  dueAt?: Date | null;
};

export type UpdateFollowUpItemStatusInput = {
  workspaceId: string;
  id: string;
  status: FollowUpItemStatus;
  snoozedUntil?: Date | null;
};

function getFollowUpValues(input: UpsertFollowUpItemInput, now: Date) {
  return {
    workspaceId: input.workspaceId,
    type: input.type,
    status: "open" as const,
    title: input.title,
    reason: input.reason ?? null,
    suggestedAction: input.suggestedAction ?? null,
    confidence: input.confidence ?? null,
    sourceEmailThreadId: input.sourceEmailThreadId ?? null,
    sourceCalendarEventId: input.sourceCalendarEventId ?? null,
    dueAt: input.dueAt ?? null,
    snoozedUntil: null,
    updatedAt: now,
  };
}

function getFollowUpUpdateSet(input: UpsertFollowUpItemInput, now: Date) {
  return {
    status: "open" as const,
    title: input.title,
    reason: input.reason ?? null,
    suggestedAction: input.suggestedAction ?? null,
    confidence: input.confidence ?? null,
    dueAt: input.dueAt ?? null,
    snoozedUntil: null,
    updatedAt: now,
  };
}

export async function upsertFollowUpItem(
  db: MeridianDb,
  input: UpsertFollowUpItemInput,
) {
  const now = new Date();

  if (input.sourceEmailThreadId) {
    const [item] = await db
      .insert(followUpItems)
      .values(getFollowUpValues(input, now))
      .onConflictDoUpdate({
        target: [
          followUpItems.workspaceId,
          followUpItems.type,
          followUpItems.sourceEmailThreadId,
        ],
        set: getFollowUpUpdateSet(input, now),
      })
      .returning();

    if (!item) {
      throw new Error("Failed to upsert email follow-up item.");
    }

    return item;
  }

  if (input.sourceCalendarEventId) {
    const [item] = await db
      .insert(followUpItems)
      .values(getFollowUpValues(input, now))
      .onConflictDoUpdate({
        target: [
          followUpItems.workspaceId,
          followUpItems.type,
          followUpItems.sourceCalendarEventId,
        ],
        set: getFollowUpUpdateSet(input, now),
      })
      .returning();

    if (!item) {
      throw new Error("Failed to upsert calendar follow-up item.");
    }

    return item;
  }

  const [item] = await db
    .insert(followUpItems)
    .values(getFollowUpValues(input, now))
    .returning();

  if (!item) {
    throw new Error("Failed to create follow-up item.");
  }

  return item;
}

export async function listOpenFollowUpItems(
  db: MeridianDb,
  workspaceId: string,
  limit = 20,
) {
  return db.query.followUpItems.findMany({
    where: and(
      eq(followUpItems.workspaceId, workspaceId),
      eq(followUpItems.status, "open"),
    ),
    orderBy: asc(followUpItems.createdAt),
    limit,
  });
}

export async function updateFollowUpItemStatus(
  db: MeridianDb,
  input: UpdateFollowUpItemStatusInput,
) {
  const [item] = await db
    .update(followUpItems)
    .set({
      status: input.status,
      snoozedUntil: input.snoozedUntil ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(followUpItems.id, input.id),
        eq(followUpItems.workspaceId, input.workspaceId),
      ),
    )
    .returning();

  if (!item) {
    throw new Error("Follow-up item not found.");
  }

  return item;
}
