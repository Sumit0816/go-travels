import type { ReactNode } from 'react'

/** Full-width message screen (design: "States" — 404, errors). */
export function StateScreen({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow: string
  title: string
  children: ReactNode
  actions: ReactNode
}) {
  return (
    <section className="container-site flex flex-col items-center gap-5 py-16 text-center md:py-24">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative illustration */}
      <img
        src="/brand/illustrations/map.svg"
        alt=""
        width={220}
        height={150}
        className="h-auto w-[220px] opacity-90"
      />
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="heading-1 m-0 max-w-[620px]">{title}</h1>
      <div className="max-w-[520px] text-body-lg text-ink-700">{children}</div>
      <div className="flex flex-wrap justify-center gap-3">{actions}</div>
    </section>
  )
}
