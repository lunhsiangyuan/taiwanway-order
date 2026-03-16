// app/api/admin/sync-catalog/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/admin-auth'
import { syncCatalogFromSquare } from '@/lib/square/catalog'

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get('tw-admin-token')?.value
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.SQUARE_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'Square not configured' }, { status: 400 })
  }

  try {
    const result = await syncCatalogFromSquare()
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Catalog sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
