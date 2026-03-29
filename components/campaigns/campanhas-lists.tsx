'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Plus, Users, Crown, AlertTriangle, Loader2 } from 'lucide-react'
import { CreateCampaignDialog } from '@/components/campaigns/create-campaign-dialog'
import { JoinCampaignDialog } from '@/components/campaigns/join-campaign-dialog'
import { CampaignCard } from '@/components/campaigns/campaign-card'
import type { Campaign, CampaignMember } from '@/lib/types/database'

interface MembershipWithCampaign extends CampaignMember {
  campaigns: Campaign
}

const CAMPAIGN_FIELDS =
  'id, name, description, status, created_at, updated_at, master_id, invite_code' as const

interface CampanhasListsProps {
  userId: string
}

export function CampanhasLists({ userId }: CampanhasListsProps) {
  const [masterCampaigns, setMasterCampaigns] = useState<Campaign[]>([])
  const [participating, setParticipating] = useState<MembershipWithCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadCampaigns = useCallback(async () => {
    setLoadError(null)
    const supabase = createClient()

    const { data: myRows, error: masterErr } = await supabase
      .from('campaigns')
      .select(CAMPAIGN_FIELDS)
      .eq('master_id', userId)
      .order('created_at', { ascending: false })

    if (masterErr) {
      setLoadError(masterErr.message)
      setMasterCampaigns([])
      setParticipating([])
      setLoading(false)
      return
    }

    const { data: memberships, error: memErr } = await supabase
      .from('campaign_members')
      .select('id, user_id, campaign_id, character_name, joined_at')
      .eq('user_id', userId)

    if (memErr) {
      setLoadError(memErr.message)
      setMasterCampaigns(myRows ?? [])
      setParticipating([])
      setLoading(false)
      return
    }

    let participatingList: MembershipWithCampaign[] = []
    if (memberships && memberships.length > 0) {
      const campaignIds = memberships.map((m) => m.campaign_id)
      const { data: campaignsData, error: campErr } = await supabase
        .from('campaigns')
        .select(CAMPAIGN_FIELDS)
        .in('id', campaignIds)

      if (campErr) {
        setLoadError(campErr.message)
        setMasterCampaigns(myRows ?? [])
        setParticipating([])
        setLoading(false)
        return
      }

      const byId = new Map((campaignsData ?? []).map((c) => [c.id, c]))
      participatingList = memberships
        .map((m) => ({
          ...m,
          campaigns: byId.get(m.campaign_id) ?? ({} as Campaign),
        }))
        .filter(
          (m) =>
            Boolean(m.campaigns.id) && m.campaigns.master_id !== userId,
        )
    }

    setMasterCampaigns(myRows ?? [])
    setParticipating(participatingList)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    setLoading(true)
    void loadCampaigns()
  }, [loadCampaigns])

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-8">
        <CreateCampaignDialog onSuccess={loadCampaigns}>
          <Button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
        </CreateCampaignDialog>

        <JoinCampaignDialog userId={userId} onSuccess={loadCampaigns}>
          <Button variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Entrar em Campanha
          </Button>
        </JoinCampaignDialog>
      </div>

      {loadError && (
        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar as campanhas</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{loadError}</p>
            <p className="text-xs opacity-90">
              Se o erro citar RLS ou recursão, rode no Supabase os scripts{' '}
              <code className="rounded bg-muted px-1">004_fix_campaign_members_rls_recursion.sql</code>{' '}
              e depois{' '}
              <code className="rounded bg-muted px-1">
                005_campaigns_policies_use_member_function.sql
              </code>
              .
            </p>
          </AlertDescription>
        </Alert>
      )}

      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-semibold">Minhas Campanhas</h2>
          <span className="text-sm text-muted-foreground">(como Mestre)</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando…</span>
          </div>
        ) : masterCampaigns.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {masterCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                isMaster
                href={`/campanhas/${campaign.id}/mestre`}
              />
            ))}
          </div>
        ) : (
          <Card className="section-card">
            <CardContent className="py-8 text-center">
              <Crown className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">
                Voce ainda nao criou nenhuma campanha.
              </p>
              <CreateCampaignDialog onSuccess={loadCampaigns}>
                <Button className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeira campanha
                </Button>
              </CreateCampaignDialog>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Participando</h2>
          <span className="text-sm text-muted-foreground">(como Jogador)</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando…</span>
          </div>
        ) : participating.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {participating.map((membership) => (
              <CampaignCard
                key={membership.id}
                campaign={membership.campaigns}
                href={`/campanhas/${membership.campaign_id}/jogador`}
              />
            ))}
          </div>
        ) : (
          <Card className="section-card">
            <CardContent className="py-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">
                Voce ainda nao participa de nenhuma campanha.
              </p>
              <JoinCampaignDialog userId={userId} onSuccess={loadCampaigns}>
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Entrar com codigo de convite
                </Button>
              </JoinCampaignDialog>
            </CardContent>
          </Card>
        )}
      </section>
    </>
  )
}
