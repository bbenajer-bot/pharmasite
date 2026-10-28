import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "products_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"price" numeric NOT NULL,
  	"stock" numeric DEFAULT 0 NOT NULL,
  	"sku" varchar
  );
  
  ALTER TABLE "orders_items" ADD COLUMN "option" varchar;
  ALTER TABLE "orders_items" ADD COLUMN "option_id" varchar;
  ALTER TABLE "products" ADD COLUMN "option_name" varchar;
  ALTER TABLE "products_options" ADD CONSTRAINT "products_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_options_order_idx" ON "products_options" USING btree ("_order");
  CREATE INDEX "products_options_parent_id_idx" ON "products_options" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "products_options" CASCADE;
  ALTER TABLE "orders_items" DROP COLUMN "option";
  ALTER TABLE "orders_items" DROP COLUMN "option_id";
  ALTER TABLE "products" DROP COLUMN "option_name";`)
}
