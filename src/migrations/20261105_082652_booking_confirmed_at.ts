import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "bookings" ADD COLUMN "confirmed_at" timestamp(3) with time zone;
  CREATE INDEX "bookings_confirmed_at_idx" ON "bookings" USING btree ("confirmed_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "bookings_confirmed_at_idx";
  ALTER TABLE "bookings" DROP COLUMN "confirmed_at";`)
}
