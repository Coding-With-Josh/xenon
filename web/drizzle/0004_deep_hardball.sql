CREATE TYPE "public"."flow_stage" AS ENUM('hook', 'notes', 'microcheck', 'quiz', 'remediation', 'mastery');--> statement-breakpoint
CREATE TYPE "public"."flow_status" AS ENUM('in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."mistake_status" AS ENUM('outstanding', 'in_review', 'resolved');--> statement-breakpoint
CREATE TABLE "flow_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subject" text NOT NULL,
	"topic" text NOT NULL,
	"status" "flow_status" DEFAULT 'in_progress' NOT NULL,
	"current_subsection_index" integer DEFAULT 0 NOT NULL,
	"current_stage" "flow_stage" DEFAULT 'hook' NOT NULL,
	"total_subsections" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "flow_stage_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"stage" "flow_stage" NOT NULL,
	"subsection_index" integer,
	"completed" boolean DEFAULT false NOT NULL,
	"data" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spaced_review" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subject" text NOT NULL,
	"topic" text NOT NULL,
	"subsection_id" text,
	"review_at" timestamp NOT NULL,
	"interval" integer NOT NULL,
	"last_reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "question_attempts" ADD COLUMN "subject_id" text;--> statement-breakpoint
ALTER TABLE "question_attempts" ADD COLUMN "topic_id" text;--> statement-breakpoint
ALTER TABLE "question_attempts" ADD COLUMN "subsection_id" text;--> statement-breakpoint
ALTER TABLE "question_attempts" ADD COLUMN "status" "mistake_status" DEFAULT 'outstanding' NOT NULL;--> statement-breakpoint
ALTER TABLE "question_attempts" ADD COLUMN "attempts" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "question_attempts" ADD COLUMN "first_missed_at" timestamp;--> statement-breakpoint
ALTER TABLE "question_attempts" ADD COLUMN "last_attempted_at" timestamp;--> statement-breakpoint
ALTER TABLE "question_attempts" ADD COLUMN "resolved_at" timestamp;--> statement-breakpoint
ALTER TABLE "flow_sessions" ADD CONSTRAINT "flow_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_stage_progress" ADD CONSTRAINT "flow_stage_progress_session_id_flow_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."flow_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaced_review" ADD CONSTRAINT "spaced_review_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
