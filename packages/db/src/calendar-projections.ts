import { and, asc, desc, eq, gte, lte } from "drizzle-orm";

import type { MeridianDb } from "./index";
import { calendarEvents } from "./schema";

export type CalendarProjectionInput = {
  workspaceId: string;
  externalEventId: string;
  calendarId?: string | null;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  status?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

export async function upsertCalendarProjection(
  db: MeridianDb,
  input: CalendarProjectionInput,
) {
  const now = new Date();

  await db
    .insert(calendarEvents)
    .values({
      workspaceId: input.workspaceId,
      externalEventId: input.externalEventId,
      calendarId: input.calendarId ?? "primary",
      summary: input.summary ?? null,
      description: input.description ?? null,
      location: input.location ?? null,
      status: input.status ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      syncedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [calendarEvents.workspaceId, calendarEvents.externalEventId],
      set: {
        calendarId: input.calendarId ?? "primary",
        summary: input.summary ?? null,
        description: input.description ?? null,
        location: input.location ?? null,
        status: input.status ?? null,
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
        syncedAt: now,
        updatedAt: now,
      },
    });
}

export async function listProjectedCalendarEvents(
  db: MeridianDb,
  input: {
    workspaceId: string;
    timeMin: Date;
    timeMax: Date;
    limit?: number;
  },
) {
  return db.query.calendarEvents.findMany({
    where: and(
      eq(calendarEvents.workspaceId, input.workspaceId),
      gte(calendarEvents.startsAt, input.timeMin),
      lte(calendarEvents.startsAt, input.timeMax),
    ),
    orderBy: asc(calendarEvents.startsAt),
    limit: input.limit ?? 10,
  });
}

export async function listPostMeetingFollowUpCandidates(
  db: MeridianDb,
  input: {
    workspaceId: string;
    timeMin: Date;
    timeMax: Date;
    limit?: number;
  },
) {
  return db.query.calendarEvents.findMany({
    where: and(
      eq(calendarEvents.workspaceId, input.workspaceId),
      gte(calendarEvents.endsAt, input.timeMin),
      lte(calendarEvents.endsAt, input.timeMax),
    ),
    orderBy: desc(calendarEvents.endsAt),
    limit: input.limit ?? 20,
  });
}
