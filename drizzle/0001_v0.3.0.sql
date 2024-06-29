ALTER TABLE "files" ADD COLUMN "finalized" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "captcha_floating" boolean DEFAULT false NOT NULL;