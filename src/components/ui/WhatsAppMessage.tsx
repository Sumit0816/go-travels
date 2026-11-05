import { cn } from '@/lib/cn'

type WhatsAppMessageProps = {
  /** Chat header, e.g. the team's WhatsApp display name. */
  header?: string
  /** Message text, one field per line. WhatsApp `*bold*` markup is rendered as bold. */
  text: string
  time?: string
  /** Show ✓✓ read ticks after the time. */
  read?: boolean
  className?: string
}

/** Renders WhatsApp's `*bold*` markup. Everything else stays plain text (no HTML injection). */
function renderWhatsAppMarkup(text: string) {
  return text
    .split(/(\*[^*\n]+\*)/g)
    .map((part, i) =>
      part.startsWith('*') && part.endsWith('*') && part.length > 2 ? (
        <b key={i}>{part.slice(1, -1)}</b>
      ) : (
        part
      ),
    )
}

/** Preview of the booking/enquiry message exactly as the team receives it on WhatsApp. */
export function WhatsAppMessage({
  header = 'Go Travels Bookings',
  text,
  time,
  read = true,
  className,
}: WhatsAppMessageProps) {
  return (
    <figure
      className={cn('gt-wa m-0', className)}
      aria-label={`WhatsApp message preview: ${header}`}
    >
      <div className="gt-wa__head">{header}</div>
      <div className="gt-wa__bubble">{renderWhatsAppMarkup(text)}</div>
      {time && (
        <div className="gt-wa__time">
          {time}
          {read && ' ✓✓'}
        </div>
      )}
    </figure>
  )
}
