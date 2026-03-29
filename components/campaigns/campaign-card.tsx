'use client'

import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Calendar } from 'lucide-react'
import type { Campaign } from '@/lib/types/database'
import { formatInviteCodeDisplay } from '@/lib/invite-code'

interface CampaignCardProps {
  campaign: Campaign & { campaign_members?: { count: number }[] }
  isMaster?: boolean
  memberCount?: number
  href: string
}

export function CampaignCard({
  campaign,
  isMaster = false,
  memberCount = 0,
  href,
}: CampaignCardProps) {
  const memberCountValue =
    campaign.campaign_members && campaign.campaign_members.length > 0
      ? campaign.campaign_members[0].count
      : memberCount

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1" />
            Ativa
          </Badge>
        )
      case 'paused':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Pausada
          </Badge>
        )
      case 'ended':
        return (
          <Badge className="bg-muted text-muted-foreground">
            Encerrada
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <Link href={href}>
      <Card className="section-card h-full hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-1 text-balance">
              {campaign.name}
            </CardTitle>
            {getStatusBadge(campaign.status)}
          </div>
          <CardDescription className="line-clamp-2">
            {campaign.description || 'Sem descrição'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Membros */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>
              {memberCountValue} jogador{memberCountValue !== 1 ? 'es' : ''}
            </span>
          </div>

          {/* Data de Criação */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(campaign.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
              })}
            </span>
          </div>

          {/* Código de Convite */}
          {isMaster && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Código de Convite:</p>
              <code className="text-xs font-mono bg-muted/50 px-2 py-1 rounded border border-border/50">
                {formatInviteCodeDisplay(campaign.invite_code)}
              </code>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
