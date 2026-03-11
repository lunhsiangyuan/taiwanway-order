import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const supabase = createServerClient()
    const today = new Date().toISOString().split('T')[0]

    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)

    if (error) throw error

    return NextResponse.json({ count: count || 0 })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
