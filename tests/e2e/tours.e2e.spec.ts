/**
 * Tour listing, destination and package pages. Needs the demo content (`npm run seed`).
 * In CI's empty database these pages have nothing to show, so the tests skip themselves.
 */
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const seriousViolations = async (page: Page) => {
  const r = await new AxeBuilder({ page }).analyze()
  return r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.help}`)
}

test.describe('Tours', () => {
  test.beforeEach(async ({ request }) => {
    const res = await request.get('/packages/goa-beach-escape')
    test.skip(res.status() === 404, 'Demo content not loaded (run npm run seed)')
  })

  test('listing filters by duration and keeps the filter in the URL', async ({ page }) => {
    await page.goto('/tours/international?duration=4-6')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('International Tour Packages')
    await expect(page.getByText(/\d+ packages? · 4–6 nights/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Remove filter 4–6 N' })).toBeVisible()
    expect(await seriousViolations(page)).toEqual([])
  })

  test('empty results offer a custom trip', async ({ page }) => {
    await page.goto('/tours/international?theme=pilgrimage')
    await expect(page.getByRole('link', { name: 'Request a custom trip' })).toBeVisible()
  })

  test('package page updates the estimate and carries choices to booking', async ({ page }) => {
    await page.goto('/packages/goa-beach-escape')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Goa Beach Escape')
    expect(await seriousViolations(page)).toEqual([])

    await page.locator('label.gt-hotel', { hasText: 'Luxury 5★' }).click()
    const book = page.getByRole('link', { name: /Book (This Tour|Now)/ }).first()
    await expect(book).toHaveAttribute('href', /hotel=luxury5/)
  })

  test('destination page shows its packages', async ({ page }) => {
    await page.goto('/destinations/goa')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Goa Tour Packages')
    await expect(page.getByRole('heading', { name: 'Goa packages' })).toBeVisible()
    expect(await seriousViolations(page)).toEqual([])
  })

  test('unpublished packages and unknown pages are 404', async ({ request }) => {
    expect((await request.get('/packages/singapore-family-fun')).status()).toBe(404)
    expect((await request.get('/tours/not-a-category')).status()).toBe(404)
  })
})
