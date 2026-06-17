import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

import * as schema from "./schema";

export type MeridianDb = NodePgDatabase<typeof schema>;

let pool: Pool | undefined;
let db: MeridianDb | undefined;

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  return databaseUrl;
}

function getPoolConnectionConfig(): PoolConfig {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl.includes("supabase.com")) {
    return {
      connectionString: databaseUrl,
    };
  }

  const url = new URL(databaseUrl);

  return {
    database: url.pathname.slice(1),
    host: url.hostname,
    password: decodeURIComponent(url.password),
    port: Number(url.port),
    ssl: {
      rejectUnauthorized: false,
    },
    user: decodeURIComponent(url.username),
  };
}

export function getPgPool(): Pool {
  pool ??= new Pool(getPoolConnectionConfig());

  return pool;
}

export function getDb(): MeridianDb {
  db ??= drizzle(getPgPool(), { schema });
  return db;
}

export { schema };

export {
  getIntegrationConnectionStatuses,
  upsertIntegrationAccount,
} from "./integration-accounts";

export { ensureUserWorkspace } from "./workspaces";

export {
  listProjectedEmailThreads,
  listReplyNeededEmailCandidates,
  upsertEmailProjection,
} from "./email-projections";

export {
  listPostMeetingFollowUpCandidates,
  listProjectedCalendarEvents,
  upsertCalendarProjection,
} from "./calendar-projections";

export {
  getFollowUpItem,
  listOpenFollowUpItems,
  updateFollowUpItemStatus,
  upsertFollowUpItem,
} from "./follow-up-items";

export type {
  FollowUpItemStatus,
  FollowUpItemType,
  UpdateFollowUpItemStatusInput,
  UpsertFollowUpItemInput,
} from "./follow-up-items";

export {
  createActionDraft,
  getActionDraft,
  listActionDrafts,
  listActionDraftsForFollowUp,
  markActionDraftSent,
  updateActionDraftStatus,
} from "./action-drafts";

export type {
  ActionDraftKind,
  ActionDraftStatus,
  CreateActionDraftInput,
  UpdateActionDraftStatusInput,
} from "./action-drafts";
