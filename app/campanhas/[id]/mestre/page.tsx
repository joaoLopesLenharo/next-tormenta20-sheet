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
  let members: any[] = []
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceRoleKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { createClient: createAdminClient } = await import('@supabase/supabase-js')
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKey
      )
      const { data: membersData, error: membersError } = await admin
        .from('campaign_members')
        .select('*, profiles(*)')
        .eq('campaign_id', id)
      if (!membersError) {
        members = membersData || []
      } else {
        console.error('[mestre/page] Error fetching members via admin:', membersError)
      }
    } catch (err) {
      console.error('[mestre/page] Error creating admin client:', err)
    }
  } else {
    // Fallback: buscar via RLS (pode retornar apenas o próprio usuário dependendo das policies)
    try {
      const { data: membersData } = await supabase
        .from('campaign_members')
        .select('*, profiles(*)')
        .eq('campaign_id', id)
      members = membersData || []
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
      .select('*, profiles(*)')
      .eq('session_id', activeSession.id)
      .order('created_at', { ascending: false })
      .limit(100)
    
    recentRolls = rolls || []

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
