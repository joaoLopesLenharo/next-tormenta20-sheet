import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PlayerPanel } from '@/components/campaigns/player-panel'

interface PlayerPageProps {
  params: Promise<{ id: string }>
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Verificar se eh membro da campanha
  const { data: membership, error: memberError } = await supabase
    .from('campaign_members')
    .select('*, campaigns(*)')
    .eq('campaign_id', id)
    .eq('user_id', user.id)
    .single()

  // Se nao eh membro, verificar se eh o mestre
  if (memberError || !membership) {
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('master_id', user.id)
      .single()

    if (campaign) {
      // Eh o mestre, redirecionar para o painel do mestre
      redirect(`/campanhas/${id}/mestre`)
    }

    notFound()
  }

  // Buscar sessao ativa
  const { data: activeSession } = await supabase
    .from('sessions')
    .select('*')
    .eq('campaign_id', id)
    .eq('is_active', true)
    .single()

  // Buscar membros da campanha (para iniciativa) - sem join profiles (FK não existe)
  const { data: membersRaw } = await supabase
    .from('campaign_members')
    .select('*')
    .eq('campaign_id', id)

  let members: any[] = []
  if (membersRaw && membersRaw.length > 0) {
    const memberUserIds = membersRaw.map((m: any) => m.user_id)
    const { data: memberProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', memberUserIds)

    const memberProfilesMap = new Map(
      (memberProfiles || []).map((p: any) => [p.id, p])
    )

    members = membersRaw.map((m: any) => ({
      ...m,
      profiles: memberProfilesMap.get(m.user_id) || null,
    }))
  }

  // Buscar rolagens do jogador na sessao ativa
  let myRolls: unknown[] = []
  let initiativeEntries: unknown[] = []
  if (activeSession) {
    const { data: rolls } = await supabase
      .from('dice_rolls')
      .select('*')
      .eq('session_id', activeSession.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    
    myRolls = rolls || []

    // Buscar entradas de iniciativa
    const { data: initiative } = await supabase
      .from('initiative_entries')
      .select('*')
      .eq('session_id', activeSession.id)
      .order('sort_order', { ascending: true })

    initiativeEntries = initiative || []
  }

  return (
    <PlayerPanel
      campaign={membership.campaigns}
      membership={membership}
      activeSession={activeSession}
      initialRolls={myRolls}
      initialInitiative={initiativeEntries as any}
      members={members || []}
      userId={user.id}
    />
  )
}
