import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "message_log" ADD COLUMN "next_attempt_at" timestamp(3) with time zone;
  ALTER TABLE "message_log" ADD COLUMN "body" varchar;
  ALTER TABLE "message_log" ADD COLUMN "params" jsonb;
  ALTER TABLE "message_log" ADD COLUMN "language" varchar;
  ALTER TABLE "whatsapp_settings" ADD COLUMN "app_name" varchar;
  CREATE INDEX "message_log_next_attempt_at_idx" ON "message_log" USING btree ("next_attempt_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "message_log_next_attempt_at_idx";
  ALTER TABLE "message_log" DROP COLUMN "next_attempt_at";
  ALTER TABLE "message_log" DROP COLUMN "body";
  ALTER TABLE "message_log" DROP COLUMN "params";
  ALTER TABLE "message_log" DROP COLUMN "language";
  ALTER TABLE "whatsapp_settings" DROP COLUMN "app_name";`)
}
