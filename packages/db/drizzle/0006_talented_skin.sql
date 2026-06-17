CREATE TYPE "public"."action_draft_kind" AS ENUM('email_reply', 'post_meeting_email', 'calendar_invite');--> statement-breakpoint
CREATE TYPE "public"."action_draft_status" AS ENUM('draft', 'approved', 'sent', 'discarded');--> statement-breakpoint
CREATE TABLE "action_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"follow_up_item_id" uuid NOT NULL,
	"kind" "action_draft_kind" NOT NULL,
	"status" "action_draft_status" DEFAULT 'draft' NOT NULL,
	"recipient" text,
	"subject" text,
	"body" text,
	"scheduled_for" timestamp with time zone,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "action_drafts" ADD CONSTRAINT "action_drafts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_drafts" ADD CONSTRAINT "action_drafts_follow_up_item_id_follow_up_items_id_fk" FOREIGN KEY ("follow_up_item_id") REFERENCES "public"."follow_up_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "action_drafts_workspace_status_idx" ON "action_drafts" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "action_drafts_follow_up_item_idx" ON "action_drafts" USING btree ("follow_up_item_id");