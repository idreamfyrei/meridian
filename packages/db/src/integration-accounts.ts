import { eq } from "drizzle-orm";

import { integrationAccounts } from "./schema";
import type { MeridianDb } from "./index";

export type IntegrationConnectionStatus = {
  provider: "gmail" | "google_calendar";
  connected: boolean;
  displayName: string | null;
  externalAccountId: string | null;
};

const supportedProviders = ["gmail", "google_calendar"] as const;

export async function getIntegrationConnectionStatuses(
  db: MeridianDb,
  workspaceId: string,
): Promise<IntegrationConnectionStatus[]> {
  const accounts = await db.query.integrationAccounts.findMany({
    where: eq(integrationAccounts.workspaceId, workspaceId),
  });

  return supportedProviders.map((provider) => {
    const account = accounts.find((item) => item.provider === provider);

    return {
      provider,
      connected: Boolean(account),
      displayName: account?.displayName ?? null,
      externalAccountId: account?.externalAccountId ?? null,
    };
  });
}
