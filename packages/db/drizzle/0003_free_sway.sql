CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"external_event_id" text NOT NULL,
	"calendar_id" text DEFAULT 'primary' NOT NULL,
	"summary" text,
	"description" text,
	"location" text,
	"status" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_events_workspace_event_idx" ON "calendar_events" USING btree ("workspace_id","external_event_id");--> statement-breakpoint
CREATE INDEX "calendar_events_workspace_starts_at_idx" ON "calendar_events" USING btree ("workspace_id","starts_at");