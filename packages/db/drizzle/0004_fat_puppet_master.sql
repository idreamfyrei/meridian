CREATE TYPE "public"."follow_up_status" AS ENUM('open', 'snoozed', 'dismissed', 'handled');--> statement-breakpoint
CREATE TYPE "public"."follow_up_type" AS ENUM('reply_needed', 'scheduling_needed', 'post_meeting_follow_up');--> statement-breakpoint
CREATE TABLE "follow_up_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"type" "follow_up_type" NOT NULL,
	"status" "follow_up_status" DEFAULT 'open' NOT NULL,
	"title" varchar(240) NOT NULL,
	"reason" text,
	"suggested_action" text,
	"confidence" integer,
	"source_email_thread_id" uuid,
	"source_calendar_event_id" uuid,
	"due_at" timestamp with time zone,
	"snoozed_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "follow_up_items" ADD CONSTRAINT "follow_up_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_items" ADD CONSTRAINT "follow_up_items_source_email_thread_id_email_threads_id_fk" FOREIGN KEY ("source_email_thread_id") REFERENCES "public"."email_threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_items" ADD CONSTRAINT "follow_up_items_source_calendar_event_id_calendar_events_id_fk" FOREIGN KEY ("source_calendar_event_id") REFERENCES "public"."calendar_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "follow_up_items_workspace_status_idx" ON "follow_up_items" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "follow_up_items_workspace_due_at_idx" ON "follow_up_items" USING btree ("workspace_id","due_at");--> statement-breakpoint
CREATE INDEX "follow_up_items_source_email_thread_idx" ON "follow_up_items" USING btree ("source_email_thread_id");--> statement-breakpoint
CREATE INDEX "follow_up_items_source_calendar_event_idx" ON "follow_up_items" USING btree ("source_calendar_event_id");