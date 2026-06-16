import {
  getIntegrationConnectionStatuses,
  listProjectedCalendarEvents,
  listProjectedEmailThreads,
} from "@meridian/db";

import { SyncEmailButton } from "./sync-email-button";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { SyncCalendarButton } from "./sync-calendar-button";

type CalendarEvent = {
  id: string;
  summary: string | null;
  location: string | null;
  startsAt: Date | null;
};

type InboxThread = {
  id: string;
  externalThreadId: string;
  subject: string | null;
  snippet: string | null;
  from: string | null;
  lastMessageAt: Date | null;
};

function getProviderLabel(provider: "gmail" | "google_calendar") {
  if (provider === "gmail") {
    return "Gmail";
  }

  return "Google Calendar";
}

function getEventStartLabel(event: CalendarEvent) {
  if (!event.startsAt) {
    return "No start time";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(event.startsAt);
}

export default async function AppPage() {
  const currentWorkspace = await getCurrentWorkspace();

  if (!currentWorkspace) {
    return null;
  }

  const { db, workspace } = currentWorkspace;

  const integrationStatuses = await getIntegrationConnectionStatuses(
    db,
    workspace.id,
  );

  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const agendaItems: CalendarEvent[] = await listProjectedCalendarEvents(db, {
    workspaceId: workspace.id,
    timeMin: now,
    timeMax: sevenDaysFromNow,
    limit: 5,
  });

  const inboxThreads: InboxThread[] = await listProjectedEmailThreads(
    db,
    workspace.id,
    5,
  );

  return (
    <main className="flex flex-1 bg-zinc-50 px-6 py-8">
      <section className="w-full max-w-5xl">
        <p className="text-sm font-medium text-zinc-500">{workspace.name}</p>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              Action Queue
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
              This route is connected to your Meridian workspace. Next, we will
              use this workspace as the tenant boundary for Gmail and Google
              Calendar.
            </p>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-950">
            Integration status
          </h2>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {integrationStatuses.map((status) => (
              <article
                key={status.provider}
                className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-950">
                      {getProviderLabel(status.provider)}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      {status.connected
                        ? (status.displayName ?? "Connected")
                        : "Not connected"}
                    </p>
                  </div>

                  <span
                    className={
                      status.connected
                        ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                        : "rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600"
                    }
                  >
                    {status.connected ? "Connected" : "Setup needed"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-950">
                Upcoming calendar
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Stored Google Calendar projections for this workspace.
              </p>
            </div>

            <SyncCalendarButton />
          </div>

          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            {agendaItems.length ? (
              <ul className="divide-y divide-zinc-100">
                {agendaItems.map((event) => (
                  <li key={event.id} className="px-4 py-3">
                    <p className="text-sm font-medium text-zinc-950">
                      {event.summary ?? "Untitled event"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {getEventStartLabel(event)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-sm text-zinc-500">
                No synced upcoming events yet. Run the calendar sync endpoint.
              </p>
            )}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-950">
                Recent inbox
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Stored Gmail projections for this workspace.
              </p>
            </div>

            <SyncEmailButton />
          </div>

          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            {inboxThreads.length ? (
              <ul className="divide-y divide-zinc-100">
                {inboxThreads.map((thread) => (
                  <li key={thread.id} className="px-4 py-3">
                    <p className="truncate text-sm font-medium text-zinc-950">
                      {thread.subject ?? "No subject"}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-700">
                      {thread.snippet ?? "No preview available"}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-400">
                      {thread.from ?? "Unknown sender"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-sm text-zinc-500">
                No synced inbox messages yet. Run the Gmail sync endpoint.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
