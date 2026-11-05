import Link from 'next/link'

import { initials } from '@/lib/cms'
import { hrefFor, type CmsLink } from '@/lib/site/links'
import { pickImage } from '@/lib/site/media'
import type { Page } from '@/payload-types'

import { Breadcrumbs } from './Breadcrumbs'
import { RichText } from './RichText'

type Block = Page['layout'][number]
type BlockOf<T extends Block['blockType']> = Extract<Block, { blockType: T }>

/** Page header (design: About hero). The first hero on a page carries the h1 and breadcrumb. */
function Hero({
  block,
  title,
  isFirst,
}: {
  block: BlockOf<'hero'>
  title: string
  isFirst: boolean
}) {
  const img = pickImage(block.image, 'hero')
  const Heading = isFirst ? 'h1' : 'h2'
  const buttons = (block.buttons ?? [])
    .map((b) => ({ ...b, href: hrefFor(b as CmsLink) }))
    .filter((b) => b.href)
  return (
    <section className="bg-sand-100">
      <div
        className={`container-site grid items-center gap-8 py-10 md:py-16 ${img ? 'lg:grid-cols-[1.1fr_1fr]' : ''}`}
      >
        <div className="flex flex-col gap-4">
          {isFirst && <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: title }]} />}
          {block.eyebrow && <span className="eyebrow">{block.eyebrow}</span>}
          <Heading className="heading-1 m-0 max-w-[640px]">{block.heading}</Heading>
          {block.intro && (
            <p className="m-0 max-w-[620px] text-body-lg leading-relaxed text-ink-700">
              {block.intro}
            </p>
          )}
          {buttons.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-3">
              {buttons.map((b) => (
                <Link
                  key={b.id ?? b.label}
                  href={b.href!}
                  className={`gt-btn gt-btn--lg ${b.style === 'outline' ? 'gt-btn--outline' : 'gt-btn--primary'}`}
                >
                  {b.label}
                </Link>
              ))}
            </div>
          )}
        </div>
        {img && (
          // eslint-disable-next-line @next/next/no-img-element -- CMS image with focal point
          <img
            src={img.src}
            alt={img.alt}
            width={img.width}
            height={img.height}
            className="aspect-[4/3] w-full rounded-lg object-cover shadow-card"
            style={{ objectPosition: img.position }}
          />
        )}
      </div>
    </section>
  )
}

function Stats({ block }: { block: BlockOf<'stats'> }) {
  if (!block.items?.length) return null
  return (
    <section className="border-b border-line-200 bg-surface">
      <dl className="container-site m-0 grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
        {block.items.map((s) => (
          <div key={s.id ?? s.label} className="flex flex-col-reverse gap-1 text-center">
            <dt className="text-body-sm text-ink-500">{s.label}</dt>
            <dd className="m-0 font-display text-[32px] font-bold text-ocean-700">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function Features({ block }: { block: BlockOf<'features'> }) {
  if (!block.items?.length) return null
  const steps = block.variant === 'steps'
  const List = steps ? 'ol' : 'ul'
  return (
    <section className={steps ? 'bg-sand-100 py-12 md:py-16' : 'py-12 md:py-16'}>
      <div className="container-site">
        {(block.eyebrow || block.heading) && (
          <div className="mb-8 flex flex-col gap-2">
            {block.eyebrow && <span className="eyebrow">{block.eyebrow}</span>}
            {block.heading && <h2 className="heading-2 m-0">{block.heading}</h2>}
          </div>
        )}
        <List className={`m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4`}>
          {block.items.map((f, i) => (
            <li
              key={f.id ?? f.title}
              className="flex flex-col gap-2 rounded-lg border border-line-200 bg-surface p-5"
            >
              {steps && (
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-pill bg-ocean-700 font-display font-bold text-surface"
                >
                  {i + 1}
                </span>
              )}
              <h3 className="text-h4 m-0 font-display">{f.title}</h3>
              {f.text && <p className="m-0 text-body-sm leading-relaxed text-ink-700">{f.text}</p>}
            </li>
          ))}
        </List>
      </div>
    </section>
  )
}

function Team({ block }: { block: BlockOf<'team'> }) {
  if (!block.members?.length) return null
  return (
    <section className="py-12 md:py-16">
      <div className="container-site">
        {block.heading && <h2 className="heading-2 mb-8">{block.heading}</h2>}
        <ul className="m-0 grid list-none grid-cols-2 gap-6 p-0 md:grid-cols-4">
          {block.members.map((m) => {
            const photo = pickImage(m.photo, 'thumbnail')
            return (
              <li key={m.id ?? m.name} className="flex flex-col items-center gap-2 text-center">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- CMS portrait
                  <img
                    src={photo.src}
                    alt=""
                    className="h-28 w-28 rounded-pill object-cover"
                    style={{ objectPosition: photo.position }}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-28 w-28 items-center justify-center rounded-pill bg-ocean-50 font-display text-[28px] font-bold text-ocean-700"
                  >
                    {initials(m.name)}
                  </span>
                )}
                <span className="font-display text-[17px] font-semibold">{m.name}</span>
                {m.role && <span className="text-body-sm text-ink-500">{m.role}</span>}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

function Cta({ block }: { block: BlockOf<'cta'> }) {
  const href = hrefFor(block as CmsLink)
  return (
    <section className="py-10 md:py-14">
      <div className="container-site">
        <div className="flex flex-col items-start gap-4 rounded-lg bg-ocean-700 px-6 py-8 text-surface md:flex-row md:items-center md:justify-between md:px-10">
          <div className="flex flex-col gap-2">
            <h2 className="heading-3 m-0">{block.heading}</h2>
            {block.text && <p className="m-0 text-[#D8E6EC]">{block.text}</p>}
          </div>
          {href && (
            <Link href={href} className="gt-btn gt-btn--accent gt-btn--lg shrink-0">
              {block.buttonLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

function Text({ block }: { block: BlockOf<'richText'> }) {
  return (
    <section className="py-10 md:py-12">
      <div className="container-site max-w-[820px]">
        {block.heading && <h2 className="heading-2 mb-4">{block.heading}</h2>}
        <RichText data={block.content} />
      </div>
    </section>
  )
}

/** Renders a page's layout blocks in order (About and other CMS pages). */
export function PageBlocks({
  blocks,
  title,
  withTitle = true,
}: {
  blocks: Block[]
  title: string
  withTitle?: boolean
}) {
  const firstHero = blocks.findIndex((b) => b.blockType === 'hero')
  return (
    <>
      {withTitle && firstHero !== 0 && (
        <div className="container-site pt-6">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: title }]} />
          <h1 className="heading-1 mt-3">{title}</h1>
        </div>
      )}
      {blocks.map((b, i) => {
        const key = b.id ?? `${b.blockType}-${i}`
        switch (b.blockType) {
          case 'hero':
            return <Hero key={key} block={b} title={title} isFirst={withTitle && i === 0} />
          case 'stats':
            return <Stats key={key} block={b} />
          case 'features':
            return <Features key={key} block={b} />
          case 'team':
            return <Team key={key} block={b} />
          case 'cta':
            return <Cta key={key} block={b} />
          case 'richText':
            return <Text key={key} block={b} />
          default:
            return null
        }
      })}
    </>
  )
}
