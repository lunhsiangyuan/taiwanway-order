'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { Language } from '../types'

const COOKIE_NAME = 'taiwanway-order-lang'

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : undefined
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`
}

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'zh'
  const cookie = getCookie(COOKIE_NAME)
  if (cookie === 'zh' || cookie === 'en') return cookie
  return 'zh'
}

// 翻譯資料（內嵌以減少檔案數量）
const translations: Record<Language, Record<string, unknown>> = {
  zh: {
    site: { title: '台灣味 線上訂餐', subtitle: '現點現拿 · 預購團購' },
    nav: { home: '首頁', order: '現點現拿', groupBuy: '預購團購', admin: '管理後台', backToMain: '回主站', cart: '購物車' },
    home: {
      welcome: '歡迎光臨台灣味',
      tagline: '道地台灣美食，直接線上訂購',
      orderNow: '現點現拿',
      orderDesc: '瀏覽菜單，線上點餐，到店取餐',
      groupBuy: '預購團購',
      groupBuyDesc: '揪團合購，達標出貨，省更多',
    },
    menu: {
      title: '菜單',
      allCategories: '全部',
      addToCart: '加入購物車',
      added: '已加入',
      soldOut: '售完',
      categories: {
        'main-dishes': '主食',
        'combo': '超值套餐',
        'taiwanese-black-tea': '台灣紅茶',
        'caffeine-free': '無咖啡因',
        'jasmine-green-tea': '茉莉綠茶',
        'oolong': '台灣烏龍茶',
        'matcha': '京都抹茶',
        'fruit-tea': '水果茶',
        'coffee': '咖啡',
        'pot-brewed': '現沖高山茶',
        'desserts': '自製甜點',
      },
    },
    cart: {
      title: '購物車',
      empty: '購物車是空的',
      subtotal: '小計',
      tax: '稅金 (8.125%)',
      total: '合計',
      checkout: '送出訂單',
      remove: '移除',
      clear: '清空',
    },
    order: {
      title: '確認訂單',
      name: '姓名',
      phone: '電話',
      pickupTime: '取餐時間',
      pickupTimeHint: '最早可取餐時間',
      pickupTimeTooEarly: '取餐時間必須在 {time} 之後（需 {minutes} 分鐘準備）',
      note: '備註（可選）',
      submit: '提交訂單',
      paymentTitle: '付款方式',
      paymentDesc: '到店付款：接受 Zelle、Venmo 或現金',
      namePlaceholder: '請輸入姓名',
      phonePlaceholder: '請輸入電話號碼',
      notePlaceholder: '如有特殊需求請備註',
      confirmWarning: '訂單送出後，需經店家致電確認方可成立。未接到確認電話前，訂單尚未生效。',
      paymentCash: '現金',
      closedToday: '今日公休，請於營業日（週一、二、五、六）再訂購',
      phoneValidation: '請輸入有效的電話號碼（至少10碼）',
    },
    success: {
      title: '訂單已送出！',
      orderNumber: '訂單編號',
      message: '我們已收到您的訂單。店家將致電確認訂單，確認後請於指定時間到店取餐。',
      confirmReminder: '請保持電話暢通，店家將盡快與您聯繫確認訂單。',
      pickupInfo: '取餐資訊',
      address: '地址：26 South St, Middletown, NY 10940',
      backToMenu: '繼續點餐',
      backToHome: '回首頁',
    },
    groupBuy: {
      title: '預購團購',
      subtitle: '揪團合購，達標出貨',
      noActive: '目前沒有進行中的團購活動',
      progress: '目前進度',
      target: '目標',
      deadline: '截止日期',
      daysLeft: '剩餘天數',
      join: '我要跟團',
      joined: '已跟團',
      reached: '已達標',
      closed: '已結束',
      quantity: '數量',
      joinForm: '填寫跟團資訊',
      unitPrice: '單價',
    },
    admin: {
      title: '管理後台',
      login: '登入',
      password: '密碼',
      loginBtn: '登入',
      logout: '登出',
      dashboard: '儀表板',
      orders: '訂單管理',
      campaigns: '團購管理',
      todayOrders: '今日訂單',
      activeCampaigns: '進行中團購',
      newCampaign: '新增團購',
      orderStatus: { pending: '待處理', confirmed: '已確認', ready: '可取餐', completed: '已完成', cancelled: '已取消' },
      updateStatus: '更新狀態',
      campaignTitle: '活動標題',
      campaignDesc: '活動說明',
      unitPrice: '單價',
      minQty: '最低數量',
      deadline: '截止日期',
      create: '建立',
    },
    common: {
      loading: '載入中...',
      error: '發生錯誤',
      close: '關閉',
      confirm: '確認',
      cancel: '取消',
      back: '返回',
      language: '語言',
    },
    footer: {
      contact: '聯絡我們',
      phone: '845-381-1002',
      address: '26 South St, Middletown, NY 10940',
      hours: '營業時間：週一、週二、週五、週六 11AM-7PM',
      backToMain: '← 回到台灣味主站',
    },
  },
  en: {
    site: { title: 'TaiwanWay Online Order', subtitle: 'Order Now · Group Buy' },
    nav: { home: 'Home', order: 'Order Now', groupBuy: 'Group Buy', admin: 'Admin', backToMain: 'Main Site', cart: 'Cart' },
    home: {
      welcome: 'Welcome to TaiwanWay',
      tagline: 'Authentic Taiwanese cuisine, order online',
      orderNow: 'Order Now',
      orderDesc: 'Browse menu, order online, pick up at store',
      groupBuy: 'Group Buy',
      groupBuyDesc: 'Group orders, bulk discounts, save more',
    },
    menu: {
      title: 'Menu',
      allCategories: 'All',
      addToCart: 'Add to Cart',
      added: 'Added',
      soldOut: 'Sold Out',
      categories: {
        'main-dishes': 'Main Dishes',
        'combo': 'Combo Deals',
        'taiwanese-black-tea': 'Taiwanese Black Tea',
        'caffeine-free': 'Caffeine Free',
        'jasmine-green-tea': 'Jasmine Green Tea',
        'oolong': 'Oolong Tea',
        'matcha': 'Matcha',
        'fruit-tea': 'Fruit Tea',
        'coffee': 'Coffee',
        'pot-brewed': 'Pot-Brewed Tea',
        'desserts': 'Desserts',
      },
    },
    cart: {
      title: 'Cart',
      empty: 'Your cart is empty',
      subtotal: 'Subtotal',
      tax: 'Tax (8.125%)',
      total: 'Total',
      checkout: 'Place Order',
      remove: 'Remove',
      clear: 'Clear',
    },
    order: {
      title: 'Confirm Order',
      name: 'Name',
      phone: 'Phone',
      pickupTime: 'Pickup Time',
      pickupTimeHint: 'Earliest pickup time',
      pickupTimeTooEarly: 'Pickup time must be after {time} ({minutes} min prep needed)',
      note: 'Note (optional)',
      submit: 'Submit Order',
      paymentTitle: 'Payment',
      paymentDesc: 'Pay at store: Zelle, Venmo, or Cash accepted',
      namePlaceholder: 'Enter your name',
      phonePlaceholder: 'Enter phone number',
      notePlaceholder: 'Special requests',
      confirmWarning: 'Your order must be confirmed by the store via phone call. It is not valid until you receive a confirmation call.',
      paymentCash: 'Cash',
      closedToday: 'Closed today. Please order on business days (Mon, Tue, Fri, Sat).',
      phoneValidation: 'Please enter a valid phone number (at least 10 digits)',
    },
    success: {
      title: 'Order Submitted!',
      orderNumber: 'Order #',
      message: 'We received your order. The store will call to confirm. Please pick up at the scheduled time after confirmation.',
      confirmReminder: 'Please keep your phone available. The store will contact you shortly to confirm your order.',
      pickupInfo: 'Pickup Info',
      address: '26 South St, Middletown, NY 10940',
      backToMenu: 'Continue Ordering',
      backToHome: 'Back to Home',
    },
    groupBuy: {
      title: 'Group Buy',
      subtitle: 'Group orders, bulk savings',
      noActive: 'No active campaigns',
      progress: 'Progress',
      target: 'Target',
      deadline: 'Deadline',
      daysLeft: 'days left',
      join: 'Join',
      joined: 'Joined',
      reached: 'Goal Reached',
      closed: 'Closed',
      quantity: 'Quantity',
      joinForm: 'Join Group Buy',
      unitPrice: 'Unit Price',
    },
    admin: {
      title: 'Admin Panel',
      login: 'Login',
      password: 'Password',
      loginBtn: 'Login',
      logout: 'Logout',
      dashboard: 'Dashboard',
      orders: 'Orders',
      campaigns: 'Campaigns',
      todayOrders: "Today's Orders",
      activeCampaigns: 'Active Campaigns',
      newCampaign: 'New Campaign',
      orderStatus: { pending: 'Pending', confirmed: 'Confirmed', ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled' },
      updateStatus: 'Update Status',
      campaignTitle: 'Title',
      campaignDesc: 'Description',
      unitPrice: 'Unit Price',
      minQty: 'Min Quantity',
      deadline: 'Deadline',
      create: 'Create',
    },
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      close: 'Close',
      confirm: 'Confirm',
      cancel: 'Cancel',
      back: 'Back',
      language: 'Language',
    },
    footer: {
      contact: 'Contact Us',
      phone: '845-381-1002',
      address: '26 South St, Middletown, NY 10940',
      hours: 'Hours: Mon, Tue, Fri, Sat 11AM-7PM',
      backToMain: '← Back to TaiwanWay',
    },
  },
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setLanguageState(getInitialLanguage())
    setMounted(true)
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    setCookie(COOKIE_NAME, lang, 365)
    document.documentElement.lang = lang
  }, [])

  useEffect(() => {
    if (mounted) document.documentElement.lang = language
  }, [language, mounted])

  const t = useCallback((key: string): string => {
    const keys = key.split('.')
    let value: unknown = translations[language]
    for (const k of keys) {
      if (value == null || typeof value !== 'object') return key
      value = (value as Record<string, unknown>)[k]
    }
    return typeof value === 'string' ? value : key
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider')
  return context
}
