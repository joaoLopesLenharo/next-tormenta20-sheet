import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * API Route segura para buscar membros de uma campanha usando Service Role Key.
 * Apenas o mestre da campanha pode acessar.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get('campaignId')

  if (!campaignId) {
    return NextResponse.json(
      { error: 'campaignId is required' },
      { status: 400 }
    )
  }

  // Verificar autenticação
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verificar se o usuário é mestre da campanha
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('master_id', user.id)
    .single()

  if (!campaign) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Usar Service Role Key para buscar membros (bypassa RLS)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  )

  const { data: members, error } = await admin
    .from('campaign_members')
    .select('*, profiles(*)')
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }

  return NextResponse.json({ members: members || [] })
}
