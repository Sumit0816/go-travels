import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_hero_buttons_style" AS ENUM('primary', 'outline');
  CREATE TYPE "public"."enum_pages_blocks_hero_buttons_link_type" AS ENUM('category', 'destination', 'package', 'page', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_features_variant" AS ENUM('cards', 'steps');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_buttons_style" AS ENUM('primary', 'outline');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_buttons_link_type" AS ENUM('category', 'destination', 'package', 'page', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_features_variant" AS ENUM('cards', 'steps');
  CREATE TABLE "pages_blocks_hero_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"style" "enum_pages_blocks_hero_buttons_style" DEFAULT 'primary',
  	"link_type" "enum_pages_blocks_hero_buttons_link_type" DEFAULT 'custom' NOT NULL,
  	"category_id" integer,
  	"destination_id" integer,
  	"package_id" integer,
  	"page_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"style" "enum__pages_v_blocks_hero_buttons_style" DEFAULT 'primary',
  	"link_type" "enum__pages_v_blocks_hero_buttons_link_type" DEFAULT 'custom' NOT NULL,
  	"category_id" integer,
  	"destination_id" integer,
  	"package_id" integer,
  	"page_id" integer,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "pages_blocks_features" ADD COLUMN "variant" "enum_pages_blocks_features_variant" DEFAULT 'cards';
  ALTER TABLE "_pages_v_blocks_features" ADD COLUMN "variant" "enum__pages_v_blocks_features_variant" DEFAULT 'cards';
  ALTER TABLE "pages_blocks_hero_buttons" ADD CONSTRAINT "pages_blocks_hero_buttons_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_buttons" ADD CONSTRAINT "pages_blocks_hero_buttons_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_buttons" ADD CONSTRAINT "pages_blocks_hero_buttons_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_buttons" ADD CONSTRAINT "pages_blocks_hero_buttons_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_buttons" ADD CONSTRAINT "pages_blocks_hero_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_buttons" ADD CONSTRAINT "_pages_v_blocks_hero_buttons_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_buttons" ADD CONSTRAINT "_pages_v_blocks_hero_buttons_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_buttons" ADD CONSTRAINT "_pages_v_blocks_hero_buttons_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_buttons" ADD CONSTRAINT "_pages_v_blocks_hero_buttons_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_buttons" ADD CONSTRAINT "_pages_v_blocks_hero_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero_buttons_order_idx" ON "pages_blocks_hero_buttons" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_buttons_parent_id_idx" ON "pages_blocks_hero_buttons" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_buttons_category_idx" ON "pages_blocks_hero_buttons" USING btree ("category_id");
  CREATE INDEX "pages_blocks_hero_buttons_destination_idx" ON "pages_blocks_hero_buttons" USING btree ("destination_id");
  CREATE INDEX "pages_blocks_hero_buttons_package_idx" ON "pages_blocks_hero_buttons" USING btree ("package_id");
  CREATE INDEX "pages_blocks_hero_buttons_page_idx" ON "pages_blocks_hero_buttons" USING btree ("page_id");
  CREATE INDEX "_pages_v_blocks_hero_buttons_order_idx" ON "_pages_v_blocks_hero_buttons" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_buttons_parent_id_idx" ON "_pages_v_blocks_hero_buttons" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_buttons_category_idx" ON "_pages_v_blocks_hero_buttons" USING btree ("category_id");
  CREATE INDEX "_pages_v_blocks_hero_buttons_destination_idx" ON "_pages_v_blocks_hero_buttons" USING btree ("destination_id");
  CREATE INDEX "_pages_v_blocks_hero_buttons_package_idx" ON "_pages_v_blocks_hero_buttons" USING btree ("package_id");
  CREATE INDEX "_pages_v_blocks_hero_buttons_page_idx" ON "_pages_v_blocks_hero_buttons" USING btree ("page_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_hero_buttons" CASCADE;
  DROP TABLE "_pages_v_blocks_hero_buttons" CASCADE;
  ALTER TABLE "pages_blocks_features" DROP COLUMN "variant";
  ALTER TABLE "_pages_v_blocks_features" DROP COLUMN "variant";
  DROP TYPE "public"."enum_pages_blocks_hero_buttons_style";
  DROP TYPE "public"."enum_pages_blocks_hero_buttons_link_type";
  DROP TYPE "public"."enum_pages_blocks_features_variant";
  DROP TYPE "public"."enum__pages_v_blocks_hero_buttons_style";
  DROP TYPE "public"."enum__pages_v_blocks_hero_buttons_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_features_variant";`)
}
