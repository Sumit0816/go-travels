import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_message_log_channel" AS ENUM('whatsapp', 'telegram', 'email');
  CREATE TYPE "public"."enum_team_alerts_telegram_status" AS ENUM('notConnected', 'connected', 'error');
  CREATE TABLE "team_alerts_telegram_chats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"chat_id" varchar NOT NULL
  );
  
  CREATE TABLE "team_alerts_email_recipients" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"email" varchar NOT NULL
  );
  
  CREATE TABLE "team_alerts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"telegram_enabled" boolean DEFAULT false,
  	"telegram_bot_token" varchar,
  	"telegram_token_hint" varchar,
  	"telegram_status" "enum_team_alerts_telegram_status" DEFAULT 'notConnected',
  	"email_enabled" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "message_log" ADD COLUMN "channel" "enum_message_log_channel" DEFAULT 'whatsapp' NOT NULL;
  ALTER TABLE "whatsapp_settings" ADD COLUMN "enabled" boolean DEFAULT false;
  ALTER TABLE "team_alerts_telegram_chats" ADD CONSTRAINT "team_alerts_telegram_chats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_alerts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_alerts_email_recipients" ADD CONSTRAINT "team_alerts_email_recipients_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_alerts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "team_alerts_telegram_chats_order_idx" ON "team_alerts_telegram_chats" USING btree ("_order");
  CREATE INDEX "team_alerts_telegram_chats_parent_id_idx" ON "team_alerts_telegram_chats" USING btree ("_parent_id");
  CREATE INDEX "team_alerts_email_recipients_order_idx" ON "team_alerts_email_recipients" USING btree ("_order");
  CREATE INDEX "team_alerts_email_recipients_parent_id_idx" ON "team_alerts_email_recipients" USING btree ("_parent_id");
  CREATE INDEX "message_log_channel_idx" ON "message_log" USING btree ("channel");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "team_alerts_telegram_chats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "team_alerts_email_recipients" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "team_alerts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "team_alerts_telegram_chats" CASCADE;
  DROP TABLE "team_alerts_email_recipients" CASCADE;
  DROP TABLE "team_alerts" CASCADE;
  DROP INDEX "message_log_channel_idx";
  ALTER TABLE "message_log" DROP COLUMN "channel";
  ALTER TABLE "whatsapp_settings" DROP COLUMN "enabled";
  DROP TYPE "public"."enum_message_log_channel";
  DROP TYPE "public"."enum_team_alerts_telegram_status";`)
}
