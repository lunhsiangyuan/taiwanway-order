import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params
    const body = await request.json()
    const { customer_name, customer_phone, quantity, note } = body

    if (!customer_name || !customer_phone || !quantity || quantity < 1) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServerClient()

    // 確認活動存在且開放
    const { data: campaign, error: cErr } = await supabase
      .from('campaigns')
      .select('status, max_quantity')
      .eq('id', campaignId)
      .single()

    if (cErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    if (campaign.status !== 'active' && campaign.status !== 'reached') {
      return NextResponse.json({ error: 'Campaign is closed' }, { status: 400 })
    }

    // 插入報名（使用 Supabase 的原子操作）
    const { data, error } = await supabase
      .from('campaign_entries')
      .insert({
        campaign_id: campaignId,
        customer_name,
        customer_phone,
        quantity,
        note: note || null,
        status: 'joined',
      })
      .select('id')
      .single()

    if (error) throw error

    // 檢查是否達標，更新 campaign 狀態
    const { data: entries } = await supabase
      .from('campaign_entries')
      .select('quantity')
      .eq('campaign_id', campaignId)
      .neq('status', 'cancelled')

    const totalQty = (entries || []).reduce((sum, e) => sum + e.quantity, 0)

    const { data: campaignData } = await supabase
      .from('campaigns')
      .select('min_quantity, status')
      .eq('id', campaignId)
      .single()

    if (campaignData && totalQty >= campaignData.min_quantity && campaignData.status === 'active') {
      await supabase
        .from('campaigns')
        .update({ status: 'reached' })
        .eq('id', campaignId)
    }

    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error('Campaign join error:', err)
    return NextResponse.json({ error: 'Failed to join campaign' }, { status: 500 })
  }
}
