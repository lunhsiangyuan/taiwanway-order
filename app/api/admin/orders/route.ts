import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ orders: orders || [] })
  } catch (err) {
    console.error('Admin orders fetch error:', err)
    return NextResponse.json({ orders: [] })
  }
}
