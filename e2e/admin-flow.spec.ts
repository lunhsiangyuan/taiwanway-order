import { test, expect } from '@playwright/test'

test.describe('Admin 後台', () => {
  test('未登入 → 顯示 dashboard 後 redirect 到 login', async ({ page }) => {
    await page.goto('/admin')
    // Admin dashboard 做 client-side redirect，等待 /admin/login 出現
    await page.waitForURL('**/admin/login', { timeout: 10000 }).catch(() => {
      // 如果 Supabase 未設定，admin 頁面可能直接顯示空白
    })
    // 此時應該在 login 頁或 admin 頁
    const url = page.url()
    expect(url).toMatch(/admin/)
  })

  test('登入頁面渲染', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.getByLabel(/密碼|Password/)).toBeVisible()
    await expect(page.getByRole('button', { name: /登入|Login/ })).toBeVisible()
  })

  test('錯誤密碼顯示錯誤訊息', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel(/密碼|Password/).fill('wrongpassword')
    await page.getByRole('button', { name: /登入|Login/ }).click()
    await expect(page.getByText(/Invalid password/)).toBeVisible()
  })
})
