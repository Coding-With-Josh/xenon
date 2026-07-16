ALTER TABLE "flow_sessions" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "flow_sessions" ADD CONSTRAINT "flow_sessions_slug_unique" UNIQUE("slug");