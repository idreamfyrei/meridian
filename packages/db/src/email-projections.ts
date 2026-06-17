import { and, desc, eq, notIlike } from "drizzle-orm";

import { emailMessages, emailThreads } from "./schema";
import type { MeridianDb } from "./index";

const NOISY_SENDER_PATTERNS = [
  "%pinterest%",
  "%linkedin%",
  "%facebook%",
  "%instagram%",
  "%tiktok%",
  "%twitter%",
  "%x.com%",
  "%youtube%",
  "%reddit%",
  "%quora%",
  "%medium%",
  "%substack%",
  "%mailchimp%",
  "%newsletter%",
  "%marketing%",
  "%promo%",
  "%promotions%",
  "%offers%",
  "%deals%",
];

const NOISY_SUBJECT_PATTERNS = [
  "%newsletter%",
  "%digest%",
  "%weekly update%",
  "%sale%",
  "%discount%",
  "%limited time%",
  "%recommended for you%",
  "%people viewed your profile%",
  "%new notification%",
  "%connection request%",
];

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
    where: getUsefulEmailThreadWhere(workspaceId),
    orderBy: desc(emailThreads.lastMessageAt),
    limit,
  });
}

export async function getProjectedEmailThread(
  db: MeridianDb,
  input: {
    workspaceId: string;
    id: string;
  },
) {
  return db.query.emailThreads.findFirst({
    where: and(
      eq(emailThreads.workspaceId, input.workspaceId),
      eq(emailThreads.id, input.id),
    ),
  });
}

export async function listReplyNeededEmailCandidates(
  db: MeridianDb,
  workspaceId: string,
  limit = 20,
) {
  return db.query.emailThreads.findMany({
    where: getUsefulEmailThreadWhere(workspaceId),
    orderBy: desc(emailThreads.lastMessageAt),
    limit,
  });
}

function getUsefulEmailThreadWhere(workspaceId: string) {
  return and(
    eq(emailThreads.workspaceId, workspaceId),
    ...NOISY_SENDER_PATTERNS.map((pattern) =>
      notIlike(emailThreads.from, pattern),
    ),
    ...NOISY_SUBJECT_PATTERNS.map((pattern) =>
      notIlike(emailThreads.subject, pattern),
    ),
  );
}
