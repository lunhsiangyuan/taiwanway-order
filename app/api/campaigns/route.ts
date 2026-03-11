import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*, campaign_entries(quantity)')
      .in('status', ['active', 'reached'])
      .order('created_at', { ascending: false })

    if (error) throw error

    // 計算 current_quantity
    const result = (campaigns || []).map(c => ({
      ...c,
      current_quantity: (c.campaign_entries || [])
        .filter((e: { status?: string }) => e.status !== 'cancelled')
        .reduce((sum: number, e: { quantity: number }) => sum + e.quantity, 0),
      campaign_entries: undefined,
    }))

    return NextResponse.json({ campaigns: result })
  } catch (err) {
    console.error('Campaigns fetch error:', err)
    return NextResponse.json({ campaigns: [] })
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const body = await request.json()
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        title: body.title,
        description: body.description,
        image: body.image || null,
        unit_price: body.unit_price,
        min_quantity: body.min_quantity,
        max_quantity: body.max_quantity || null,
        deadline: body.deadline,
        status: 'active',
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error('Campaign create error:', err)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
