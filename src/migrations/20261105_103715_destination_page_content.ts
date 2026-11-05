import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_destinations_seasons_best_months" AS ENUM('jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec');
  CREATE TYPE "public"."enum_destinations_seasons_good_months" AS ENUM('jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec');
  CREATE TYPE "public"."enum_destinations_seasons_off_months" AS ENUM('jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec');
  CREATE TABLE "destinations_places" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"text" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "destinations_seasons_best_months" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_destinations_seasons_best_months",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "destinations_seasons_good_months" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_destinations_seasons_good_months",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "destinations_seasons_off_months" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_destinations_seasons_off_months",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "destinations_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL
  );
  
  ALTER TABLE "destinations" ADD COLUMN "facts_best_time" varchar;
  ALTER TABLE "destinations" ADD COLUMN "facts_ideal_duration" varchar;
  ALTER TABLE "destinations" ADD COLUMN "facts_nearest_airports" varchar;
  ALTER TABLE "destinations" ADD COLUMN "seasons_best_note" varchar;
  ALTER TABLE "destinations" ADD COLUMN "seasons_good_note" varchar;
  ALTER TABLE "destinations" ADD COLUMN "seasons_off_note" varchar;
  ALTER TABLE "destinations_places" ADD CONSTRAINT "destinations_places_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "destinations_places" ADD CONSTRAINT "destinations_places_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "destinations_seasons_best_months" ADD CONSTRAINT "destinations_seasons_best_months_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "destinations_seasons_good_months" ADD CONSTRAINT "destinations_seasons_good_months_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "destinations_seasons_off_months" ADD CONSTRAINT "destinations_seasons_off_months_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "destinations_faqs" ADD CONSTRAINT "destinations_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "destinations_places_order_idx" ON "destinations_places" USING btree ("_order");
  CREATE INDEX "destinations_places_parent_id_idx" ON "destinations_places" USING btree ("_parent_id");
  CREATE INDEX "destinations_places_image_idx" ON "destinations_places" USING btree ("image_id");
  CREATE INDEX "destinations_seasons_best_months_order_idx" ON "destinations_seasons_best_months" USING btree ("order");
  CREATE INDEX "destinations_seasons_best_months_parent_idx" ON "destinations_seasons_best_months" USING btree ("parent_id");
  CREATE INDEX "destinations_seasons_good_months_order_idx" ON "destinations_seasons_good_months" USING btree ("order");
  CREATE INDEX "destinations_seasons_good_months_parent_idx" ON "destinations_seasons_good_months" USING btree ("parent_id");
  CREATE INDEX "destinations_seasons_off_months_order_idx" ON "destinations_seasons_off_months" USING btree ("order");
  CREATE INDEX "destinations_seasons_off_months_parent_idx" ON "destinations_seasons_off_months" USING btree ("parent_id");
  CREATE INDEX "destinations_faqs_order_idx" ON "destinations_faqs" USING btree ("_order");
  CREATE INDEX "destinations_faqs_parent_id_idx" ON "destinations_faqs" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "destinations_places" CASCADE;
  DROP TABLE "destinations_seasons_best_months" CASCADE;
  DROP TABLE "destinations_seasons_good_months" CASCADE;
  DROP TABLE "destinations_seasons_off_months" CASCADE;
  DROP TABLE "destinations_faqs" CASCADE;
  ALTER TABLE "destinations" DROP COLUMN "facts_best_time";
  ALTER TABLE "destinations" DROP COLUMN "facts_ideal_duration";
  ALTER TABLE "destinations" DROP COLUMN "facts_nearest_airports";
  ALTER TABLE "destinations" DROP COLUMN "seasons_best_note";
  ALTER TABLE "destinations" DROP COLUMN "seasons_good_note";
  ALTER TABLE "destinations" DROP COLUMN "seasons_off_note";
  DROP TYPE "public"."enum_destinations_seasons_best_months";
  DROP TYPE "public"."enum_destinations_seasons_good_months";
  DROP TYPE "public"."enum_destinations_seasons_off_months";`)
}
