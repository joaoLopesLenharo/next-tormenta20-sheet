import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { MasterPanel } from '@/components/campaigns/master-panel'

interface MasterPageProps {
  params: Promise<{ id: string }>
}

export default async function MasterPage({ params }: MasterPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Buscar campanha e verificar se eh o mestre
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('master_id', user.id)
    .single()

  if (error || !campaign) {
    notFound()
  }

  // Buscar sessao ativa
  const { data: activeSession } = await supabase
    .from('sessions')
    .select('*')
    .eq('campaign_id', id)
    .eq('is_active', true)
    .single()

  // Buscar membros da campanha diretamente no servidor com a chave de serviço,
  // evitando chamadas HTTP internas que dependem de variáveis de ambiente de URL.
  // NOTA: Não existe FK entre campaign_members e profiles, então buscamos separadamente.
  let members: any[] = []
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceRoleKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { createClient: createAdminClient } = await import('@supabase/supabase-js')
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKey
      )
      // Buscar membros sem join (FK não existe entre campaign_members e profiles)
      const { data: membersData, error: membersError } = await admin
        .from('campaign_members')
        .select('*')
        .eq('campaign_id', id)

      if (!membersError && membersData && membersData.length > 0) {
        // Buscar profiles separadamente pelos user_ids
        const userIds = membersData.map((m: any) => m.user_id)
        const { data: profilesData } = await admin
          .from('profiles')
          .select('*')
          .in('id', userIds)

        const profilesMap = new Map(
          (profilesData || []).map((p: any) => [p.id, p])
        )

        // Mesclar membros com seus profiles
        members = membersData.map((m: any) => ({
          ...m,
          profiles: profilesMap.get(m.user_id) || null,
        }))
      } else if (membersError) {
        console.error('[mestre/page] Error fetching members via admin:', membersError)
      }
    } catch (err) {
      console.error('[mestre/page] Error creating admin client:', err)
    }
  } else {
    // Fallback: buscar via RLS separadamente
    try {
      const { data: membersData } = await supabase
        .from('campaign_members')
        .select('*')
        .eq('campaign_id', id)

      if (membersData && membersData.length > 0) {
        const userIds = membersData.map((m: any) => m.user_id)
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds)

        const profilesMap = new Map(
          (profilesData || []).map((p: any) => [p.id, p])
        )

        members = membersData.map((m: any) => ({
          ...m,
          profiles: profilesMap.get(m.user_id) || null,
        }))
      }
    } catch (err) {
      console.error('[mestre/page] Fallback members fetch error:', err)
    }
  }

  // Buscar rolagens recentes se houver sessao ativa
  let recentRolls: unknown[] = []
  let initiativeEntries: unknown[] = []
  if (activeSession) {
    const { data: rolls } = await supabase
      .from('dice_rolls')
      .select('*')
      .eq('session_id', activeSession.id)
      .order('created_at', { ascending: false })
      .limit(100)
    
    // Buscar profiles dos jogadores que fizeram rolagens
    if (rolls && rolls.length > 0) {
      const rollUserIds = [...new Set(rolls.map((r: any) => r.user_id))]
      const { data: rollProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', rollUserIds)

      const rollProfilesMap = new Map(
        (rollProfiles || []).map((p: any) => [p.id, p])
      )

      recentRolls = rolls.map((r: any) => ({
        ...r,
        profiles: rollProfilesMap.get(r.user_id) || null,
      }))
    }

    // Buscar entradas de iniciativa
    const { data: initiative } = await supabase
      .from('initiative_entries')
      .select('*')
      .eq('session_id', activeSession.id)
      .order('sort_order', { ascending: true })

    initiativeEntries = initiative || []
  }

  return (
    <MasterPanel
      campaign={campaign}
      activeSession={activeSession}
      members={members || []}
      initialRolls={recentRolls}
      initialInitiative={initiativeEntries as any}
      userId={user.id}
    />
  )
}
