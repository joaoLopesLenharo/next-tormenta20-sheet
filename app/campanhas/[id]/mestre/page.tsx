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

  // Buscar membros da campanha via API Route segura (usa Service Role Key no servidor)
  const { getBaseUrl } = await import('@/lib/get-base-url')
  let members: any[] = []
  try {
    // Extrair cookies para repassar na requisição interna
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')

    const res = await fetch(`${getBaseUrl()}/api/campaign-members?campaignId=${id}`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    })
    if (res.ok) {
      const json = await res.json()
      members = json.members || []
    } else {
      console.error('Error fetching members:', res.status)
    }
  } catch (err) {
    console.error('Error fetching members:', err)
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
