import { createClient } from '@supabase/supabase-js'
import type { Database } from '@ephraimcare/types'

// ONLY for server-side admin operations (seeding, edge functions)
// NEVER expose in browser code — bypasses RLS
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
