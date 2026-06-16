"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SyncState = "idle" | "syncing" | "success" | "error";

export function SyncEmailButton() {
  const router = useRouter();
  const [state, setState] = useState<SyncState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setState("syncing");
    setMessage(null);

    try {
      const response = await fetch("/api/email/sync", {
        method: "POST",
      });

      const body = (await response.json()) as {
        ok: boolean;
        syncedCount?: number;
        error?: string;
      };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Email sync failed.");
      }

      setState("success");
      setMessage(`Synced ${body.syncedCount ?? 0} messages.`);
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Email sync failed.");
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={handleSync}
        disabled={state === "syncing"}
        className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {state === "syncing" ? "Syncing..." : "Sync Gmail"}
      </button>

      {message ? (
        <p
          className={
            state === "error"
              ? "max-w-xs text-xs text-red-600"
              : "max-w-xs text-xs text-zinc-500"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
