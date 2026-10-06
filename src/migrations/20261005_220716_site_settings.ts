import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings_hours" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"days" varchar NOT NULL,
  	"time" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar DEFAULT 'Meridian Pharmacy' NOT NULL,
  	"description" varchar DEFAULT 'A licensed Illinois pharmacy offering prescription refills, doctor consultations, vaccinations, and everyday health products, in store and online.' NOT NULL,
  	"delivery_area" varchar DEFAULT 'within 5 miles of the pharmacy' NOT NULL,
  	"phone" varchar DEFAULT '(312) 555-0142' NOT NULL,
  	"email" varchar DEFAULT 'hello@example.com' NOT NULL,
  	"address_street" varchar DEFAULT '123 Example Avenue' NOT NULL,
  	"address_city" varchar DEFAULT 'Chicago' NOT NULL,
  	"address_state" varchar DEFAULT 'IL' NOT NULL,
  	"address_zip" varchar DEFAULT '60601' NOT NULL,
  	"license_number" varchar DEFAULT '000.000000' NOT NULL,
  	"license_pharmacist" varchar DEFAULT 'Jane Doe, PharmD' NOT NULL,
  	"doctor_name" varchar DEFAULT 'Dr. Alex Morgan, MD' NOT NULL,
  	"doctor_title" varchar DEFAULT 'Founder & Supervising Physician' NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "site_settings_hours" ADD CONSTRAINT "site_settings_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_hours_order_idx" ON "site_settings_hours" USING btree ("_order");
  CREATE INDEX "site_settings_hours_parent_id_idx" ON "site_settings_hours" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings_hours" CASCADE;
  DROP TABLE "site_settings" CASCADE;`)
}
