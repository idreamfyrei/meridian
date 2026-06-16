import { getIntegrationConnectionStatuses } from "@meridian/db";

import { getCurrentWorkspace } from "@/lib/current-workspace";

function getProviderLabel(provider: "gmail" | "google_calendar") {
  if (provider === "gmail") {
    return "Gmail";
  }

  return "Google Calendar";
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
      </section>
    </main>
  );
}
