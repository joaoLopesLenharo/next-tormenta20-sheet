import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { CharacterDataSchema } from '@/lib/schemas/character'

// UUID v4 regex para validar campaignId e evitar injection ou parâmetros maliciosos
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

  // Validar formato UUID para prevenir parâmetros maliciosos
  if (!UUID_REGEX.test(campaignId)) {
    return NextResponse.json(
      { error: 'Invalid campaignId format' },
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
    // Retornar 403 sem vazar informação sobre a existência da campanha
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Usar Service Role Key para buscar membros (bypassa RLS)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey)

  const { data: members, error } = await admin
    .from('campaign_members')
    .select('*, profiles(*)')
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('[campaign-members] Error fetching members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }

  // Remover dados sensíveis dos profiles e validar character_data
  const sanitizedMembers = (members || []).map((m: any) => {
    // Validar e sanitizar character_data se presente
    let validatedCharacterData = null
    if (m.character_data) {
      try {
        validatedCharacterData = CharacterDataSchema.parse(m.character_data)
      } catch (error) {
        console.warn(
          `[campaign-members] Invalid character_data for member ${m.id}, skipping validation`,
          error
        )
        // Se falhar validação, define como null para segurança
        validatedCharacterData = null
      }
    }

    return {
      ...m,
      // Substitui character_data validado
      character_data: validatedCharacterData,
      // Sanitiza profiles
      profiles: m.profiles
        ? {
            id: m.profiles.id,
            display_name: m.profiles.display_name,
            avatar_url: m.profiles.avatar_url,
            role: m.profiles.role,
          }
        : null,
    }
  })

  return NextResponse.json({ members: sanitizedMembers })
}
