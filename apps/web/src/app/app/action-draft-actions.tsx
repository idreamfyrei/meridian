"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ActionDraftStatus = "approved" | "discarded";

export function ActionDraftActions({ id }: { id: string }) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState<ActionDraftStatus | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(status: ActionDraftStatus) {
    setPendingStatus(status);
    setError(null);

    try {
      const response = await fetch("/api/actions/status", {
        method: "POST",
        body: JSON.stringify({ id, status }),
      });

      const body = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Could not update draft.");
      }

      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update draft.",
      );
    } finally {
      setPendingStatus(null);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
        <button
          type="button"
          onClick={() => updateStatus("approved")}
          disabled={pendingStatus !== null}
          className="rounded-md bg-zinc-950 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingStatus === "approved" ? "Approving..." : "Approve"}
        </button>

        <button
          type="button"
          onClick={() => updateStatus("discarded")}
          disabled={pendingStatus !== null}
          className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-500 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingStatus === "discarded" ? "Discarding..." : "Discard"}
        </button>
      </div>

      {error ? <p className="max-w-xs text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
