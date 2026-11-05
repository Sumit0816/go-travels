import { Button, SiteHeader } from '@/components/ui'

/**
 * Phase 1 holding page: shows the brand foundation (header, hero type, buttons).
 * The full CMS-driven homepage is built in Phase 4.
 */
export default function HomePage() {
  return (
    <>
      <SiteHeader currentPath="/" />
      <main>
        <section
          className="relative overflow-hidden bg-night-900 bg-cover bg-center text-surface"
          style={{ backgroundImage: 'url(/brand/illustrations/hero.svg)' }}
        >
          <div className="container-site flex min-h-[520px] flex-col justify-center gap-5 py-18">
            <span className="text-eyebrow uppercase text-marigold-500">A new world awaits</span>
            <h1 className="heading-display max-w-[720px]">Discover. Dream. Travel.</h1>
            <p className="max-w-[560px] text-body-lg text-line-on-dark">
              Handpicked domestic, international and pilgrimage tours — planned by real people,
              confirmed on WhatsApp.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href="/tours" size="lg">
                Explore Packages
              </Button>
              <Button href="/contact" variant="outline" size="lg">
                Talk to an Expert
              </Button>
            </div>
          </div>
        </section>
        <section className="container-site py-12 text-body-sm text-ink-500">
          <p>
            Foundation build. Tour pages arrive in Phase 4.
            {process.env.NODE_ENV !== 'production' && (
              <>
                {' '}
                See the component library at <a href="/dev/ui">/dev/ui</a>.
              </>
            )}
          </p>
        </section>
      </main>
    </>
  )
}
