import type { CollectionConfig } from 'payload'

import { adminAccess } from '@/access'
import { MEDIA_FOLDERS } from '@/lib/catalog'
import { CACHE_TAGS } from '@/lib/revalidate'
import { revalidateHooks } from '@/fields'

/**
 * Media library. Uploads are converted to WebP and resized into the sizes the site uses.
 * Stored on local disk in development, or in an S3-compatible bucket when S3_BUCKET is set.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image', plural: 'Media Library' },
  admin: {
    group: 'Content',
    defaultColumns: ['filename', 'alt', 'folder', 'updatedAt'],
    listSearchableFields: ['filename', 'alt'],
    description: 'Images are compressed to WebP and resized automatically on upload.',
  },
  access: {
    ...adminAccess('packages'),
    read: () => true,
  },
  hooks: revalidateHooks([CACHE_TAGS.media]),
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'],
    focalPoint: true,
    crop: true,
    adminThumbnail: 'thumbnail',
    resizeOptions: { width: 2400, withoutEnlargement: true },
    formatOptions: { format: 'webp', options: { quality: 82 } },
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 800, height: 600, position: 'centre' },
      { name: 'hero', width: 1920, height: 720, position: 'centre' },
      { name: 'heroMobile', width: 780, height: 900, position: 'centre' },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
  },
  fields: [
    {
      name: 'alt',
      label: 'Alt text (for SEO & accessibility)',
      type: 'text',
      required: true,
      admin: { description: 'Describe what the photo shows, e.g. "Baga beach at sunset".' },
    },
    {
      name: 'folder',
      type: 'select',
      defaultValue: 'general',
      options: [...MEDIA_FOLDERS],
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'credit',
      type: 'text',
      admin: { position: 'sidebar', description: 'Photographer or licence, if required.' },
    },
  ],
}
