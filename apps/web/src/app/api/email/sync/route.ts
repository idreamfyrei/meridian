import {
  getTenantGmailMessage,
  listTenantInboxMessages,
} from "@meridian/corsair";
import { getDb, upsertEmailProjection } from "@meridian/db";
import { withRequestLogContext } from "@meridian/logger";

import { getCurrentWorkspace } from "@/lib/current-workspace";

export const runtime = "nodejs";

type GmailHeader = {
  name?: string;
  value?: string;
};

type GmailMessage = {
  id?: string;
  threadId?: string;
  snippet?: string;
  internalDate?: Date | string | number | null;
  payload?: {
    headers?: GmailHeader[];
  };
};

function getHeader(message: GmailMessage, name: string) {
  return message.payload?.headers?.find(
    (header) => header.name?.toLowerCase() === name.toLowerCase(),
  )?.value;
}

function getReceivedAt(message: GmailMessage) {
  if (!message.internalDate) {
    return null;
  }

  if (message.internalDate instanceof Date) {
    return Number.isNaN(message.internalDate.getTime())
      ? null
      : message.internalDate;
  }

  const value =
    typeof message.internalDate === "string" &&
    /^\d+$/.test(message.internalDate)
      ? Number(message.internalDate)
      : message.internalDate;

  const receivedAt = new Date(value);

  if (Number.isNaN(receivedAt.getTime())) {
    return null;
  }

  return receivedAt;
}

export async function POST() {
  const requestId = crypto.randomUUID();
  const logger = withRequestLogContext(requestId, {
    route: "/api/email/sync",
  });

  const currentWorkspace = await getCurrentWorkspace();

  if (!currentWorkspace) {
    return Response.json(
      {
        ok: false,
        requestId,
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    const inbox = await listTenantInboxMessages({
      workspaceId: currentWorkspace.workspace.id,
      maxResults: 10,
    });

    const messages: GmailMessage[] = inbox.messages ?? [];
    let syncedCount = 0;

    for (const message of messages) {
      if (!message.id || !message.threadId) {
        continue;
      }

      const messageDetail = await getTenantGmailMessage({
        messageId: message.id,
        workspaceId: currentWorkspace.workspace.id,
      });

      await upsertEmailProjection(getDb(), {
        workspaceId: currentWorkspace.workspace.id,
        externalMessageId: messageDetail.id ?? message.id,
        externalThreadId: messageDetail.threadId ?? message.threadId,
        subject: getHeader(messageDetail, "Subject") ?? null,
        snippet: messageDetail.snippet ?? null,
        from: getHeader(messageDetail, "From") ?? null,
        to: getHeader(messageDetail, "To") ?? null,
        receivedAt: getReceivedAt(messageDetail),
      });

      syncedCount += 1;
    }

    logger.info(
      {
        syncedCount,
        workspaceId: currentWorkspace.workspace.id,
      },
      "gmail projection sync completed",
    );

    return Response.json({
      ok: true,
      requestId,
      syncedCount,
    });
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        workspaceId: currentWorkspace.workspace.id,
      },
      "gmail projection sync failed",
    );

    return Response.json(
      {
        ok: false,
        requestId,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
