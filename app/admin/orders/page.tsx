'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/language-context'
import type { Order } from '@/lib/types'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

const STATUS_FLOW = ['pending', 'confirmed', 'ready', 'completed']

export default function AdminOrdersPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/admin/auth')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(() => loadOrders())
      .catch(() => router.push('/admin/login'))
  }, [router])

  const loadOrders = async () => {
    const res = await fetch('/api/admin/orders')
    const data = await res.json()
    setOrders(data.orders || [])
    setLoading(false)
  }

  const updateStatus = async (orderId: string, status: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    loadOrders()
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  if (loading) return <div className="py-12 text-center">{t('common.loading')}</div>

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 font-heading text-3xl font-bold">{t('admin.orders')}</h1>

      {/* 篩選 */}
      <div className="mb-4 flex flex-wrap gap-2">
        {['all', 'pending', 'confirmed', 'ready', 'completed', 'cancelled'].map(s => (
          <Button key={s} variant={filter === s ? 'default' : 'outline'} size="sm" onClick={() => setFilter(s)}>
            {s === 'all' ? 'All' : t(`admin.orderStatus.${s}`)}
          </Button>
        ))}
      </div>

      {/* 訂單列表 */}
      <div className="space-y-3">
        {filtered.map(order => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-mono text-sm text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="font-semibold">{order.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                </div>
                <div className="text-right">
                  <Badge className={STATUS_COLORS[order.status]}>
                    {t(`admin.orderStatus.${order.status}`)}
                  </Badge>
                  <p className="mt-1 font-bold text-primary">${order.total_amount.toFixed(2)}</p>
                </div>
              </div>

              {/* 品項 */}
              <div className="mb-3 text-sm text-muted-foreground">
                {order.items.map((item, i) => (
                  <span key={i}>{item.product_name} x{item.quantity}{i < order.items.length - 1 ? ', ' : ''}</span>
                ))}
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                Pickup: {order.pickup_time} | {new Date(order.created_at).toLocaleString()}
              </p>

              {/* 狀態更新按鈕 */}
              {order.status !== 'completed' && order.status !== 'cancelled' && (
                <div className="flex gap-2">
                  {STATUS_FLOW.filter(s => STATUS_FLOW.indexOf(s) > STATUS_FLOW.indexOf(order.status)).slice(0, 1).map(nextStatus => (
                    <Button key={nextStatus} size="sm" onClick={() => updateStatus(order.id, nextStatus)}>
                      → {t(`admin.orderStatus.${nextStatus}`)}
                    </Button>
                  ))}
                  <Button size="sm" variant="destructive" onClick={() => updateStatus(order.id, 'cancelled')}>
                    {t(`admin.orderStatus.cancelled`)}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">No orders</p>
        )}
      </div>
    </div>
  )
}
