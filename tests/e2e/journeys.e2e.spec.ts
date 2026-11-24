/**
 * Launch journeys (Phase 6): the booking flow using only the keyboard, an Owner changing a
 * booking's status, and role restrictions for Sales. Needs the demo content (`npm run seed`).
 */
import { randomUUID } from 'node:crypto'

import { expect, test, type Page } from '@playwright/test'
import { getPayload } from 'payload'

import config from '../../src/payload.config.js'
import { login } from '../helpers/login'
import { cleanupTestUser, seedTestUser, testUser } from '../helpers/seedUser'

/** Presses Tab until the focused element matches, like a keyboard user would. */
async function tabTo(page: Page, matches: (el: Element) => boolean, max = 60) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab')
    const ok = await page.evaluate((src) => {
      const el = document.activeElement
      return !!el && (new Function('el', `return (${src})(el)`) as (e: Element) => boolean)(el)
    }, matches.toString())
    if (ok) return
  }
  throw new Error('Could not reach the element with Tab')
}

test.describe('Keyboard only', () => {
  test.beforeEach(async ({ request, isMobile }) => {
    test.skip(isMobile, 'Keyboard journey runs on desktop')
    const res = await request.get('/packages/goa-beach-escape/book')
    test.skip(res.status() === 404, 'Demo content not loaded (run npm run seed)')
  })

  test('a booking can be completed without a mouse', async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto('/packages/goa-beach-escape/book?adults=2&hotel=deluxe4')
    await page.locator('[data-ready]').waitFor()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Trip details')

    // Step 1. The date picker is the browser's own control (keyboard-accessible, but its digit
    // order follows the browser language), so its value is set directly; the rest is keys only.
    await page
      .getByLabel('Travel date*')
      .fill(new Date(Date.now() + 45 * 86_400_000).toISOString().slice(0, 10))
    await tabTo(page, (el) => el.getAttribute('aria-label') === 'Add adult')
    await page.keyboard.press('Enter')
    await expect(page.locator('output[aria-label="Adults"]')).toHaveText('3')
    await tabTo(page, (el) => el.textContent?.trim() === 'Continue')
    await page.keyboard.press('Enter')

    // Step 2: focus starts on the heading; fields follow in order.
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Traveller details')
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
    await tabTo(page, (el) => el.getAttribute('name') === 'name')
    await page.keyboard.type('Keyboard Traveller')
    await tabTo(page, (el) => el.getAttribute('name') === 'whatsapp')
    await page.keyboard.type('9830122457')
    await tabTo(page, (el) => el.getAttribute('name') === 'consent')
    await page.keyboard.press('Space')
    await tabTo(page, (el) => el.textContent?.trim() === 'Continue')
    await page.keyboard.press('Enter')

    // Step 3: review, then send.
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Review your request')
    await tabTo(page, (el) => el.textContent?.trim() === 'Send Booking via WhatsApp')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Booking request sent!')
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  })

  test('the enquiry pop-up traps focus and closes with Escape', async ({ page }) => {
    await page.goto('/about')
    const cta = page.getByRole('link', { name: 'Find Your Perfect Trip' }).filter({ visible: true })
    await cta.first().focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Find Your Perfect Trip' })
    await expect(dialog).toBeVisible()
    // A modal dialog keeps focus off the page behind it: Tab cycles through the dialog (and the
    // browser's own controls, seen here as <body>), never page elements.
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab')
      const where = await dialog.evaluate((d) => {
        const el = document.activeElement
        return !el || el === document.body ? 'browser' : d.contains(el) ? 'dialog' : 'page'
      })
      expect(where).not.toBe('page')
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    // Focus returns to the page, not lost.
    expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true)
  })
})

test.describe('Admin journeys', () => {
  const tag = randomUUID().slice(0, 8)
  const sales = { email: `e2e-sales-${tag}@example.test`, password: `pw-${randomUUID()}` }
  let bookingId: number
  let requestId: string

  test.beforeAll(async () => {
    await seedTestUser()
    const payload = await getPayload({ config })
    await payload.create({
      collection: 'users',
      data: { ...sales, name: 'E2E Sales', role: 'sales', status: 'active', whatsappAlerts: 'no' },
    })
    const b = await payload.create({
      collection: 'bookings',
      data: {
        name: `E2E Status ${tag}`,
        whatsapp: '9830122457',
        travelDate: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        adults: 2,
        status: 'new',
      },
    })
    bookingId = b.id
    requestId = b.requestId!
  })

  test.afterAll(async () => {
    const payload = await getPayload({ config })
    await payload.delete({ collection: 'bookings', id: bookingId })
    await payload.delete({ collection: 'users', where: { email: { equals: sales.email } } })
    await cleanupTestUser()
  })

  test('an Owner changes a booking status from the dashboard', async ({ page }) => {
    await login({ page, user: testUser })
    const select = page.getByLabel(`Status of ${requestId}`)
    await expect(select).toHaveValue('new')
    await select.selectOption('contacted')
    await expect(async () => {
      await page.reload()
      await expect(page.getByLabel(`Status of ${requestId}`)).toHaveValue('contacted')
    }).toPass({ timeout: 15_000 })
  })

  test('Sales cannot open WhatsApp settings or users', async ({ page }) => {
    await login({ page, user: sales })
    await expect(page.getByRole('link', { name: 'WhatsApp Integration' })).toHaveCount(0)
    await page.goto('/admin/globals/whatsappSettings')
    await expect(page.getByRole('button', { name: 'Send test message' })).toHaveCount(0)
    const res = await page.request.get('/api/globals/whatsappSettings')
    expect(res.status()).toBe(403)
    expect((await page.request.get('/api/users')).status()).toBe(403)
  })
})
