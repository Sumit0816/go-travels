import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('Website foundation', () => {
  test('home page shows the brand hero', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Go Travels/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Discover. Dream. Travel.')
    await expect(page.getByRole('link', { name: 'Plan My Trip' })).toBeVisible()
  })

  test('home page has no serious accessibility violations', async ({ page }) => {
    await page.goto('/')
    const results = await new AxeBuilder({ page }).analyze()
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })

  test('component library renders every section', async ({ page }) => {
    await page.goto('/dev/ui')
    for (const name of [
      'Colour',
      'Buttons',
      'Form fields',
      'Package cards',
      'Booking stepper',
      'WhatsApp message',
    ]) {
      await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible()
    }
  })
})
