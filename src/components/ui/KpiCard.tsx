import type { ReactNode } from 'react'

type KpiCardProps = {
  label: string
  value: ReactNode
  /** Says what the number counts, so it never stands unexplained. */
  note: string
}

/** CMS dashboard metric. Place 3–4 inside a `.gt-kpi-grid`. */
export function KpiCard({ label, value, note }: KpiCardProps) {
  return (
    <div className="gt-kpi">
      <span className="gt-kpi__label">{label}</span>
      <span className="gt-kpi__value">{value}</span>
      <span className="gt-kpi__note">{note}</span>
    </div>
  )
}
