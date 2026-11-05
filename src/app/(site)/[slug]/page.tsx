import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/site/Breadcrumbs'
import { buildContact } from '@/components/site/data'
import { ContactForm } from '@/components/site/EnquiryForms'
import { PageBlocks } from '@/components/site/PageBlocks'
import { RichText } from '@/components/site/RichText'
import { Icon, type IconName } from '@/components/ui/Icon'
import { getPageBySlug, getPublishedPageSlugs, getSiteSettings } from '@/lib/cms'
import { pickImage } from '@/lib/site/media'
import type { Page, SiteSetting } from '@/payload-types'

export const revalidate = 600

type Props = { params: Promise<{ slug: string }> }

/** Policy pages share one tabbed layout (design: "Desktop · Policies"). */
const POLICY_TABS = [
  { slug: 'privacy', label: 'Privacy Policy' },
  { slug: 'terms', label: 'Terms & Conditions' },
  { slug: 'booking-policy', label: 'Booking & Cancellation' },
] as const

const isPolicy = (slug: string) => POLICY_TABS.some((t) => t.slug === slug)

export async function generateStaticParams() {
  const pages = await getPublishedPageSlugs().catch(() => [])
  return pages.filter((p) => p.slug).map((p) => ({ slug: p.slug! }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) return {}
  const hero = page.layout.find((b) => b.blockType === 'hero')
  const og = pickImage(page.seo?.ogImage ?? (hero && 'image' in hero ? hero.image : null), 'og')
  return {
    title: page.seo?.metaTitle || page.title,
    description:
      page.seo?.metaDescription ||
      (hero && 'intro' in hero ? hero.intro : null) ||
      `${page.title} — Go Travels.`,
    alternates: { canonical: `/${slug}` },
    openGraph: og
      ? { images: [{ url: og.src, width: og.width, height: og.height, alt: og.alt }] }
      : undefined,
  }
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) notFound()

  if (slug === 'contact') {
    const settings = await getSiteSettings().catch(() => null)
    return <ContactLayout page={page} settings={settings} />
  }
  if (isPolicy(slug)) return <PolicyLayout page={page} slug={slug} />
  return <PageBlocks blocks={page.layout} title={page.title} />
}

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

