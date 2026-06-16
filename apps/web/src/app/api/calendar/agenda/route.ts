import { listTenantCalendarEvents } from "@meridian/corsair";
import { withRequestLogContext } from "@meridian/logger";

import { getCurrentWorkspace } from "@/lib/current-workspace";

export const runtime = "nodejs";

export async function GET() {
  const requestId = crypto.randomUUID();
  const logger = withRequestLogContext(requestId, {
    route: "/api/calendar/agenda",
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

  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(now.getDate() + 7);

  try {
    const agenda = await listTenantCalendarEvents({
      workspaceId: currentWorkspace.workspace.id,
      timeMin: now.toISOString(),
      timeMax: sevenDaysFromNow.toISOString(),
    });

    logger.info(
      {
        workspaceId: currentWorkspace.workspace.id,
      },
      "calendar agenda loaded",
    );

    return Response.json({
      ok: true,
      requestId,
      agenda,
    });
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        workspaceId: currentWorkspace.workspace.id,
      },
      "calendar agenda failed",
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
