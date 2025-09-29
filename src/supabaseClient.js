// Import ng function na gagamitin para gumawa ng Supabase client (connection)
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://lyvbenehijrkrmvmtboi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dmJlbmVoaWpya3Jtdm10Ym9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njg4NTEyOCwiZXhwIjoyMDcyNDYxMTI4fQ.5_m2J63Ty-Dw2BSNhyZRREkBDrZGozo0O1yyvBQ2tyU' // Service role key, not anon key
// Ito ang gagamitin para makipag-usap (CRUD: Create, Read, Update, Delete) sa database.
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false, // Hindi automatic magre-refresh ng session/token
    persistSession: false   // Hindi isi-save ang session sa browser/local storage
  }
})