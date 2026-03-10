import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*, campaign_entries(quantity, status)')
      .eq('id', id)
      .single()

    if (error) throw error

    const current_quantity = (campaign.campaign_entries || [])
      .filter((e: { status: string }) => e.status !== 'cancelled')
      .reduce((sum: number, e: { quantity: number }) => sum + e.quantity, 0)

    return NextResponse.json({
      campaign: { ...campaign, current_quantity, campaign_entries: undefined },
    })
  } catch (err) {
    console.error('Campaign fetch error:', err)
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = createServerClient()

    const { error } = await supabase
      .from('campaigns')
      .update(body)
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Campaign update error:', err)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}
