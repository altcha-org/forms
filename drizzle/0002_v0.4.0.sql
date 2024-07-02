CREATE TABLE IF NOT EXISTS "sessions" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"form_id" varchar(32) NOT NULL,
	"response_id" varchar(32),
	"abondoned" boolean DEFAULT false NOT NULL,
	"completion_time" integer,
	"country" varchar(2),
	"correction" integer DEFAULT 0 NOT NULL,
	"error" boolean,
	"field_drop_off" varchar(120),
	"fields" json,
	"mobile" boolean DEFAULT false NOT NULL,
	"start_at" timestamp DEFAULT now() NOT NULL,
	"submit_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "feature_analytics" boolean DEFAULT true NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
