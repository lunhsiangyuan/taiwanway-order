import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const { status } = await request.json()

    const validStatuses = ['pending', 'confirmed', 'ready', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Order update error:', err)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
