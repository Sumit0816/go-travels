import type { Block } from 'payload'

import { linkFields } from '@/fields'

/** Embedded package card inside a blog post ("Package card" button in the editor). */
export const PackageCardBlock: Block = {
  slug: 'packageCard',
  labels: { singular: 'Package card', plural: 'Package cards' },
  fields: [{ name: 'package', type: 'relationship', relationTo: 'packages', required: true }],
}

// ---- Page layout blocks (About, Contact, Policies) ----

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Page header', plural: 'Page headers' },
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'intro', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'buttons',
      type: 'array',
      maxRows: 2,
      admin: { description: 'Optional, e.g. "Explore Tours" and "Contact Us".' },
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          name: 'style',
          type: 'select',
          defaultValue: 'primary',
          options: [
            { label: 'Primary (blue)', value: 'primary' },
            { label: 'Outline', value: 'outline' },
          ],
        },
        ...linkFields(),
      ],
    },
  ],
}

export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Text', plural: 'Text sections' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'content', type: 'richText', required: true },
  ],
}

export const StatsBlock: Block = {
  slug: 'stats',
  labels: { singular: 'Numbers', plural: 'Numbers' },
  fields: [
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      fields: [
        { name: 'value', type: 'text', required: true, admin: { description: 'e.g. 12,000+' } },
        { name: 'label', type: 'text', required: true },
      ],
    },
  ],
}

export const FeaturesBlock: Block = {
  slug: 'features',
  labels: { singular: 'Feature cards', plural: 'Feature cards' },
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    {
      name: 'variant',
      label: 'Style',
      type: 'select',
      defaultValue: 'cards',
      options: [
        { label: 'Cards', value: 'cards' },
        { label: 'Numbered steps', value: 'steps' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea' },
      ],
    },
  ],
}

export const TeamBlock: Block = {
  slug: 'team',
  labels: { singular: 'Team', plural: 'Team sections' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'members',
      type: 'array',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'role', type: 'text' },
        { name: 'photo', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}

export const CtaBlock: Block = {
  slug: 'cta',
  labels: { singular: 'Call to action', plural: 'Calls to action' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    { name: 'buttonLabel', type: 'text', required: true },
    ...linkFields(),
  ],
}

export const PAGE_BLOCKS: Block[] = [
  HeroBlock,
  RichTextBlock,
  StatsBlock,
  FeaturesBlock,
  TeamBlock,
  CtaBlock,
]
