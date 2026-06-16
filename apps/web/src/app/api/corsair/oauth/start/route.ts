import {
  ensureGoogleOAuthCredentials,
  ensureTenantCorsairSetup,
  getGoogleOAuthConnectUrl,
  type GoogleOAuthProvider,
} from "@meridian/corsair";
import { withRequestLogContext } from "@meridian/logger";

import { getCurrentWorkspace } from "@/lib/current-workspace";

export const runtime = "nodejs";

function parseProvider(value: string | null): GoogleOAuthProvider | null {
  if (value === "gmail" || value === "googlecalendar") {
    return value;
  }

  return null;
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const logger = withRequestLogContext(requestId, {
    route: "/api/corsair/oauth/start",
  });

  const requestUrl = new URL(request.url);
  const provider = parseProvider(requestUrl.searchParams.get("provider"));

  if (!provider) {
    return Response.json(
      {
        ok: false,
        requestId,
        error: "Provider must be gmail or googlecalendar.",
      },
      { status: 400 },
    );
  }

  const currentWorkspace = await getCurrentWorkspace();

  if (!currentWorkspace) {
    logger.warn("oauth start requested without an authenticated user");

    return Response.json(
      {
        ok: false,
        requestId,
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }

  const { workspace } = currentWorkspace;

  try {
    await ensureTenantCorsairSetup(workspace.id);
    await ensureGoogleOAuthCredentials();

    const redirectUri = new URL(
      "/api/corsair/oauth/callback",
      request.url,
    ).toString();

    const connectUrl = await getGoogleOAuthConnectUrl({
      provider,
      redirectUri,
      workspaceId: workspace.id,
    });

    logger.info(
      {
        provider,
        workspaceId: workspace.id,
      },
      "oauth connect url generated",
    );

    return Response.redirect(connectUrl);
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        provider,
        workspaceId: workspace.id,
      },
      "oauth start failed",
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
