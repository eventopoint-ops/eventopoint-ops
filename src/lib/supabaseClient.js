import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  // Fail loudly instead of silently — this project's history is full of
  // bugs that were invisible because errors were swallowed. Don't repeat that.
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env and fill in real values.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
