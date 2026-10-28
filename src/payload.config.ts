import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { uploadthingStorage } from '@payloadcms/storage-uploadthing'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { ContactMessages } from './collections/ContactMessages'
import { Products } from './collections/Products'
import { Categories } from './collections/Categories'
import { Orders } from './collections/Orders'
import { Posts } from './collections/Posts'
import { BlogCategories } from './collections/BlogCategories'
import { PrescriptionRequests } from './collections/PrescriptionRequests'
import { SiteSettings } from './globals/SiteSettings'
import { ShopSettings } from './globals/ShopSettings'
import { LegalPages } from './globals/LegalPages'
import { cronMaintenance } from './endpoints/cron'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — Pharmacy Admin',
    },
  },
  collections: [
    PrescriptionRequests,
    Orders,
    Products,
    Categories,
    Posts,
    BlogCategories,
    Users,
    Media,
    ContactMessages,
  ],
  globals: [SiteSettings, ShopSettings, LegalPages],
  endpoints: [cronMaintenance],
  editor: lexicalEditor(),
  // Without RESEND_API_KEY (local dev), Payload prints emails to the server console instead.
  email: process.env.RESEND_API_KEY
    ? resendAdapter({
        apiKey: process.env.RESEND_API_KEY,
        defaultFromAddress: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        defaultFromName: process.env.EMAIL_FROM_NAME || 'Pharmacy',
        // Testing: send every email to this address instead of the real recipient.
        overrideRecipientAddress: process.env.EMAIL_OVERRIDE_TO || undefined,
      })
    : undefined,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Dev uses schema push. Production (Neon) gets migrations from src/migrations, applied by the
    // `ci` script (Netlify build). After changing collections or globals:
    // `pnpm payload migrate:create <name>` and commit the files.
  }),
  sharp,
  plugins: [
    // Production (Netlify has no permanent disk): uploads go to UploadThing (free plan, no card).
    // Without UPLOADTHING_TOKEN (local dev) they stay in ./media. Images keep their /api/media/file/… URLs.
    uploadthingStorage({
      enabled: Boolean(process.env.UPLOADTHING_TOKEN),
      // Same schema with or without the token, so one migration fits dev and production.
      alwaysInsertFields: true,
      // The admin's browser sends files straight to UploadThing: Netlify functions reject bodies over ~6 MB.
      clientUploads: true,
      collections: { media: true },
      options: { token: process.env.UPLOADTHING_TOKEN, acl: 'public-read' },
    }),
  ],
})
