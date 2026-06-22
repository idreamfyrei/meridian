CREATE TYPE "public"."work_item_status" AS ENUM('triage', 'ready', 'in_progress', 'waiting', 'done');--> statement-breakpoint
CREATE TABLE "boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"board_id" uuid NOT NULL,
	"status" "work_item_status" DEFAULT 'triage' NOT NULL,
	"title" varchar(240) NOT NULL,
	"description" text,
	"due_at" timestamp with time zone,
	"source_follow_up_item_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "boards" ADD CONSTRAINT "boards_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_source_follow_up_item_id_follow_up_items_id_fk" FOREIGN KEY ("source_follow_up_item_id") REFERENCES "public"."follow_up_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "boards_workspace_idx" ON "boards" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "work_items_board_status_idx" ON "work_items" USING btree ("board_id","status");--> statement-breakpoint
CREATE INDEX "work_items_workspace_status_idx" ON "work_items" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "work_items_source_follow_up_item_idx" ON "work_items" USING btree ("board_id","source_follow_up_item_id");