'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Users, Dices } from 'lucide-react'
import { SessionHistory } from '@/components/campaigns/session-history'
import type { Campaign } from '@/lib/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function HistoricoPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Buscar campanha
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (!campaign) {
    redirect('/campanhas')
  }

  // Verificar se usuario eh mestre ou jogador
  const isMaster = campaign.master_id === user.id

  if (!isMaster) {
    // Verificar se eh membro
    const { data: membership } = await supabase
      .from('campaign_members')
      .select('*')
      .eq('campaign_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      redirect('/campanhas')
    }
  }

  // Buscar todas as sessoes
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('campaign_id', id)
    .order('started_at', { ascending: false })

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={isMaster ? `/campanhas/${id}/mestre` : `/campanhas/${id}/jogador`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{campaign.name}</h1>
              <p className="text-sm text-muted-foreground">Histórico de Sessões</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <SessionHistory campaignId={id} isMaster={isMaster} sessions={sessions || []} />
      </main>
    </div>
  )
}
