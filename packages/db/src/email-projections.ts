import { desc, eq } from "drizzle-orm";

import { emailMessages, emailThreads } from "./schema";
import type { MeridianDb } from "./index";

export type EmailProjectionInput = {
  workspaceId: string;
  externalMessageId: string;
  externalThreadId: string;
  subject?: string | null;
  snippet?: string | null;
  from?: string | null;
  to?: string | null;
  receivedAt?: Date | null;
};

export async function upsertEmailProjection(
  db: MeridianDb,
  input: EmailProjectionInput,
) {
  const now = new Date();

  const [thread] = await db
    .insert(emailThreads)
    .values({
      workspaceId: input.workspaceId,
      externalThreadId: input.externalThreadId,
      subject: input.subject ?? null,
      snippet: input.snippet ?? null,
      from: input.from ?? null,
      lastMessageAt: input.receivedAt ?? null,
      syncedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [emailThreads.workspaceId, emailThreads.externalThreadId],
      set: {
        subject: input.subject ?? null,
        snippet: input.snippet ?? null,
        from: input.from ?? null,
        lastMessageAt: input.receivedAt ?? null,
        syncedAt: now,
        updatedAt: now,
      },
    })
    .returning();

  if (!thread) {
    throw new Error("Failed to upsert email thread projection.");
  }

  await db
    .insert(emailMessages)
    .values({
      workspaceId: input.workspaceId,
      threadId: thread.id,
      externalMessageId: input.externalMessageId,
      externalThreadId: input.externalThreadId,
      subject: input.subject ?? null,
      snippet: input.snippet ?? null,
      from: input.from ?? null,
      to: input.to ?? null,
      receivedAt: input.receivedAt ?? null,
      syncedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [emailMessages.workspaceId, emailMessages.externalMessageId],
      set: {
        subject: input.subject ?? null,
        snippet: input.snippet ?? null,
        from: input.from ?? null,
        to: input.to ?? null,
        receivedAt: input.receivedAt ?? null,
        syncedAt: now,
        updatedAt: now,
      },
    });
}

export async function listProjectedEmailThreads(
  db: MeridianDb,
  workspaceId: string,
  limit = 10,
) {
  return db.query.emailThreads.findMany({
    where: eq(emailThreads.workspaceId, workspaceId),
    orderBy: desc(emailThreads.lastMessageAt),
    limit,
  });
}

export async function listReplyNeededEmailCandidates(
  db: MeridianDb,
  workspaceId: string,
  limit = 20,
) {
  return db.query.emailThreads.findMany({
    where: eq(emailThreads.workspaceId, workspaceId),
    orderBy: desc(emailThreads.lastMessageAt),
    limit,
  });
}
