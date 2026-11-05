import type { ReactNode } from 'react'

import { Breadcrumbs, type Crumb } from './Breadcrumbs'

/** Dark page header with breadcrumb, title and intro (design: listing and destination pages). */
export function PageHero({
  crumbs,
  title,
  intro,
  image,
  children,
}: {
  crumbs: Crumb[]
  title: string
  intro?: string | null
  image?: { src: string; position: string } | null
  children?: ReactNode
}) {
  return (
    <section className="relative overflow-hidden bg-ink-900 text-surface">
      {image && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative CMS header image */}
          <img
            src={image.src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-45"
            style={{ objectPosition: image.position }}
          />
          <span
            className="absolute inset-0 bg-gradient-to-r from-ink-900/90 to-ink-900/40"
            aria-hidden="true"
          />
        </>
      )}
      <div className="container-site relative flex flex-col gap-3 py-8 md:py-14">
        <Breadcrumbs items={crumbs} onDark />
        <h1 className="heading-1">{title}</h1>
        {intro && <p className="m-0 max-w-[680px] text-body-lg text-[#D8E6EC]">{intro}</p>}
        {children}
      </div>
    </section>
  )
}
