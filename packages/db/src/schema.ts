import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  integer,
  varchar,
} from "drizzle-orm/pg-core";

export const integrationProvider = pgEnum("integration_provider", [
  "gmail",
  "google_calendar",
]);

export const followUpType = pgEnum("follow_up_type", [
  "reply_needed",
  "scheduling_needed",
  "post_meeting_follow_up",
]);

export const followUpStatus = pgEnum("follow_up_status", [
  "open",
  "snoozed",
  "dismissed",
  "handled",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: varchar("clerk_user_id", { length: 191 }).notNull(),
    email: text("email"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    clerkUserIdIdx: uniqueIndex("users_clerk_user_id_idx").on(
      table.clerkUserId,
    ),
  }),
);

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("workspaces_user_id_idx").on(table.userId),
  }),
);

export const integrationAccounts = pgTable(
  "integration_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    provider: integrationProvider("provider").notNull(),
    externalAccountId: text("external_account_id"),
    displayName: text("display_name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    workspaceProviderIdx: uniqueIndex(
      "integration_accounts_workspace_provider_idx",
    ).on(table.workspaceId, table.provider),
  }),
);

export const emailThreads = pgTable(
  "email_threads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    externalThreadId: text("external_thread_id").notNull(),
    subject: text("subject"),
    snippet: text("snippet"),
    from: text("from_address"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    syncedAt: timestamp("synced_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    workspaceThreadIdx: uniqueIndex("email_threads_workspace_thread_idx").on(
      table.workspaceId,
      table.externalThreadId,
    ),
    workspaceLastMessageIdx: index(
      "email_threads_workspace_last_message_idx",
    ).on(table.workspaceId, table.lastMessageAt),
  }),
);

export const emailMessages = pgTable(
  "email_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => emailThreads.id, { onDelete: "cascade" }),
    externalMessageId: text("external_message_id").notNull(),
    externalThreadId: text("external_thread_id").notNull(),
    subject: text("subject"),
    snippet: text("snippet"),
    from: text("from_address"),
    to: text("to_address"),
    receivedAt: timestamp("received_at", { withTimezone: true }),
    syncedAt: timestamp("synced_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    workspaceMessageIdx: uniqueIndex("email_messages_workspace_message_idx").on(
      table.workspaceId,
      table.externalMessageId,
    ),
    threadReceivedIdx: index("email_messages_thread_received_idx").on(
      table.threadId,
      table.receivedAt,
    ),
  }),
);

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    externalEventId: text("external_event_id").notNull(),
    calendarId: text("calendar_id").notNull().default("primary"),
    summary: text("summary"),
    description: text("description"),
    location: text("location"),
    status: text("status"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    syncedAt: timestamp("synced_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    workspaceEventIdx: uniqueIndex("calendar_events_workspace_event_idx").on(
      table.workspaceId,
      table.externalEventId,
    ),
    workspaceStartsAtIdx: index("calendar_events_workspace_starts_at_idx").on(
      table.workspaceId,
      table.startsAt,
    ),
  }),
);

export const followUpItems = pgTable(
  "follow_up_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    type: followUpType("type").notNull(),
    status: followUpStatus("status").notNull().default("open"),
    title: varchar("title", { length: 240 }).notNull(),
    reason: text("reason"),
    suggestedAction: text("suggested_action"),
    confidence: integer("confidence"),
    sourceEmailThreadId: uuid("source_email_thread_id").references(
      () => emailThreads.id,
      { onDelete: "set null" },
    ),
    sourceCalendarEventId: uuid("source_calendar_event_id").references(
      () => calendarEvents.id,
      { onDelete: "set null" },
    ),
    dueAt: timestamp("due_at", { withTimezone: true }),
    snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    workspaceStatusIdx: index("follow_up_items_workspace_status_idx").on(
      table.workspaceId,
      table.status,
    ),
    workspaceDueAtIdx: index("follow_up_items_workspace_due_at_idx").on(
      table.workspaceId,
      table.dueAt,
    ),
    sourceEmailThreadIdx: index("follow_up_items_source_email_thread_idx").on(
      table.sourceEmailThreadId,
    ),
    sourceCalendarEventIdx: index(
      "follow_up_items_source_calendar_event_idx",
    ).on(table.sourceCalendarEventId),
  }),
);

export const corsairIntegrations = pgTable(
  "corsair_integrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    config: jsonb("config").$type<Record<string, unknown>>().notNull(),
    dek: text("dek"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    nameIdx: uniqueIndex("corsair_integrations_name_idx").on(table.name),
  }),
);

export const corsairAccounts = pgTable(
  "corsair_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id").notNull(),
    integrationId: uuid("integration_id")
      .notNull()
      .references(() => corsairIntegrations.id, { onDelete: "cascade" }),
    config: jsonb("config").$type<Record<string, unknown>>().notNull(),
    dek: text("dek"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tenantIntegrationIdx: uniqueIndex(
      "corsair_accounts_tenant_integration_idx",
    ).on(table.tenantId, table.integrationId),
  }),
);

export const corsairEntities = pgTable(
  "corsair_entities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => corsairAccounts.id, { onDelete: "cascade" }),
    entityId: text("entity_id").notNull(),
    entityType: text("entity_type").notNull(),
    version: text("version").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    accountEntityIdx: uniqueIndex("corsair_entities_account_entity_idx").on(
      table.accountId,
      table.entityType,
      table.entityId,
    ),
  }),
);

export const corsairEvents = pgTable(
  "corsair_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => corsairAccounts.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    accountStatusIdx: index("corsair_events_account_status_idx").on(
      table.accountId,
      table.status,
    ),
  }),
);

export const corsairPermissions = pgTable(
  "corsair_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    token: text("token").notNull(),
    plugin: text("plugin").notNull(),
    endpoint: text("endpoint").notNull(),
    args: text("args").notNull(),
    tenantId: text("tenant_id").notNull().default("default"),
    status: text("status").notNull().default("pending"),
    expiresAt: text("expires_at").notNull(),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex("corsair_permissions_token_idx").on(table.token),
    tenantStatusIdx: index("corsair_permissions_tenant_status_idx").on(
      table.tenantId,
      table.status,
    ),
  }),
);
