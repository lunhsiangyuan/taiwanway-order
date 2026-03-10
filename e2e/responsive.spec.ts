import { test, expect } from '@playwright/test'

test.describe('響應式設計', () => {
  test('Desktop (1280px) — 正常排版', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    // 桌面版導航連結可見
    await expect(page.getByRole('navigation').getByRole('link', { name: /現點現拿|Order Now/ })).toBeVisible()
  })

  test('Mobile (375px) — 導航隱藏 + 卡片可見', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // 桌面導航隱藏
    await expect(page.getByRole('navigation').getByRole('link', { name: /現點現拿|Order Now/ })).not.toBeVisible()

    // 兩大入口卡片（heading level 2）仍然可見
    await expect(page.getByRole('heading', { name: /現點現拿|Order Now/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: /預購團購|Group Buy/ })).toBeVisible()
  })

  test('Mobile 菜單頁 — 單欄排版', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/order')

    // 品項卡片可見
    const heading = page.getByRole('heading', { level: 3 }).first()
    await expect(heading).toBeVisible()

    // 分類篩選可見
    await expect(page.getByRole('button', { name: /全部|All/ })).toBeVisible()
  })
})
