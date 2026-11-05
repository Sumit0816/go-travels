import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  BookingStepper,
  Button,
  Chip,
  PackageCard,
  StatusBadge,
  TextField,
  WhatsAppMessage,
  toneForStatus,
} from '@/components/ui'

describe('Button', () => {
  it('renders a button with the variant class by default', () => {
    render(<Button variant="whatsapp">Send Booking via WhatsApp</Button>)
    const btn = screen.getByRole('button', { name: 'Send Booking via WhatsApp' })
    expect(btn).toHaveClass('gt-btn', 'gt-btn--whatsapp')
    expect(btn).toHaveAttribute('type', 'button')
  })

  it('renders a link when href is given', () => {
    render(
      <Button href="/tours" variant="accent" size="sm">
        Plan My Trip
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Plan My Trip' })
    expect(link).toHaveAttribute('href', '/tours')
    expect(link).toHaveClass('gt-btn--accent', 'gt-btn--sm')
  })
})

describe('Chip', () => {
  it('exposes its pressed state', () => {
    render(<Chip pressed>Goa</Chip>)
    expect(screen.getByRole('button', { name: 'Goa' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('TextField', () => {
  it('links the label and writes the error in text', () => {
    render(
      <TextField
        label="WhatsApp number"
        required
        prefix="+91"
        error="Enter a valid 10-digit mobile number"
      />,
    )
    const input = screen.getByLabelText(/WhatsApp number/)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Enter a valid 10-digit mobile number')
  })
})

describe('StatusBadge', () => {
  it('maps statuses to tones from the design system', () => {
    expect(toneForStatus('Delivered')).toBe('success')
    expect(toneForStatus('Read')).toBe('info')
    expect(toneForStatus('Queued')).toBe('warning')
    expect(toneForStatus('Failed')).toBe('danger')
    expect(toneForStatus('Archived')).toBe('neutral')
    expect(toneForStatus('something else')).toBe('neutral')
  })

  it('applies the tone class', () => {
    render(<StatusBadge>Failed</StatusBadge>)
    expect(screen.getByText('Failed')).toHaveClass('gt-badge--danger')
  })
})

describe('PackageCard', () => {
  it('is a single link with formatted duration and price', () => {
    render(
      <PackageCard
        href="/packages/goa-beach-escape"
        place="Goa"
        tag="Bestseller"
        title="Goa Beach Escape with North & South Goa Tour"
        nights={3}
        inclusions="Hotel · Breakfast · Transfers"
        price={12499}
      />,
    )
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/packages/goa-beach-escape')
    expect(within(links[0]).getByText('3N / 4D')).toBeInTheDocument()
    expect(within(links[0]).getByText('₹12,499')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('BookingStepper', () => {
  it('marks done and current steps and never mentions payment', () => {
    const { container } = render(<BookingStepper current={3} />)
    const steps = container.querySelectorAll('.gt-step')
    expect(steps).toHaveLength(4)
    expect(steps[0]).toHaveClass('gt-step--done')
    expect(steps[1]).toHaveClass('gt-step--done')
    expect(steps[2]).toHaveClass('gt-step--current')
    expect(steps[2]).toHaveAttribute('aria-current', 'step')
    expect(container.textContent).not.toMatch(/payment/i)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3')
  })
})

describe('WhatsAppMessage', () => {
  it('renders *bold* markup as bold and keeps other text as plain text', () => {
    render(
      <WhatsAppMessage text={'*New Booking Request* · GT-24871\nName: <b>x</b>'} time="12:41 PM" />,
    )
    expect(screen.getByText('New Booking Request').tagName).toBe('B')
    expect(screen.getByText(/Name: <b>x<\/b>/)).toBeInTheDocument()
    expect(screen.getByText('12:41 PM ✓✓')).toBeInTheDocument()
  })
})
