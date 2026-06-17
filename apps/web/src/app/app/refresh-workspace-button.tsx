"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RefreshState = "idle" | "refreshing" | "success" | "error";

export function RefreshWorkspaceButton() {
  const router = useRouter();
  const [state, setState] = useState<RefreshState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function postJson(path: string) {
    const response = await fetch(path, { method: "POST" });
    const body = (await response.json()) as {
      ok: boolean;
      error?: string;
    };

    if (!response.ok || !body.ok) {
      throw new Error(body.error ?? `Request failed: ${path}`);
    }

    return body;
  }

  async function handleRefresh() {
    setState("refreshing");
    setMessage(null);

    try {
      await postJson("/api/email/sync");
      await postJson("/api/calendar/sync");
      await postJson("/api/loops/detect");

      setState("success");
      setMessage("Workspace refreshed.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "Workspace refresh failed.",
      );
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={state === "refreshing"}
        className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {state === "refreshing" ? "Refreshing..." : "Refresh workspace"}
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
