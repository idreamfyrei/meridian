import { eq } from "drizzle-orm";

import { integrationAccounts } from "./schema";
import type { MeridianDb } from "./index";

export type MeridianIntegrationProvider = "gmail" | "google_calendar";

export type IntegrationConnectionStatus = {
  provider: MeridianIntegrationProvider;
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

export async function upsertIntegrationAccount(
  db: MeridianDb,
  input: {
    workspaceId: string;
    provider: MeridianIntegrationProvider;
    displayName?: string | null;
    externalAccountId?: string | null;
  },
) {
  const now = new Date();

  await db
    .insert(integrationAccounts)
    .values({
      workspaceId: input.workspaceId,
      provider: input.provider,
      displayName: input.displayName ?? null,
      externalAccountId: input.externalAccountId ?? null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [integrationAccounts.workspaceId, integrationAccounts.provider],
      set: {
        displayName: input.displayName ?? null,
        externalAccountId: input.externalAccountId ?? null,
        updatedAt: now,
      },
    });
}
