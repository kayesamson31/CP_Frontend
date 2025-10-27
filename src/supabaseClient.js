// Import ng function na gagamitin para gumawa ng Supabase client (connection)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lyvbenehijrkrmvmtboi.supabase.co'

// ✅ USE ANON KEY (public key), NOT service role key
// You need to get this from Supabase Dashboard > Settings > API
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dmJlbmVoaWpya3Jtdm10Ym9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4ODUxMjgsImV4cCI6MjA3MjQ2MTEyOH0.F7ERvQN_xQG4mokQMQMvjMFXWfN_c-fhzMOj8-4Q7qQ' // ⚠️ Replace with actual anon key

// ✅ Create client with proper session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,      // ✅ ENABLE session persistence
    autoRefreshToken: true,    // ✅ ENABLE auto token refresh
    detectSessionInUrl: true,  // ✅ Detect session from URL
    storage: window.localStorage, // ✅ Use localStorage
  }
})