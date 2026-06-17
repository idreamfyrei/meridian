"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type FollowUpActionStatus = "handled" | "dismissed";

export function FollowUpActions({ id }: { id: string }) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] =
    useState<FollowUpActionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(status: FollowUpActionStatus) {
    setPendingStatus(status);
    setError(null);

    try {
      const response = await fetch("/api/loops/status", {
        method: "POST",
        body: JSON.stringify({ id, status }),
      });

      const body = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Could not update loop.");
      }

      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update loop.",
      );
    } finally {
      setPendingStatus(null);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => updateStatus("handled")}
          disabled={pendingStatus !== null}
          className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingStatus === "handled" ? "Saving..." : "Handled"}
        </button>

        <button
          type="button"
          onClick={() => updateStatus("dismissed")}
          disabled={pendingStatus !== null}
          className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-500 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingStatus === "dismissed" ? "Saving..." : "Dismiss"}
        </button>
      </div>

      {error ? <p className="max-w-xs text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
