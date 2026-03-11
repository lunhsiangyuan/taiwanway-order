import { test, expect } from '@playwright/test'

test.describe('現點現拿完整流程', () => {
  test('菜單 grid 渲染', async ({ page }) => {
    await page.goto('/order')
    // 確認菜單標題
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // 確認分類按鈕
    await expect(page.getByRole('button', { name: /全部|All/ })).toBeVisible()
    // 確認至少有品項卡片
    const cards = page.getByRole('heading', { level: 3 })
    await expect(cards.first()).toBeVisible()
    expect(await cards.count()).toBeGreaterThanOrEqual(20)
  })

  test('加入購物車 → badge 更新', async ({ page }) => {
    await page.goto('/order')
    // 點擊第一個「加入購物車」
    const addBtn = page.getByRole('button', { name: /加入購物車|Add to Cart/ }).first()
    await addBtn.click()
    // 確認按鈕變為「已加入」
    await expect(page.getByRole('button', { name: /已加入|Added/ }).first()).toBeVisible()
    // 確認 badge 顯示 1
    await expect(page.getByText('1', { exact: true })).toBeVisible()
  })

  test('購物車 drawer 操作', async ({ page }) => {
    await page.goto('/order')
    // 加入兩個品項
    const addBtns = page.getByRole('button', { name: /加入購物車|Add to Cart/ })
    await addBtns.nth(0).click()
    await page.waitForTimeout(1500)
    await addBtns.nth(1).click()
    await page.waitForTimeout(500)

    // 開啟購物車（點擊 badge 區域）
    await page.getByText('2', { exact: true }).click()

    // 確認 drawer 開啟
    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()
    // 確認有合計金額
    await expect(drawer.getByText(/合計|Total/)).toBeVisible()
    // 確認有送出訂單按鈕
    await expect(drawer.getByRole('button', { name: /送出訂單|Place Order/ })).toBeVisible()
  })

  test('分類篩選正確過濾', async ({ page }) => {
    await page.goto('/order')
    const allCards = page.getByRole('heading', { level: 3 })
    const allCount = await allCards.count()

    // 點擊「主食」分類
    await page.getByRole('button', { name: /主食|Main Dishes/ }).click()
    const filteredCount = await allCards.count()
    expect(filteredCount).toBeLessThan(allCount)
    expect(filteredCount).toBe(4) // 滷肉飯 + 嘉義雞肉飯 + 牛肉麵 + 櫻花蝦油飯

    // 點擊「全部」恢復
    await page.getByRole('button', { name: /全部|All/ }).click()
    expect(await allCards.count()).toBe(allCount)
  })

  test('訂單確認頁 — 空購物車提示', async ({ page }) => {
    // 清除 localStorage
    await page.goto('/order/confirm')
    await expect(page.getByText(/購物車是空的|Your cart is empty/)).toBeVisible()
  })
})
