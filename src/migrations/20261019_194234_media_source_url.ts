import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "source_url" varchar;
  CREATE INDEX "media_source_url_idx" ON "media" USING btree ("source_url");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "media_source_url_idx";
  ALTER TABLE "media" DROP COLUMN "source_url";`)
}
