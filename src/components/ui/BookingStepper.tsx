import { cn } from '@/lib/cn'

/** The four booking steps. The last is never "Payment" — there is no payment gateway. */
export const BOOKING_STEPS = [
  'Trip details',
  'Traveller details',
  'Review',
  'Sent to WhatsApp',
] as const

type BookingStepperProps = {
  /** 1-based current step. */
  current: number
  steps?: readonly string[]
  className?: string
}

/** Desktop: four bars with numbered dots. Mobile (<768px): one progress bar + "Step 2 of 4". */
export function BookingStepper({ current, steps = BOOKING_STEPS, className }: BookingStepperProps) {
  const total = steps.length
  return (
    <div className={className}>
      <ol className="gt-stepper hidden md:grid" aria-label="Booking steps">
        {steps.map((name, i) => {
          const n = i + 1
          const done = n < current
          const isCurrent = n === current
          return (
            <li
              key={name}
              className={cn('gt-step', done && 'gt-step--done', isCurrent && 'gt-step--current')}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="gt-step__row">
                <span className="gt-step__dot" aria-hidden="true">
                  {done ? '✓' : n}
                </span>
                {name}
                {done && <span className="sr-only"> (completed)</span>}
              </span>
            </li>
          )
        })}
      </ol>
      <div className="gt-stepper-mobile md:hidden">
        <div
          className="gt-stepper-mobile__bar"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={current}
          aria-label="Booking progress"
        >
          <span style={{ width: `${(Math.min(current, total) / total) * 100}%` }} />
        </div>
        <span>
          Step {current} of {total} · {steps[current - 1]}
        </span>
      </div>
    </div>
  )
}
