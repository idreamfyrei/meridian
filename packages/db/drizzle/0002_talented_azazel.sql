CREATE TABLE "email_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"external_message_id" text NOT NULL,
	"external_thread_id" text NOT NULL,
	"subject" text,
	"snippet" text,
	"from_address" text,
	"to_address" text,
	"received_at" timestamp with time zone,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"external_thread_id" text NOT NULL,
	"subject" text,
	"snippet" text,
	"from_address" text,
	"last_message_at" timestamp with time zone,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_thread_id_email_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."email_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_messages_workspace_message_idx" ON "email_messages" USING btree ("workspace_id","external_message_id");--> statement-breakpoint
CREATE INDEX "email_messages_thread_received_idx" ON "email_messages" USING btree ("thread_id","received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "email_threads_workspace_thread_idx" ON "email_threads" USING btree ("workspace_id","external_thread_id");--> statement-breakpoint
CREATE INDEX "email_threads_workspace_last_message_idx" ON "email_threads" USING btree ("workspace_id","last_message_at");