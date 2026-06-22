"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type WorkItemStatus = "triage" | "ready" | "in_progress" | "waiting" | "done";

const WORKFLOW: WorkItemStatus[] = [
  "triage",
  "ready",
  "in_progress",
  "waiting",
  "done",
];

function getStatusLabel(status: WorkItemStatus) {
  if (status === "in_progress") {
    return "In progress";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function WorkItemStatusActions({
  id,
  status,
}: {
  id: string;
  status: WorkItemStatus;
}) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState<WorkItemStatus | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(nextStatus: WorkItemStatus) {
    setPendingStatus(nextStatus);
    setError(null);

    try {
      const response = await fetch("/api/board/items/status", {
        method: "POST",
        body: JSON.stringify({ id, status: nextStatus }),
      });

      const body = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Could not move work item.");
      }

      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not move work item.",
      );
    } finally {
      setPendingStatus(null);
    }
  }

  const currentIndex = WORKFLOW.indexOf(status);
  const previousStatus = WORKFLOW[currentIndex - 1] ?? null;
  const nextStatus = WORKFLOW[currentIndex + 1] ?? null;
  const isPending = pendingStatus !== null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {previousStatus ? (
          <button
            type="button"
            onClick={() => updateStatus(previousStatus)}
            disabled={isPending}
            className="h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-600 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingStatus === previousStatus
              ? "Moving..."
              : `< ${getStatusLabel(previousStatus)}`}
          </button>
        ) : null}

        {nextStatus ? (
          <button
            type="button"
            onClick={() => updateStatus(nextStatus)}
            disabled={isPending}
            className="h-8 rounded-md bg-zinc-950 px-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingStatus === nextStatus
              ? "Moving..."
              : `${getStatusLabel(nextStatus)} >`}
          </button>
        ) : null}

        {status !== "done" && nextStatus !== "done" ? (
          <button
            type="button"
            onClick={() => updateStatus("done")}
            disabled={isPending}
            className="h-8 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingStatus === "done" ? "Moving..." : "Done"}
          </button>
        ) : null}
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
