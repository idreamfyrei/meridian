import { listTenantCalendarEvents } from "@meridian/corsair";
import { upsertCalendarProjection } from "@meridian/db";
import { withRequestLogContext } from "@meridian/logger";

import { getCurrentWorkspace } from "@/lib/current-workspace";

export const runtime = "nodejs";

type GoogleCalendarDate = {
  date?: string;
  dateTime?: string;
};

type GoogleCalendarEvent = {
  id?: string;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  status?: string | null;
  start?: GoogleCalendarDate;
  end?: GoogleCalendarDate;
};

function getEventDate(value: GoogleCalendarDate | undefined) {
  const dateValue = value?.dateTime ?? value?.date;

  if (!dateValue) {
    return null;
  }

  return new Date(dateValue);
}

export async function POST() {
  const requestId = crypto.randomUUID();
  const logger = withRequestLogContext(requestId, {
    route: "/api/calendar/sync",
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

  const now = new Date();
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  try {
    const agenda = await listTenantCalendarEvents({
      workspaceId: currentWorkspace.workspace.id,
      timeMin: now.toISOString(),
      timeMax: thirtyDaysFromNow.toISOString(),
      maxResults: 50,
    });

    const events: GoogleCalendarEvent[] = agenda.items ?? [];
    let syncedCount = 0;

    for (const event of events) {
      if (!event.id) {
        continue;
      }

      await upsertCalendarProjection(currentWorkspace.db, {
        workspaceId: currentWorkspace.workspace.id,
        externalEventId: event.id,
        calendarId: "primary",
        summary: event.summary ?? null,
        description: event.description ?? null,
        location: event.location ?? null,
        status: event.status ?? null,
        startsAt: getEventDate(event.start),
        endsAt: getEventDate(event.end),
      });

      syncedCount += 1;
    }

    logger.info(
      {
        syncedCount,
        workspaceId: currentWorkspace.workspace.id,
      },
      "calendar projection sync completed",
    );

    return Response.json({
      ok: true,
      requestId,
      syncedCount,
    });
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        workspaceId: currentWorkspace.workspace.id,
      },
      "calendar projection sync failed",
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
