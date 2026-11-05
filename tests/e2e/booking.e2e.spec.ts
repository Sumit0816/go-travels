/**
 * Booking flow, enquiry pop-up and the WhatsApp admin tools. Needs the demo content
 * (`npm run seed`): with no provider key saved, messages go to the console adapter.
 */
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { login } from '../helpers/login'
import { cleanupTestUser, seedTestUser, testUser } from '../helpers/seedUser'

const seriousViolations = async (page: Page) => {
  const r = await new AxeBuilder({ page }).analyze()
  return r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)
}

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)

test.describe('Booking', () => {
  test.beforeEach(async ({ request }) => {
    const res = await request.get('/packages/goa-beach-escape/book')
    test.skip(res.status() === 404, 'Demo content not loaded (run npm run seed)')
  })

  test('books a package in four steps and shows the WhatsApp message', async ({ page }) => {
    // Many steps, and the first booking after a fresh start compiles the page and the action.
    test.setTimeout(120_000)
    await page.goto('/packages/goa-beach-escape/book?adults=2&children=1&hotel=deluxe4')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Trip details')
    await expect(page.getByLabel('Hotel category')).toHaveValue('deluxe4')
    await expect(page.locator('output[aria-label="Children"]')).toHaveText('1')
    expect(await seriousViolations(page)).toEqual([])

    // Step 1 needs a date.
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Please choose a travel date')).toBeVisible()
    await page.getByLabel('Travel date*').fill(inDays(40))
    await page.getByLabel('Departure city').fill('Ranchi')
    await page.getByRole('button', { name: 'Add adult' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 2, and Back keeps the answers.
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Traveller details')
    await expect(page).toHaveURL(/step=2/)
    await page.goBack()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Trip details')
    await expect(page.getByLabel('Departure city')).toHaveValue('Ranchi')
    await page.goForward()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Traveller details')

    await page.getByLabel('Full name*').fill('E2E Traveller')
    await page.getByLabel('WhatsApp number*').fill('123')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByLabel('WhatsApp number*')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByText('Please accept to continue')).toBeVisible()
    await page.getByLabel('WhatsApp number*').fill('98301 22457')
    await page.getByRole('checkbox', { name: /booking updates on WhatsApp/ }).check()
    expect(await seriousViolations(page)).toEqual([])
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 3: review, then send.
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Review your request')
    await expect(page.getByText('3 Adults, 1 Child').first()).toBeVisible()
    await page.getByRole('button', { name: 'Send Booking via WhatsApp' }).click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Booking request sent!')
    await expect(page.getByText(/GT-\d+/).first()).toBeVisible()
    const preview = page.getByRole('figure', { name: /WhatsApp message preview/ })
    await expect(preview).toContainText('New Booking Request')
    await expect(preview).toContainText('Travellers: 3 Adults, 1 Child')
    await expect(page.getByRole('link', { name: 'Open WhatsApp chat' })).toHaveAttribute(
      'href',
      /wa\.me\/.+GT-/,
    )
    expect(await seriousViolations(page)).toEqual([])
  })

  test('a shared later-step link starts at the first incomplete step', async ({ page }) => {
    await page.goto('/packages/goa-beach-escape/book?step=3')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Trip details')
  })
})

test.describe('Enquiry pop-up', () => {
  test('Plan My Trip links open the pop-up and send an enquiry', async ({ page }) => {
    await page.goto('/about')
    const cta = page.getByRole('link', { name: 'Find Your Perfect Trip' }).filter({ visible: true })
    test.skip(!(await cta.count()), 'Demo content not loaded (run npm run seed)')
    await cta.first().click()
    const dialog = page.getByRole('dialog', { name: 'Find Your Perfect Trip' })
    await expect(dialog).toBeVisible()
    await expect(page).toHaveURL(/\/about$/)
    expect(await seriousViolations(page)).toEqual([])

    await dialog.getByLabel('Your name*').fill('E2E Pop-up')
    await dialog.getByLabel('WhatsApp number*').fill('9123456781')
    await dialog.getByRole('button', { name: 'Send Enquiry' }).click()
    await expect(dialog.getByRole('heading', { name: 'Enquiry sent!' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })
})

test.describe('WhatsApp admin', () => {
  test.beforeAll(async () => {
    await seedTestUser()
  })
  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('sends a test message and lists it in the delivery log', async ({ page }) => {
    await login({ page, user: testUser })
    await page.goto('/admin/globals/whatsappSettings')
    await page.getByText('4 · Test & delivery log').click()
    await page.getByRole('button', { name: 'Send test message' }).click()
    await expect(page.getByText(/Test message sent to/)).toBeVisible()
    await expect(page.getByRole('table').getByText('TEST').first()).toBeVisible()
  })
})
