'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/language-context'
import { ClipboardList, ShoppingBag, LogOut } from 'lucide-react'

export default function AdminDashboard() {
  const { t } = useLanguage()
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)
  const [stats, setStats] = useState({ todayOrders: 0, activeCampaigns: 0 })

  useEffect(() => {
    fetch('/api/admin/auth')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(() => {
        setAuthenticated(true)
        // 載入統計數據
        Promise.all([
          fetch('/api/admin/orders-stats').then(r => r.json()).catch(() => ({ count: 0 })),
          fetch('/api/campaigns').then(r => r.json()).catch(() => ({ campaigns: [] })),
        ]).then(([ordersData, campaignsData]) => {
          setStats({
            todayOrders: ordersData.count || 0,
            activeCampaigns: (campaignsData.campaigns || []).length,
          })
        })
      })
      .catch(() => router.push('/admin/login'))
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  if (!authenticated) return null

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">{t('admin.dashboard')}</h1>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-1 h-4 w-4" />{t('admin.logout')}
        </Button>
      </div>

      {/* 統計卡片 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.todayOrders')}</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.activeCampaigns')}</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeCampaigns}</div>
          </CardContent>
        </Card>
      </div>

      {/* 快速連結 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Button variant="outline" className="h-auto py-6" render={<Link href="/admin/orders" />}>
          <span className="flex flex-col items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            {t('admin.orders')}
          </span>
        </Button>
        <Button variant="outline" className="h-auto py-6" render={<Link href="/admin/campaigns" />}>
          <span className="flex flex-col items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            {t('admin.campaigns')}
          </span>
        </Button>
        <Button variant="outline" className="h-auto py-6" render={<Link href="/admin/campaigns/new" />}>
          <span className="flex flex-col items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            {t('admin.newCampaign')}
          </span>
        </Button>
      </div>
    </div>
  )
}
