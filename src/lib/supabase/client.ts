import { createBrowserClient } from '@supabase/ssr'

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zkecpdasxewikpldecqm.supabase.co'
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprZWNwZGFzeGV3aWtwbGRlY3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNzMzNDMsImV4cCI6MjEwNzk0OTM0M30.JO4s75WYeeLMb2MCL2JYUQfY4He3nVEUrfpT4F9hUdg'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
