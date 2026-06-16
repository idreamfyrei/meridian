import { completeGoogleOAuthCallback } from "@meridian/corsair";
import { withRequestLogContext } from "@meridian/logger";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const logger = withRequestLogContext(requestId, {
    route: "/api/corsair/oauth/callback",
  });

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");

  if (error) {
    logger.warn(
      {
        error,
      },
      "oauth callback returned provider error",
    );

    return Response.redirect(new URL(`/app?oauth=error`, request.url));
  }

  if (!code || !state) {
    logger.warn("oauth callback missing code or state");

    return Response.redirect(new URL(`/app?oauth=missing_params`, request.url));
  }

  const redirectUri = new URL(
    "/api/corsair/oauth/callback",
    request.url,
  ).toString();

  try {
    const result = await completeGoogleOAuthCallback({
      code,
      redirectUri,
      state,
    });

    logger.info(
      {
        plugin: result.plugin,
        tenantId: result.tenantId,
      },
      "oauth callback completed",
    );

    return Response.redirect(
      new URL(`/app?oauth=connected&provider=${result.plugin}`, request.url),
    );
  } catch (callbackError) {
    logger.error(
      {
        error:
          callbackError instanceof Error
            ? callbackError.message
            : "Unknown error",
      },
      "oauth callback failed",
    );

    return Response.redirect(new URL(`/app?oauth=failed`, request.url));
  }
}
