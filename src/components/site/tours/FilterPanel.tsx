'use client'

import { useRef, useState, type ReactNode } from 'react'

import { Icon } from '@/components/ui/Icon'
import { formatINR } from '@/lib/format'

/**
 * The filter form is rendered once. On wide screens it shows as the sidebar; on phones and
 * tablets the same element becomes a bottom sheet opened by "Filters" (design: Mobile listing).
 */
export function FilterPanel({
  activeCount,
  children,
}: {
  activeCount: number
  children: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  return (
    <>
      <button
        type="button"
        className="gt-btn gt-btn--outline lg:hidden"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        <Icon name="search" size={18} />
        Filters
        {activeCount > 0 && (
          <span className="rounded-pill bg-ocean-700 px-2 py-0.5 text-[11px] text-surface">
            {activeCount}
          </span>
        )}
      </button>
      <dialog
        ref={dialog}
        className="gt-filter-sheet"
        aria-label="Filters"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close()
        }}
      >
        <div className="gt-filter-sheet__head lg:hidden">
          <b className="font-display text-[18px]">Filters</b>
          <button
            type="button"
            className="gt-btn gt-btn--ghost gt-btn--icon"
            aria-label="Close filters"
            onClick={() => dialog.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </dialog>
    </>
  )
}

/** Budget slider with a live value label (plain range input without JS). */
export function BudgetRange({
  min,
  max,
  step,
  defaultValue,
}: {
  min: number
  max: number
  step: number
  defaultValue?: number
}) {
  const [value, setValue] = useState(defaultValue ?? max)
  const isMax = value >= max
  return (
    <div className="flex flex-col gap-2">
      <input
        type="range"
        name={isMax ? undefined : 'budget'}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        aria-label="Maximum budget per person"
        aria-valuetext={isMax ? 'Any budget' : `Up to ${formatINR(value)}`}
        className="w-full accent-ocean-700"
      />
      <div className="flex justify-between text-caption text-ink-500">
        <span>{formatINR(min)}</span>
        <span className="font-semibold text-ink-900">
          {isMax ? 'Any budget' : `up to ${formatINR(value)}`}
        </span>
      </div>
    </div>
  )
}

/** Sort control: submits its form on change; a hidden button keeps it usable without JS. */
export function SortSelect({
  options,
  value,
}: {
  options: readonly { label: string; value: string }[]
  value: string
}) {
  return (
    <label className="flex items-center gap-2 text-body-sm font-semibold">
      Sort by
      <select
        name="sort"
        defaultValue={value}
        className="gt-input h-11 w-auto"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="gt-btn gt-btn--sm gt-btn--outline">
          Apply
        </button>
      </noscript>
    </label>
  )
}
