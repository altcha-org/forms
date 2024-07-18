CREATE TABLE IF NOT EXISTS "sessions_compacted" (
	"form_id" varchar(32) NOT NULL,
	"date" timestamp NOT NULL,
	"data" json NOT NULL,
	CONSTRAINT "sessions_compacted_form_id_date_pk" PRIMARY KEY("form_id","date")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "time_zone" varchar(64);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions_compacted" ADD CONSTRAINT "sessions_compacted_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
