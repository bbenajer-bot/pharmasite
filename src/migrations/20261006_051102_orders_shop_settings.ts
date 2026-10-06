import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_fulfillment" AS ENUM('pickup', 'local-delivery', 'shipping');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('awaiting-payment', 'paid', 'shipped', 'delivered', 'cancelled');
  CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('paypal', 'venmo', 'cashapp', 'zelle', 'applepay', 'invoice');
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"unit_price" numeric NOT NULL,
  	"quantity" numeric NOT NULL,
  	"line_total" numeric NOT NULL,
  	"product_id" integer,
  	"sku" varchar
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"subtotal" numeric NOT NULL,
  	"fulfillment_fee" numeric DEFAULT 0 NOT NULL,
  	"total" numeric NOT NULL,
  	"customer_note" varchar,
  	"customer_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"fulfillment" "enum_orders_fulfillment" NOT NULL,
  	"address_line1" varchar,
  	"address_line2" varchar,
  	"address_city" varchar,
  	"address_state" varchar,
  	"address_zip" varchar,
  	"tracking_info" varchar,
  	"payment_instructions_sent_at" timestamp(3) with time zone,
  	"reminder_sent_at" timestamp(3) with time zone,
  	"paid_at" timestamp(3) with time zone,
  	"shipped_at" timestamp(3) with time zone,
  	"cancelled_at" timestamp(3) with time zone,
  	"cancel_reason" varchar,
  	"order_number" numeric,
  	"status" "enum_orders_status" DEFAULT 'awaiting-payment' NOT NULL,
  	"payment_method" "enum_orders_payment_method" NOT NULL,
  	"admin_notes" varchar,
  	"access_token" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "shop_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"pickup_enabled" boolean DEFAULT true,
  	"local_delivery_enabled" boolean DEFAULT true,
  	"local_delivery_fee" numeric DEFAULT 5 NOT NULL,
  	"shipping_enabled" boolean DEFAULT true,
  	"shipping_fee" numeric DEFAULT 8.95 NOT NULL,
  	"shipping_free_over" numeric DEFAULT 50,
  	"payment_paypal_enabled" boolean DEFAULT true,
  	"payment_paypal_instructions" varchar DEFAULT 'Please send {total} with PayPal to TODO@example.com and put "Order #{orderNumber}" in the note.' NOT NULL,
  	"payment_venmo_enabled" boolean DEFAULT true,
  	"payment_venmo_instructions" varchar DEFAULT 'Please send {total} on Venmo to @TODO-pharmacy and put "Order #{orderNumber}" in the note.' NOT NULL,
  	"payment_cashapp_enabled" boolean DEFAULT true,
  	"payment_cashapp_instructions" varchar DEFAULT 'Please send {total} on Cash App to $TODOpharmacy and put "Order #{orderNumber}" in the note.' NOT NULL,
  	"payment_zelle_enabled" boolean DEFAULT true,
  	"payment_zelle_instructions" varchar DEFAULT 'Please send {total} with Zelle to TODO@example.com (Meridian Pharmacy) and put "Order #{orderNumber}" in the memo.' NOT NULL,
  	"payment_applepay_enabled" boolean DEFAULT true,
  	"payment_applepay_instructions" varchar DEFAULT 'Please send {total} with Apple Cash to (312) 555-0142 and put "Order #{orderNumber}" in the message.' NOT NULL,
  	"payment_invoice_enabled" boolean DEFAULT true,
  	"payment_invoice_instructions" varchar DEFAULT 'We will send you a secure invoice for {total} by email shortly. Pay it by credit or debit card using the link in that email.' NOT NULL,
  	"notify_email" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "orders_id" integer;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_items_product_idx" ON "orders_items" USING btree ("product_id");
  CREATE UNIQUE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");
  CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");
  CREATE INDEX "orders_access_token_idx" ON "orders" USING btree ("access_token");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "shop_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "shop_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_orders_fk";
  
  DROP INDEX "payload_locked_documents_rels_orders_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "orders_id";
  DROP TYPE "public"."enum_orders_fulfillment";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_orders_payment_method";`)
}
