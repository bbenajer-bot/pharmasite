import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_prescription_requests_kind" AS ENUM('new', 'refill');
  CREATE TYPE "public"."enum_prescription_requests_status" AS ENUM('new', 'reviewed', 'approved', 'declined');
  CREATE TYPE "public"."enum_prescription_requests_fulfillment" AS ENUM('pickup', 'delivery');
  CREATE TABLE "prescription_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"request_number" numeric,
  	"kind" "enum_prescription_requests_kind" DEFAULT 'new' NOT NULL,
  	"status" "enum_prescription_requests_status" DEFAULT 'new' NOT NULL,
  	"doctor_notes" varchar,
  	"name" varchar NOT NULL,
  	"date_of_birth" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar,
  	"rx_number" varchar,
  	"medication" varchar,
  	"reason" varchar,
  	"current_medications" varchar,
  	"allergies" varchar,
  	"fulfillment" "enum_prescription_requests_fulfillment" DEFAULT 'pickup' NOT NULL,
  	"delivery_address" varchar,
  	"consent_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "prescription_requests_id" integer;
  ALTER TABLE "shop_settings" ADD COLUMN "prescription_notify_email" varchar;
  CREATE UNIQUE INDEX "prescription_requests_request_number_idx" ON "prescription_requests" USING btree ("request_number");
  CREATE INDEX "prescription_requests_updated_at_idx" ON "prescription_requests" USING btree ("updated_at");
  CREATE INDEX "prescription_requests_created_at_idx" ON "prescription_requests" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_prescription_requests_fk" FOREIGN KEY ("prescription_requests_id") REFERENCES "public"."prescription_requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_prescription_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("prescription_requests_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "prescription_requests" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "prescription_requests" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_prescription_requests_fk";
  
  DROP INDEX "payload_locked_documents_rels_prescription_requests_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "prescription_requests_id";
  ALTER TABLE "shop_settings" DROP COLUMN "prescription_notify_email";
  DROP TYPE "public"."enum_prescription_requests_kind";
  DROP TYPE "public"."enum_prescription_requests_status";
  DROP TYPE "public"."enum_prescription_requests_fulfillment";`)
}
