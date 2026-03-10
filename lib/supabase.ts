import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// 瀏覽器端 client（使用 anon key）
export function createBrowserClient() {
  if (!SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

// 伺服器端 client（使用 service role key）
export function createServerClient() {
  if (!SUPABASE_URL) throw new Error('supabaseUrl is required')
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}
