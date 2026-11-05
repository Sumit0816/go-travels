import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Bookings } from './collections/Bookings'
import { Categories } from './collections/Categories'
import { Counters } from './collections/Counters'
import { Destinations } from './collections/Destinations'
import { Enquiries } from './collections/Enquiries'
import { Media } from './collections/Media'
import { MessageLog } from './collections/MessageLog'
import { Packages } from './collections/Packages'
import { Pages } from './collections/Pages'
import { PostCategories, Posts } from './collections/Posts'
import { ReviewLinks } from './collections/ReviewLinks'
import { Slides } from './collections/Slides'
import { Testimonials } from './collections/Testimonials'
import { Users } from './collections/Users'
import { Homepage } from './globals/Homepage'
import { Navigation } from './globals/Navigation'
import { SiteSettings } from './globals/SiteSettings'
import { WhatsAppSettings } from './globals/WhatsAppSettings'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const useS3 = Boolean(process.env.S3_BUCKET)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || '',
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · Go Travels CMS',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/brand/go-travels-favicon.svg' }],
    },
    components: {
      graphics: {
        Logo: '/components/admin/AdminGraphics#AdminLogo',
        Icon: '/components/admin/AdminGraphics#AdminIcon',
      },
      views: {
        dashboard: { Component: '/components/admin/views/Dashboard#Dashboard' },
      },
    },
    dateFormat: 'dd MMM yyyy',
  },
  // Sidebar order follows the CMS design: Overview → Content → Settings.
  collections: [
    Bookings,
    Enquiries,
    Packages,
    Destinations,
    Categories,
    Slides,
    Testimonials,
    ReviewLinks,
    Posts,
    PostCategories,
    Pages,
    Media,
    Users,
    MessageLog,
    Counters,
  ],
  globals: [Homepage, Navigation, WhatsAppSettings, SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    // Development syncs the schema automatically; production applies these migrations on start.
    // After changing collections, run `npm run payload -- migrate:create <name>` and commit the result.
    prodMigrations: migrations,
  }),
  upload: { limits: { fileSize: 10_000_000 } },
  sharp,
  plugins: [
    s3Storage({
      enabled: useS3,
      collections: { media: true },
      bucket: process.env.S3_BUCKET || '',
      config: {
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: Boolean(process.env.S3_ENDPOINT),
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
})
