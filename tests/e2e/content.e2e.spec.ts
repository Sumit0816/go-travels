/**
 * Content pages, enquiry forms, blog, 404 and SEO files. Needs the demo content (`npm run seed`);
 * without it the content tests skip themselves.
 */
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const seriousViolations = async (page: Page) => {
  const r = await new AxeBuilder({ page }).analyze()
  return r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.help}`)
}

test.describe('Content', () => {
  test.beforeEach(async ({ request }) => {
    const res = await request.get('/about')
    test.skip(res.status() === 404, 'Demo content not loaded (run npm run seed)')
  })

  test('About page renders its blocks', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/journeys the way/)
    await expect(page.getByRole('link', { name: 'Explore Tours' })).toHaveAttribute(
      'href',
      '/tours',
    )
    await expect(page.getByRole('heading', { name: 'Meet the team' })).toBeVisible()
    expect(await seriousViolations(page)).toEqual([])
  })

  test('policies share one tabbed layout', async ({ page }) => {
    await page.goto('/terms')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Terms & Conditions')
    await expect(page.getByText(/Last updated/)).toBeVisible()
    const tabs = page.getByRole('navigation', { name: 'Policies' })
    await expect(tabs.getByRole('link', { name: 'Terms & Conditions' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await tabs.getByRole('link', { name: 'Booking & Cancellation' }).click()
    await expect(page).toHaveURL(/\/booking-policy$/)
    expect(await seriousViolations(page)).toEqual([])
  })

  test('contact form shows errors, then sends', async ({ page }) => {
    await page.goto('/contact')
    expect(await seriousViolations(page)).toEqual([])
    const form = page.locator('form', { has: page.getByRole('button', { name: 'Send Message' }) })
    await form.getByLabel('Full name*').fill('E2E Contact')
    await form.getByLabel('WhatsApp number*').fill('12345')
    await form.getByRole('button', { name: 'Send Message' }).click()
    await expect(form.getByLabel('WhatsApp number*')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByText('Please tell us how we can help')).toBeVisible()

    await form.getByLabel('WhatsApp number*').fill('9876543210')
    await form.getByLabel('Message*').fill('Testing the contact form.')
    await form.getByRole('button', { name: 'Send Message' }).click()
    await expect(page.getByRole('heading', { name: 'Enquiry sent!' })).toBeVisible()
    await expect(page.getByText(/EQ-\d+/)).toBeVisible()
  })

  test('Plan My Trip is prefilled from the link and sends an enquiry', async ({ page }) => {
    await page.goto('/plan-my-trip?destination=Kerala&type=honeymoon')
    await expect(page.getByLabel('Destination')).toHaveValue('Kerala')
    await expect(page.getByRole('radio', { name: 'Honeymoon' })).toBeChecked()
    expect(await seriousViolations(page)).toEqual([])

    await page.getByLabel('Your name*').fill('E2E Planner')
    await page.getByLabel('WhatsApp number*').fill('9123456780')
    await page.getByRole('button', { name: 'Send Enquiry' }).click()
    await expect(page.getByRole('heading', { name: 'Enquiry sent!' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Open WhatsApp' })).toHaveAttribute(
      'href',
      /wa\.me\/.+EQ-/,
    )
    await page.getByRole('button', { name: 'Send another enquiry' }).click()
    await expect(page.getByLabel('Your name*')).toHaveValue('')
  })

  test('blog lists posts, filters by category and opens an article', async ({ page }) => {
    await page.goto('/blog')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Guides, tips/)
    await expect(page.getByText(/^Featured/)).toBeVisible()
    expect(await seriousViolations(page)).toEqual([])

    const nav = page.getByRole('navigation', { name: 'Blog categories' })
    await nav.getByRole('link').nth(1).click()
    await expect(page).toHaveURL(/category=/)
    await expect(nav.getByRole('link', { name: 'All' })).not.toHaveAttribute('aria-current')

    await page.goto('/blog/waterfalls-of-jharkhand')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Waterfalls of Jharkhand')
    const toc = page.getByRole('navigation', { name: 'On this page' })
    await toc.getByRole('link').first().click()
    await expect(page).toHaveURL(/#day-1/)
    await expect(page.getByRole('heading', { name: 'Keep reading' })).toBeVisible()
    expect(await seriousViolations(page)).toEqual([])
  })
})

test('unknown pages show the 404 screen', async ({ page }) => {
  const res = await page.goto('/this-road-leads-nowhere')
  expect(res?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Looks like this road leads nowhere',
  )
  await expect(page.getByRole('link', { name: 'Browse tours' })).toBeVisible()
})

test('robots.txt and sitemap.xml are served', async ({ request }) => {
  const robots = await request.get('/robots.txt')
  expect(await robots.text()).toMatch(/Disallow: \/admin/)
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.ok()).toBe(true)
  expect(await sitemap.text()).toContain('<urlset')
})
