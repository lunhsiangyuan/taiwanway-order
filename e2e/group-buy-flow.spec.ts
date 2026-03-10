import { test, expect } from '@playwright/test'

test.describe('團購流程', () => {
  test('團購列表頁渲染', async ({ page }) => {
    await page.goto('/group-buy')
    // 確認標題
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // 可能沒有活動（Supabase 未連線時）
    const noActive = page.getByText(/目前沒有|No active/)
    const hasCards = page.locator('[data-slot="card"]')
    // 其中之一應該可見
    await expect(noActive.or(hasCards.first())).toBeVisible()
  })
})
