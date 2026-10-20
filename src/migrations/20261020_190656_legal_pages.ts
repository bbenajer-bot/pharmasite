import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "legal_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"privacy_last_updated" timestamp(3) with time zone,
  	"privacy_content" jsonb,
  	"terms_last_updated" timestamp(3) with time zone,
  	"terms_content" jsonb,
  	"accessibility_last_updated" timestamp(3) with time zone,
  	"accessibility_content" jsonb,
  	"npp_last_updated" timestamp(3) with time zone,
  	"npp_content" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "legal_pages" CASCADE;`)
}
