import {
  ensureBoardWorkItemsFromOpenFollowUps,
  ensureDefaultBoard,
  getIntegrationConnectionStatuses,
  listBoardWorkItems,
  listProjectedCalendarEvents,
  listProjectedEmailThreads,
  type WorkItemStatus,
} from "@meridian/db";

import { getCurrentWorkspace } from "@/lib/current-workspace";
import { RefreshWorkspaceButton } from "./refresh-workspace-button";
import { WorkItemStatusActions } from "./work-item-status-actions";

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

type BoardWorkItem = {
  id: string;
  status: WorkItemStatus;
  title: string;
  description: string | null;
  dueAt: Date | null;
  sourceFollowUpItemId: string | null;
};

const BOARD_COLUMNS: Array<{
  status: WorkItemStatus;
  label: string;
  description: string;
}> = [
  {
    status: "triage",
    label: "Triage",
    description: "Needs owner review before it becomes planned work.",
  },
  {
    status: "ready",
    label: "Ready",
    description: "Clear enough to pick up next.",
  },
  {
    status: "in_progress",
    label: "In Progress",
    description: "Currently being handled.",
  },
  {
    status: "waiting",
    label: "Waiting",
    description: "Blocked on a reply, decision, or outside input.",
  },
  {
    status: "done",
    label: "Done",
    description: "Completed or no longer needs action.",
  },
];

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

function getDueLabel(dueAt: Date | null) {
  if (!dueAt) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(dueAt);
}

function groupWorkItemsByStatus(items: BoardWorkItem[]) {
  const grouped = new Map<WorkItemStatus, BoardWorkItem[]>();

  for (const column of BOARD_COLUMNS) {
    grouped.set(column.status, []);
  }

  for (const item of items) {
    grouped.get(item.status)?.push(item);
  }

  return grouped;
}

export default async function AppPage() {
  const currentWorkspace = await getCurrentWorkspace();

  if (!currentWorkspace) {
    return null;
  }

  const { db, workspace } = currentWorkspace;
  const board = await ensureDefaultBoard(db, {
    workspaceId: workspace.id,
    name: `${workspace.name} Board`,
  });

  await ensureBoardWorkItemsFromOpenFollowUps(db, {
    workspaceId: workspace.id,
    boardId: board.id,
  });

  const integrationStatuses = await getIntegrationConnectionStatuses(
    db,
    workspace.id,
  );

  const workItems = await listBoardWorkItems(db, {
    workspaceId: workspace.id,
    boardId: board.id,
  });
  const groupedWorkItems = groupWorkItemsByStatus(workItems);

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
      <section className="w-full max-w-7xl">
        <p className="text-sm font-medium text-zinc-500">{workspace.name}</p>

        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              Work Board
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
              A shared execution surface for actionable work from your Meridian
              workspace. Open loops start in Triage so you can decide what moves
              forward.
            </p>
          </div>

          <RefreshWorkspaceButton />
        </div>

        <section className="mt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-950">
                {board.name}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Five-column workflow for triage, planning, active work, waiting,
                and completion.
              </p>
            </div>
            <p className="text-sm text-zinc-500">
              {workItems.length} {workItems.length === 1 ? "item" : "items"}
            </p>
          </div>

          <div className="mt-4 grid gap-4 overflow-x-auto pb-3 lg:grid-cols-5">
            {BOARD_COLUMNS.map((column) => {
              const columnItems = groupedWorkItems.get(column.status) ?? [];

              return (
                <section
                  key={column.status}
                  className="min-w-72 rounded-lg border border-zinc-200 bg-zinc-100/70"
                >
                  <div className="border-b border-zinc-200 px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-zinc-950">
                        {column.label}
                      </h3>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-zinc-500">
                        {columnItems.length}
                      </span>
                    </div>
                    <p className="mt-1 min-h-10 text-xs leading-5 text-zinc-500">
                      {column.description}
                    </p>
                  </div>

                  <div className="flex min-h-64 flex-col gap-3 p-3">
                    {columnItems.length ? (
                      columnItems.map((item) => {
                        const dueLabel = getDueLabel(item.dueAt);

                        return (
                          <article
                            key={item.id}
                            className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm"
                          >
                            <div className="space-y-2">
                              <p className="text-sm font-medium leading-5 text-zinc-950">
                                {item.title}
                              </p>

                              {item.description ? (
                                <p className="line-clamp-3 whitespace-pre-line text-sm leading-6 text-zinc-600">
                                  {item.description}
                                </p>
                              ) : (
                                <p className="text-sm text-zinc-400">
                                  No brief captured yet.
                                </p>
                              )}

                              <div className="flex flex-wrap gap-2">
                                {dueLabel ? (
                                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                                    Due {dueLabel}
                                  </span>
                                ) : null}

                                {item.sourceFollowUpItemId ? (
                                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                                    From open loop
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="mt-3 border-t border-zinc-100 pt-3">
                              <WorkItemStatusActions
                                id={item.id}
                                status={item.status}
                              />
                            </div>
                          </article>
                        );
                      })
                    ) : (
                      <div className="flex min-h-28 items-center rounded-lg border border-dashed border-zinc-300 bg-white/70 px-3 py-4">
                        <p className="text-sm text-zinc-500">
                          No work items here yet.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
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

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-950">
                Upcoming calendar
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Stored Google Calendar projections for this workspace.
              </p>
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
          </div>

          <div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-950">
                Recent inbox
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Stored Gmail projections for this workspace.
              </p>
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
          </div>
        </section>
      </section>
    </main>
  );
}
