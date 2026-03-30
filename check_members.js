const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function main() {
  // Login as the user (wait, I don't know the user's password, but I can use the SERVICE ROLE key to check rows and policies... actually, I can just use service role to see the exact rows, but that bypasses RLS).
  // I need to use the master's JWT or RLS bypassing to see if data exists.
  
  // Let's print the actual rows with service role to see if data is really there.
  const adminSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  
  // Get all campaigns
  const { data: campaigns } = await adminSupabase.from('campaigns').select('*')
  console.log('Campaigns:', campaigns.map(c => c.id))
  
  if (campaigns.length > 0) {
    const { data: members } = await adminSupabase.from('campaign_members').select('*, profiles(*)').eq('campaign_id', campaigns[0].id)
    console.log('Members for campaign', campaigns[0].id, ':', JSON.stringify(members, null, 2))
  }
}

main()