function PolicyLayout({ page, slug }: { page: Page; slug: string }) {
  const text = page.layout.filter((b) => b.blockType === 'richText')
  return (
    <div className="container-site flex flex-col gap-6 py-8 md:py-12">
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Policies' }, { label: page.title }]}
      />
      <header className="flex flex-col gap-2">
        <span className="eyebrow">Policies</span>
        <h1 className="heading-1 m-0">{page.title}</h1>
        <p className="m-0 text-body-sm text-ink-500">
          Last updated{' '}
          <time dateTime={page.updatedAt}>{dateFmt.format(new Date(page.updatedAt))}</time>
        </p>
      </header>
      <nav aria-label="Policies" className="gt-tabs">
        {POLICY_TABS.map((t) => (
          <Link
            key={t.slug}
            href={`/${t.slug}`}
            aria-current={t.slug === slug ? 'page' : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="max-w-[820px]">
        {text.map((b, i) => (
          <section key={b.id ?? i} className="mb-8">
            {b.heading && <h2 className="heading-3 mb-3">{b.heading}</h2>}
            <RichText data={b.content} />
          </section>
        ))}
      </div>
    </div>
  )
}

/** Only Google Maps embeds are allowed in the iframe. */
function safeMapUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.protocol === 'https:' &&
      /(^|\.)google\.[a-z.]+$/.test(u.hostname) &&
      u.pathname.startsWith('/maps')
      ? u.toString()
      : null
  } catch {
    return null
  }
}

function ContactLayout({ page, settings }: { page: Page; settings: SiteSetting | null }) {
  const contact = buildContact(settings)
  const hero = page.layout.find((b) => b.blockType === 'hero')
  const rest = page.layout.filter((b) => b !== hero)
  const map = safeMapUrl(settings?.mapEmbedUrl)
  const directions = settings?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`
    : null

  const cards: {
    icon: IconName
    title: string
    value: string
    href: string | null
    tone?: 'wa'
  }[] = []
  if (contact.phone)
    cards.push({ icon: 'phone', title: 'Call us', value: contact.phone, href: contact.phoneHref })
  if (contact.whatsappHref)
    cards.push({
      icon: 'whatsapp',
      title: 'WhatsApp',
      value: 'Chat with a travel expert',
      href: contact.whatsappHref,
      tone: 'wa',
    })
  if (contact.email)
    cards.push({
      icon: 'mail',
      title: 'Email',
      value: contact.email,
      href: `mailto:${contact.email}`,
    })
  if (settings?.address)
    cards.push({ icon: 'mapPin', title: 'Visit', value: settings.address, href: directions })

  return (
    <>
      <section className="bg-sand-100">
        <div className="container-site flex flex-col gap-3 py-10 md:py-14">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: page.title }]} />
          <span className="eyebrow">
            {(hero?.blockType === 'hero' && hero.eyebrow) || 'Reach us'}
          </span>
          <h1 className="heading-1 m-0 max-w-[640px]">
            {(hero?.blockType === 'hero' && hero.heading) || page.title}
          </h1>
          {hero?.blockType === 'hero' && hero.intro && (
            <p className="m-0 max-w-[620px] text-body-lg text-ink-700">{hero.intro}</p>
          )}
          {contact.hours && <p className="m-0 text-body-sm text-ink-500">Open {contact.hours}</p>}
        </div>
      </section>

      <div className="container-site flex flex-col gap-10 py-10 md:py-14">
        {cards.length > 0 && (
          <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => {
              const body = (
                <>
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-pill ${c.tone === 'wa' ? 'bg-whatsapp-600 text-surface' : 'bg-ocean-50 text-ocean-700'}`}
                    aria-hidden="true"
                  >
                    <Icon name={c.icon} size={20} />
                  </span>
                  <span className="font-display text-[17px] font-semibold">{c.title}</span>
                  <span className="text-body-sm break-words text-ink-700">{c.value}</span>
                </>
              )
              return (
                <li key={c.title}>
                  {c.href ? (
                    <a
                      href={c.href}
                      {...(/^https?:/.test(c.href) ? { target: '_blank', rel: 'noreferrer' } : {})}
                      className="flex h-full flex-col gap-2 rounded-lg border border-line-200 bg-surface p-5 no-underline text-ink-900 hover:shadow-card"
                    >
                      {body}
                    </a>
                  ) : (
                    <div className="flex h-full flex-col gap-2 rounded-lg border border-line-200 bg-surface p-5">
                      {body}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <div className={`grid gap-8 ${map ? 'lg:grid-cols-[1.2fr_1fr]' : ''}`}>
          <section
            aria-labelledby="contact-form-title"
            className="rounded-lg border border-line-200 bg-surface p-5 md:p-7"
          >
            <h2 id="contact-form-title" className="heading-3 mb-5">
              Send us a message
            </h2>
            <ContactForm whatsappHref={contact.whatsappHref} />
          </section>
          {map && (
            <section aria-labelledby="contact-map-title" className="flex flex-col gap-3">
              <h2 id="contact-map-title" className="heading-3 m-0">
                Find our office
              </h2>
              <iframe
                src={map}
                title="Map showing the Go Travels office"
                className="min-h-[320px] w-full flex-1 rounded-lg border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              {directions && (
                <a
                  href={directions}
                  target="_blank"
                  rel="noreferrer"
                  className="gt-btn gt-btn--outline self-start"
                >
                  <Icon name="mapPin" size={18} />
                  Get directions
                </a>
              )}
            </section>
          )}
        </div>
      </div>
      {rest.length > 0 && <PageBlocks blocks={rest} title={page.title} withTitle={false} />}
    </>
  )
}
