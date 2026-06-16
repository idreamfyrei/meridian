"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DetectState = "idle" | "detecting" | "success" | "error";

export function DetectLoopsButton() {
  const router = useRouter();
  const [state, setState] = useState<DetectState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleDetect() {
    setState("detecting");
    setMessage(null);

    try {
      const response = await fetch("/api/loops/detect", {
        method: "POST",
      });

      const body = (await response.json()) as {
        ok: boolean;
        candidateCount?: number;
        createdCount?: number;
        error?: string;
      };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Loop detection failed.");
      }

      setState("success");
      setMessage(`Found ${body.createdCount ?? 0} loops.`);
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "Loop detection failed.",
      );
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={handleDetect}
        disabled={state === "detecting"}
        className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {state === "detecting" ? "Detecting..." : "Detect Loops"}
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
