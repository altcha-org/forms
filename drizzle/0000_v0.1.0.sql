DO $$ BEGIN
 CREATE TYPE "public"."auditlog" AS ENUM('changes', 'access');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."billing_cycle" AS ENUM('month', 'year');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."complexity" AS ENUM('low', 'medium', 'high');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."form_mode" AS ENUM('standard', 'guided', 'hidden');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."form_status" AS ENUM('draft', 'published', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."invite_status" AS ENUM('pending', 'declined', 'accepted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('member', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"plan_id" varchar(32),
	"billing_cycle" "billing_cycle" DEFAULT 'year',
	"auditlog" "auditlog",
	"auditlog_retention" integer,
	"encryption_enabled" boolean DEFAULT true NOT NULL,
	"name" varchar(256) NOT NULL,
	"smtp_url" varchar(256),
	"smtp_sender" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts_to_users" (
	"account_id" varchar(32) NOT NULL,
	"user_id" varchar(32) NOT NULL,
	"role" "user_role" DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_to_users_account_id_user_id_pk" PRIMARY KEY("account_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_keys" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"account_id" varchar(32) NOT NULL,
	"deleted" boolean DEFAULT false,
	"features" json DEFAULT '[]' NOT NULL,
	"name" varchar(64) NOT NULL,
	"referrer" varchar(1024) NOT NULL,
	"secret" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"account_id" varchar(32) NOT NULL,
	"device_id" varchar(32),
	"form_id" varchar(32),
	"response_id" varchar(32),
	"user_id" varchar(32),
	"data" json,
	"data_encrypted" text,
	"description" varchar(250),
	"encrypted" boolean DEFAULT false NOT NULL,
	"encryption_key_hash" varchar,
	"event" varchar(64) NOT NULL,
	"ip_address" varchar(64),
	"node_id" varchar(64),
	"version" varchar(32),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "devices" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"user_id" varchar(32) NOT NULL,
	"encryption_key" varchar(64) NOT NULL,
	"ip_address" varchar(64) NOT NULL,
	"name" varchar(64) NOT NULL,
	"timezone" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "encryption_keys" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"account_id" varchar(32) NOT NULL,
	"deleted" boolean DEFAULT false,
	"hash" varchar(24) NOT NULL,
	"public_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "files" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"account_id" varchar(32) NOT NULL,
	"form_id" varchar(32) NOT NULL,
	"response_id" varchar(32),
	"encrypted" boolean DEFAULT false NOT NULL,
	"encryption_key_hash" varchar,
	"encrypted_size" integer,
	"name" varchar(256) NOT NULL,
	"persistent" boolean DEFAULT false,
	"public" boolean DEFAULT false,
	"size" integer NOT NULL,
	"type" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forms" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"account_id" varchar(32) NOT NULL,
	"badges" json DEFAULT '[]' NOT NULL,
	"banner" varchar(32),
	"captcha_auto" boolean DEFAULT false NOT NULL,
	"captcha_complexity" "complexity" DEFAULT 'medium' NOT NULL,
	"captcha_invisible" boolean DEFAULT true NOT NULL,
	"confetti" boolean DEFAULT false NOT NULL,
	"context_info" boolean DEFAULT true NOT NULL,
	"demo" boolean DEFAULT false NOT NULL,
	"display_blocks" json DEFAULT '[]' NOT NULL,
	"encryption_key_hash" varchar,
	"footer" varchar(1024),
	"hide_powered_by" boolean DEFAULT false NOT NULL,
	"labels" json,
	"locale" varchar(8) DEFAULT 'en-GB' NOT NULL,
	"logo" varchar(32),
	"mode" "form_mode" DEFAULT 'standard' NOT NULL,
	"name" varchar(256) NOT NULL,
	"password" varchar(64),
	"processors" json NOT NULL,
	"received_responses" integer DEFAULT 0 NOT NULL,
	"restricted" boolean DEFAULT false NOT NULL,
	"status" "form_status" DEFAULT 'draft' NOT NULL,
	"steps" json NOT NULL,
	"submit_label" varchar(128),
	"success" varchar(1024),
	"success_redirect" varchar(256),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forms_to_users" (
	"form_id" varchar(32) NOT NULL,
	"user_id" varchar(32) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "forms_to_users_form_id_user_id_pk" PRIMARY KEY("form_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "identities" (
	"account_id" varchar(32) NOT NULL,
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"encrypted" boolean DEFAULT false NOT NULL,
	"encryption_key_hash" varchar,
	"external_id" varchar(256) NOT NULL,
	"metadata" json,
	"metadata_encrypted" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "identities_account_id_external_id_idx" UNIQUE("account_id","external_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invites" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"account_id" varchar(32) NOT NULL,
	"email" varchar(256) NOT NULL,
	"invited_by" varchar(32) NOT NULL,
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "account_id_email_idx" UNIQUE("account_id","email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notes" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"account_id" varchar(32) NOT NULL,
	"form_id" varchar(32) NOT NULL,
	"response_id" varchar(32) NOT NULL,
	"user_id" varchar(32),
	"encrypted" boolean DEFAULT false NOT NULL,
	"encryption_key_hash" varchar,
	"from" varchar(256),
	"read" boolean DEFAULT true NOT NULL,
	"sent_to_email_at" timestamp,
	"text" text,
	"text_encrypted" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plans" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"auditlog_max_retention" integer DEFAULT 365 NOT NULL,
	"default" boolean DEFAULT false NOT NULL,
	"deprecated" boolean DEFAULT false NOT NULL,
	"feature_auditlog" boolean DEFAULT true NOT NULL,
	"feature_files" boolean DEFAULT true NOT NULL,
	"feature_forms" boolean DEFAULT true NOT NULL,
	"feature_notes" boolean DEFAULT true NOT NULL,
	"feature_processors" boolean DEFAULT true NOT NULL,
	"group" varchar(64),
	"name" varchar(32) NOT NULL,
	"limit_api" integer DEFAULT 100000 NOT NULL,
	"limit_api_keys" integer DEFAULT 10 NOT NULL,
	"limit_encryption_keys" integer DEFAULT 10 NOT NULL,
	"limit_file_size" integer DEFAULT 10 NOT NULL,
	"limit_forms" integer DEFAULT 10 NOT NULL,
	"limit_users" integer DEFAULT 10 NOT NULL,
	"premium" boolean DEFAULT true NOT NULL,
	"prices" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "responses" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"account_id" varchar(32) NOT NULL,
	"form_id" varchar(32) NOT NULL,
	"identity_id" varchar(32),
	"context" json NOT NULL,
	"data" json,
	"data_encrypted" text,
	"deleted" boolean DEFAULT false,
	"encrypted" boolean DEFAULT false NOT NULL,
	"encryption_key_hash" varchar,
	"error" boolean DEFAULT false,
	"flag" boolean DEFAULT false,
	"labels" json,
	"logs" json NOT NULL,
	"read" boolean DEFAULT false,
	"spam" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"expires_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"account_id" varchar(32) NOT NULL,
	"plan_id" varchar(32),
	"auto" boolean DEFAULT true NOT NULL,
	"cancel_url" varchar(1024),
	"event_payload" json,
	"status" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_event_at" timestamp,
	"next_billing_at" timestamp,
	"paid_until" timestamp,
	"update_url" varchar(1024),
	"expires_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"deleted" boolean DEFAULT false,
	"email" varchar(256),
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verification_token" varchar(64),
	"emergency" boolean DEFAULT false NOT NULL,
	"emergency_password" varchar(128),
	"jwt_nonce" varchar(16) NOT NULL,
	"locale" varchar(8) DEFAULT 'en-GB' NOT NULL,
	"name" varchar(64) NOT NULL,
	"oauth_provider" varchar(32),
	"oauth_access_token" varchar(256),
	"oauth_profile" json,
	"recovery_passphrase" varchar(256),
	"recovery_passphrase_hint" varchar(64),
	"recovery_token" varchar(64),
	"recovery_requested_at" timestamp,
	"webauthn_authenticators" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts_to_users" ADD CONSTRAINT "accounts_to_users_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts_to_users" ADD CONSTRAINT "accounts_to_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "encryption_keys" ADD CONSTRAINT "encryption_keys_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "files" ADD CONSTRAINT "files_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "files" ADD CONSTRAINT "files_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "files" ADD CONSTRAINT "files_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "forms" ADD CONSTRAINT "forms_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "forms_to_users" ADD CONSTRAINT "forms_to_users_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "forms_to_users" ADD CONSTRAINT "forms_to_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "identities" ADD CONSTRAINT "identities_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invites" ADD CONSTRAINT "invites_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invites" ADD CONSTRAINT "invites_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notes" ADD CONSTRAINT "notes_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notes" ADD CONSTRAINT "notes_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notes" ADD CONSTRAINT "notes_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "responses" ADD CONSTRAINT "responses_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "responses" ADD CONSTRAINT "responses_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "responses" ADD CONSTRAINT "responses_identity_id_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."identities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_deleted_idx" ON "api_keys" ("deleted");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auditlog_event_idx" ON "audit_log" ("event");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auditlog_expires_at_idx" ON "audit_log" ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "devices_expires_at_idx" ON "devices" ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "encryption_keys_deleted_idx" ON "encryption_keys" ("deleted");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_expires_at_idx" ON "files" ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "responses_flag_idx" ON "responses" ("flag");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "responses_error_idx" ON "responses" ("error");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "responses_expires_at_idx" ON "responses" ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "responses_read_idx" ON "responses" ("read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "responses_spam_idx" ON "responses" ("spam");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_deleted_idx" ON "users" ("deleted");