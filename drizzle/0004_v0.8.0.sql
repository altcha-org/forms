DO $$ BEGIN
 CREATE TYPE "public"."suspended" AS ENUM('trial_expired', 'subscription_expired', 'billing_problem', 'terms_violation', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "can_send_emails" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "suspended" "suspended";--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "trial_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "responses" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "uploads" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "limit_responses" integer;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "limit_uploads" integer;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "trial_days" integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accounts_trial_expires_at_idx" ON "accounts" ("trial_expires_at");