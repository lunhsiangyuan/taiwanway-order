import { test, expect } from '@playwright/test'

test.describe('多語言切換', () => {
  test('預設中文 → 切換英文 → 切回中文', async ({ page }) => {
    await page.goto('/')

    // 預設中文
    await expect(page.getByText('歡迎光臨台灣味')).toBeVisible()
    await expect(page.getByRole('heading', { name: '現點現拿' })).toBeVisible()

    // 切換英文
    await page.getByRole('button', { name: 'EN', exact: true }).click()
    await expect(page.getByText('Welcome to TaiwanWay')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Order Now' })).toBeVisible()

    // 切回中文
    await page.getByRole('button', { name: '中', exact: true }).click()
    await expect(page.getByText('歡迎光臨台灣味')).toBeVisible()
  })

  test('菜單頁語言切換', async ({ page }) => {
    await page.goto('/order')

    // 中文分類
    await expect(page.getByRole('button', { name: '主食' })).toBeVisible()
    await expect(page.getByRole('button', { name: '台灣紅茶' })).toBeVisible()

    // 切換英文
    await page.getByRole('button', { name: 'EN', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Main Dishes' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Taiwanese Black Tea' })).toBeVisible()
  })

  test('語言設定持久化（Cookie）', async ({ page }) => {
    await page.goto('/')
    // 切換英文
    await page.getByRole('button', { name: 'EN', exact: true }).click()
    await expect(page.getByText('Welcome to TaiwanWay')).toBeVisible()

    // 重新整理
    await page.reload()
    // 應該保持英文
    await expect(page.getByText('Welcome to TaiwanWay')).toBeVisible()
  })
})
