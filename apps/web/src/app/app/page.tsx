import {
  getIntegrationConnectionStatuses,
  listActionDrafts,
  listOpenFollowUpItems,
  listProjectedCalendarEvents,
  listProjectedEmailThreads,
} from "@meridian/db";

import { getCurrentWorkspace } from "@/lib/current-workspace";
import { ActionDraftActions } from "./action-draft-actions";
import { FollowUpActions } from "./follow-up-actions";
import { RefreshWorkspaceButton } from "./refresh-workspace-button";

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

function getFollowUpTypeLabel(
  type: "reply_needed" | "scheduling_needed" | "post_meeting_follow_up",
) {
  if (type === "reply_needed") {
    return "Reply needed";
  }

  if (type === "scheduling_needed") {
    return "Scheduling needed";
  }

  return "Post-meeting follow-up";
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

  const followUpItems = await listOpenFollowUpItems(db, workspace.id, 10);
  const actionDrafts = await listActionDrafts(db, {
    workspaceId: workspace.id,
    limit: 5,
  });

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

          <RefreshWorkspaceButton />
        </div>

        <section className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-950">
                Open loops
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Actionable follow-ups detected from your synced workspace
                signals.
              </p>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            {followUpItems.length ? (
              <ul className="divide-y divide-zinc-100">
                {followUpItems.map((item) => (
                  <li key={item.id} className="px-4 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-950">
                          {item.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                          {item.reason ?? "No reason captured yet."}
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                          {item.suggestedAction ?? "Review this loop."}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <span className="w-fit rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                          {getFollowUpTypeLabel(item.type)}
                        </span>

                        <FollowUpActions id={item.id} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-sm text-zinc-500">
                No open loops yet. Refresh your workspace to check for new
                follow-ups.
              </p>
            )}
          </div>
        </section>

        <section className="mt-8">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950">Drafts</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Proposed actions waiting for review before anything is sent.
            </p>
          </div>

          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            {actionDrafts.length ? (
              <ul className="divide-y divide-zinc-100">
                {actionDrafts.map((draft) => (
                  <li key={draft.id} className="px-4 py-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-950">
                          {draft.subject ?? "Untitled draft"}
                        </p>
                        <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-zinc-600">
                          {draft.body ?? "No draft body yet."}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <span className="w-fit rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          {draft.status}
                        </span>

                        {draft.status === "draft" ||
                        draft.status === "approved" ? (
                          <ActionDraftActions
                            id={draft.id}
                            status={draft.status}
                          />
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-sm text-zinc-500">
                No drafts yet. Create one from an open loop.
              </p>
            )}
          </div>
        </section>

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
                No upcoming events synced yet.
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
                No recent inbox messages synced yet.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
