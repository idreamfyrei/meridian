"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type FollowUpActionStatus = "handled" | "dismissed" | "snoozed";

export function FollowUpActions({ id }: { id: string }) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] =
    useState<FollowUpActionStatus | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createDraft() {
    setIsDrafting(true);
    setDraftMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/actions/drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ followUpItemId: id }),
      });

      const body = (await response.json()) as {
        ok: boolean;
        error?: string;
        draft?: {
          id: string;
        };
      };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Could not create draft.");
      }

      setDraftMessage("Draft created.");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not create draft.",
      );
    } finally {
      setIsDrafting(false);
    }
  }

  async function updateStatus(status: FollowUpActionStatus) {
    setPendingStatus(status);
    setDraftMessage(null);
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

  const isPending = pendingStatus !== null || isDrafting;

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
        <button
          type="button"
          onClick={createDraft}
          disabled={isPending}
          className="rounded-md bg-zinc-950 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDrafting ? "Drafting..." : "Draft"}
        </button>

        <button
          type="button"
          onClick={() => updateStatus("handled")}
          disabled={isPending}
          className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingStatus === "handled" ? "Saving..." : "Handled"}
        </button>

        <button
          type="button"
          onClick={() => updateStatus("snoozed")}
          disabled={isPending}
          className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-500 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingStatus === "snoozed" ? "Saving..." : "Snooze"}
        </button>

        <button
          type="button"
          onClick={() => updateStatus("dismissed")}
          disabled={isPending}
          className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-500 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingStatus === "dismissed" ? "Saving..." : "Dismiss"}
        </button>
      </div>

      {draftMessage ? (
        <p className="max-w-xs text-xs text-emerald-700">{draftMessage}</p>
      ) : null}

      {error ? <p className="max-w-xs text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
