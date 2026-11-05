import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Phones get the sticky Quick actions bar; below 1366px the menu lives in the drawer.
const isMobile = (width: number | undefined) => (width ?? 1280) < 768
const usesDrawer = (width: number | undefined) => (width ?? 1280) < 1366

test.describe('Homepage', () => {
  test('shows the hero, search and enquiry actions', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Go Travels/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('search', { name: 'Search tours' })).toBeVisible()
    const width = page.viewportSize()?.width
    if (isMobile(width)) {
      await expect(
        page
          .getByRole('navigation', { name: 'Quick actions' })
          .getByRole('link', { name: 'Enquire' }),
      ).toBeVisible()
    } else {
      await expect(page.getByRole('link', { name: 'Plan My Trip' })).toBeVisible()
    }
  })

  test('has no serious accessibility violations', async ({ page }) => {
    await page.goto('/')
    const results = await new AxeBuilder({ page }).analyze()
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })

  test('opens the menu that fits the screen', async ({ page }) => {
    await page.goto('/')
    if (usesDrawer(page.viewportSize()?.width)) {
      await page.getByRole('button', { name: 'Open menu' }).click()
      const drawer = page.getByRole('dialog', { name: 'Menu' })
      await expect(drawer).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(drawer).toBeHidden()
    } else {
      const trigger = page.getByRole('navigation', { name: 'Main' }).getByRole('button').first()
      await trigger.click()
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      await page.keyboard.press('Escape')
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    }
  })
})

test.describe('Component library', () => {
  test('renders every section', async ({ page }) => {
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
