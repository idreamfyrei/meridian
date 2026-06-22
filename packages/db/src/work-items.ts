import { and, asc, eq } from "drizzle-orm";

import type { MeridianDb } from "./index";
import { listOpenFollowUpItems } from "./follow-up-items";
import { boards, workItems } from "./schema";

export type WorkItemStatus =
  | "triage"
  | "ready"
  | "in_progress"
  | "waiting"
  | "done";

export type CreateWorkItemInput = {
  workspaceId: string;
  boardId: string;
  title: string;
  description?: string | null;
  status?: WorkItemStatus;
  dueAt?: Date | null;
  sourceFollowUpItemId?: string | null;
};

export type UpdateWorkItemStatusInput = {
  workspaceId: string;
  id: string;
  status: WorkItemStatus;
};

export async function ensureDefaultBoard(
  db: MeridianDb,
  input: {
    workspaceId: string;
    name?: string;
  },
) {
  const name = input.name ?? "Workspace Board";
  const now = new Date();

  const [createdBoard] = await db
    .insert(boards)
    .values({
      workspaceId: input.workspaceId,
      name,
      updatedAt: now,
    })
    .onConflictDoNothing({
      target: boards.workspaceId,
    })
    .returning();

  if (createdBoard) {
    return createdBoard;
  }

  const existingBoard = await db.query.boards.findFirst({
    where: eq(boards.workspaceId, input.workspaceId),
  });

  if (!existingBoard) {
    throw new Error("Failed to ensure default board.");
  }

  return existingBoard;
}

export async function createWorkItem(
  db: MeridianDb,
  input: CreateWorkItemInput,
) {
  const now = new Date();

  const [item] = await db
    .insert(workItems)
    .values({
      workspaceId: input.workspaceId,
      boardId: input.boardId,
      status: input.status ?? "triage",
      title: input.title,
      description: input.description ?? null,
      dueAt: input.dueAt ?? null,
      sourceFollowUpItemId: input.sourceFollowUpItemId ?? null,
      updatedAt: now,
    })
    .onConflictDoNothing({
      target: [workItems.boardId, workItems.sourceFollowUpItemId],
    })
    .returning();

  return item ?? null;
}

export async function ensureBoardWorkItemsFromOpenFollowUps(
  db: MeridianDb,
  input: {
    workspaceId: string;
    boardId: string;
    limit?: number;
  },
) {
  const followUps = await listOpenFollowUpItems(
    db,
    input.workspaceId,
    input.limit ?? 50,
  );

  let createdCount = 0;

  for (const followUp of followUps) {
    const description = [followUp.reason, followUp.suggestedAction]
      .filter(Boolean)
      .join("\n\n");

    const createdItem = await createWorkItem(db, {
      workspaceId: input.workspaceId,
      boardId: input.boardId,
      status: "triage",
      title: followUp.title,
      description: description || null,
      dueAt: followUp.dueAt,
      sourceFollowUpItemId: followUp.id,
    });

    if (createdItem) {
      createdCount += 1;
    }
  }

  return {
    createdCount,
  };
}

export async function listBoardWorkItems(
  db: MeridianDb,
  input: {
    workspaceId: string;
    boardId: string;
  },
) {
  return db.query.workItems.findMany({
    where: and(
      eq(workItems.workspaceId, input.workspaceId),
      eq(workItems.boardId, input.boardId),
    ),
    orderBy: asc(workItems.createdAt),
  });
}

export async function updateWorkItemStatus(
  db: MeridianDb,
  input: UpdateWorkItemStatusInput,
) {
  const [item] = await db
    .update(workItems)
    .set({
      status: input.status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workItems.id, input.id),
        eq(workItems.workspaceId, input.workspaceId),
      ),
    )
    .returning();

  if (!item) {
    throw new Error("Work item not found.");
  }

  return item;
}
