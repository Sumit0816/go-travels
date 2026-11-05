'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { Icon } from '@/components/ui/Icon'

export type HeroSlide = {
  id: string
  eyebrow?: string | null
  heading: string
  buttonLabel: string
  href: string
  desktop: { src: string; alt: string; position: string } | null
  mobile: { src: string; position: string } | null
}

const INTERVAL_MS = 7000

/**
 * Homepage hero (design: "Hero slider"). Advances every 7 s, pauses on hover or keyboard
 * focus, and never auto-advances for visitors who prefer reduced motion.
 */
export function HeroSlider({ slides, intro }: { slides: HeroSlide[]; intro: string }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = slides.length
  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count])

  useEffect(() => {
    if (count < 2 || paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setTimeout(() => go(index + 1), INTERVAL_MS)
    return () => window.clearTimeout(t)
  }, [index, paused, count, go])

  return (
    <section
      className="gt-hero"
      aria-roledescription="carousel"
      aria-label="Featured trips"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.id}
          className="gt-hero__slide"
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${count}`}
          aria-hidden={i !== index}
          data-active={i === index}
        >
          {s.desktop && (
            <picture>
              {s.mobile && <source media="(max-width: 767px)" srcSet={s.mobile.src} />}
              <img
                src={s.desktop.src}
                alt=""
                className="gt-hero__img"
                style={{ objectPosition: s.desktop.position }}
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'auto'}
              />
            </picture>
          )}
          <div className="gt-hero__content container-site">
            {s.eyebrow && <span className="gt-hero__eyebrow">{s.eyebrow}</span>}
            {i === 0 ? (
              <h1 className="heading-display max-w-[720px]">{s.heading}</h1>
            ) : (
              <p className="heading-display m-0 max-w-[720px]">{s.heading}</p>
            )}
            <p className="m-0 max-w-[560px] text-body-lg text-[#D8E6EC]">{intro}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link
                href={s.href}
                className="gt-btn gt-btn--accent gt-btn--lg"
                tabIndex={i === index ? 0 : -1}
              >
                {s.buttonLabel}
              </Link>
              <Link
                href="/plan-my-trip"
                className="gt-btn gt-btn--lg gt-hero__ghost"
                tabIndex={i === index ? 0 : -1}
              >
                Talk to an Expert
              </Link>
            </div>
          </div>
        </div>
      ))}

      {count > 1 && (
        <>
          <button
            type="button"
            className="gt-hero__arrow gt-hero__arrow--prev"
            aria-label="Previous slide"
            onClick={() => go(index - 1)}
          >
            <Icon name="chevronLeft" />
          </button>
          <button
            type="button"
            className="gt-hero__arrow gt-hero__arrow--next"
            aria-label="Next slide"
            onClick={() => go(index + 1)}
          >
            <Icon name="chevronRight" />
          </button>
          <div className="gt-hero__dots">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Show slide ${i + 1}: ${s.heading}`}
                aria-current={i === index}
                onClick={() => go(i)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
