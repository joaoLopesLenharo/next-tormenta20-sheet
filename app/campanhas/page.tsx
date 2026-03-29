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
import { Plus, Users, Crown, Swords, LogOut, User } from 'lucide-react'
import { CreateCampaignDialog } from '@/components/campaigns/create-campaign-dialog'
import { JoinCampaignDialog } from '@/components/campaigns/join-campaign-dialog'
import { LogoutButton } from '@/components/auth/logout-button'
import { CampaignCard } from '@/components/campaigns/campaign-card'
import type { Campaign, CampaignMember } from '@/lib/types/database'

interface CampaignWithDetails extends Campaign {
  campaign_members: { count: number }[]
}

interface MembershipWithCampaign extends CampaignMember {
  campaigns: Campaign
}

export default async function CampanhasPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Buscar campanhas onde o usuario eh mestre
  const { data: myCampaigns } = await supabase
    .from('campaigns')
    .select('*, campaign_members(count)')
    .eq('master_id', user.id)
    .order('created_at', { ascending: false })

  // Buscar campanhas onde o usuario eh jogador
  const { data: memberships } = await supabase
    .from('campaign_members')
    .select('*, campaigns(*)')
    .eq('user_id', user.id)

  // Filtrar para nao incluir campanhas onde eh mestre
  const participatingCampaigns = memberships?.filter(
    (m: MembershipWithCampaign) => m.campaigns.master_id !== user.id
  ) || []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativa':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativa</Badge>
      case 'pausada':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pausada</Badge>
      case 'encerrada':
        return <Badge className="bg-muted text-muted-foreground">Encerrada</Badge>
      default:
        return null
    }
  }

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Swords className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-bold">Tormenta 20</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.email}
            </span>
            <Link href="/perfil">
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4" />
              </Button>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <CreateCampaignDialog>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </CreateCampaignDialog>
          
          <JoinCampaignDialog userId={user.id}>
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Entrar em Campanha
            </Button>
          </JoinCampaignDialog>
        </div>

        {/* Minhas Campanhas (Mestre) */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-semibold">Minhas Campanhas</h2>
            <span className="text-sm text-muted-foreground">
              (como Mestre)
            </span>
          </div>

          {myCampaigns && myCampaigns.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(myCampaigns as CampaignWithDetails[]).map((campaign) => (
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
                <CreateCampaignDialog>
                  <Button className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar primeira campanha
                  </Button>
                </CreateCampaignDialog>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Campanhas Participando (Jogador) */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Participando</h2>
            <span className="text-sm text-muted-foreground">
              (como Jogador)
            </span>
          </div>

          {participatingCampaigns.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {participatingCampaigns.map((membership: MembershipWithCampaign) => (
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
                <JoinCampaignDialog userId={user.id}>
                  <Button variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Entrar com codigo de convite
                  </Button>
                </JoinCampaignDialog>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  )
}
