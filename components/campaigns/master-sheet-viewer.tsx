'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Heart, Zap, Droplets, Shield, Users, Dices, ChevronRight } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface MasterSheetViewerProps {
  member: any
  isOpen: boolean
  onClose: () => void
}

export function MasterSheetViewer({ member, isOpen, onClose }: MasterSheetViewerProps) {
  const char = member?.character_data

  if (!char) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{member?.profiles?.display_name || 'Jogador'}</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Este jogador ainda não possui uma ficha carregada no painel.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Helper for attributes
  const renderAttribute = (attr: string, label: string) => {
    const value = char.atributos?.[attr] || 10
    const mod = Math.floor((value - 10) / 2)
    return (
      <div key={attr} className="bg-muted/50 rounded-lg p-2 text-center">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-sm text-primary font-mono">{mod >= 0 ? '+' : ''}{mod}</p>
      </div>
    )
  }

  // Calculate defense
  const getDefense = () => {
    const base = 10
    const selectedAttrs = char.defenseAttributes || (char.defenseAttribute ? [char.defenseAttribute] : ['destreza'])
    const attrMod = selectedAttrs.reduce((sum: number, a: string) => sum + Math.floor(((char.atributos?.[a] || 10) - 10) / 2), 0)
    const equippedArmor = char.inventario?.armaduras?.find((a: any) => a.equipada && a.categoria !== 'escudo')
    const equippedShield = char.inventario?.armaduras?.find((a: any) => a.equipada && a.categoria === 'escudo')
    return base + attrMod + (equippedArmor?.ca || 0) + (equippedShield?.ca || 0) + (char.defesa_outros || 0)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-[90vh] p-0 flex flex-col gap-0 max-h-screen">
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
               <span className="text-lg font-bold text-primary">
                 {(char.nome || 'P')[0].toUpperCase()}
               </span>
             </div>
             <div>
               <p className="font-semibold">{char.nome || 'Personagem'}</p>
               <p className="text-sm font-normal text-muted-foreground">
                 {char.raca}{char.classes?.length > 0 ? ` • ${char.classes.map((c: any) => `${c.nome || 'Classe'} ${c.nivel || 1}`).join(', ')}` : ''} - Jogador(a): {member?.profiles?.display_name || 'Desconhecido'}
               </p>
             </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6 pb-6">
            
            {/* Recursos */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                <Heart className="w-5 h-5 text-red-500 mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">Vida</p>
                <p className="text-xl font-bold text-red-400">
                  {char.recursos?.vida?.atual ?? 0} <span className="text-sm text-red-500/50">/ {char.recursos?.vida?.maximo ?? 0}</span>
                </p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                <Zap className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">Mana</p>
                <p className="text-xl font-bold text-blue-400">
                  {char.recursos?.mana?.atual ?? 0} <span className="text-sm text-blue-500/50">/ {char.recursos?.mana?.maximo ?? 0}</span>
                </p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                <Droplets className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">Prana</p>
                <p className="text-xl font-bold text-yellow-400">
                  {char.recursos?.prana?.atual ?? 0} <span className="text-sm text-yellow-500/50">/ {char.recursos?.prana?.maximo ?? 0}</span>
                </p>
              </div>
            </div>

            {/* Atributos */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center text-muted-foreground uppercase tracking-wider">
                Atributos e Defesa
              </h3>
              <div className="grid grid-cols-6 gap-2 mb-3">
                {renderAttribute('forca', 'FOR')}
                {renderAttribute('destreza', 'DES')}
                {renderAttribute('constituicao', 'CON')}
                {renderAttribute('inteligencia', 'INT')}
                {renderAttribute('sabedoria', 'SAB')}
                {renderAttribute('carisma', 'CAR')}
              </div>
              <div className="flex items-center gap-6 bg-muted/30 p-3 rounded-lg border border-border/50">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Defesa Total:</span>
                  <span className="text-lg font-bold">{getDefense()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Deslocamento:</span>
                  <span className="text-lg font-bold">{char.deslocamento || 9}m</span>
                </div>
              </div>
            </div>

            {/* Perícias Treinadas */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center text-muted-foreground uppercase tracking-wider">
                Perícias Treinadas e Bônus
              </h3>
              <div className="bg-muted/30 rounded-lg border border-border/50 divide-y divide-border/50 max-h-[200px] overflow-y-auto">
                {Object.entries(char.pericias || {})
                  .filter(([_, data]: [string, any]) => data.treinada)
                  .map(([name, data]: [string, any]) => (
                    <div key={name} className="flex justify-between items-center p-2 px-3 text-sm">
                      <span>{name}</span>
                      <div className="flex gap-3 text-xs">
                        <span className="text-muted-foreground">Treino: +{data.treinada !== 'destreinado' ? 'Sim' : '2'}</span>
                        <span className="text-primary font-bold">Base: {data.atributo?.toUpperCase().substring(0,3) || '???'}</span>
                      </div>
                    </div>
                  ))}
                {Object.keys(char.pericias || {}).filter((k) => (char.pericias as any)[k].treinada).length === 0 && (
                   <p className="p-3 text-xs text-muted-foreground text-center">Nenhuma perícia marcada como treinada.</p>
                )}
              </div>
            </div>

            {/* Inventario Resumo */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center text-muted-foreground uppercase tracking-wider">
                Equipamentos Visíveis
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg border border-border/50 p-3">
                  <p className="text-xs font-semibold mb-2">Armas</p>
                  <ul className="text-xs space-y-1">
                    {(char.inventario?.armas || []).map((a: any, i: number) => (
                      <li key={i} className="flex justify-between">
                         <span className="truncate pr-2">{a.nome || 'Arma sem nome'} {a.equipada ? '(Eq)' : ''}</span>
                         <span className="text-muted-foreground shrink-0">{a.dano || '?'}</span>
                      </li>
                    ))}
                    {!(char.inventario?.armas?.length > 0) && <li className="text-muted-foreground italic">Nada</li>}
                  </ul>
                </div>
                <div className="bg-muted/30 rounded-lg border border-border/50 p-3">
                  <p className="text-xs font-semibold mb-2">Armaduras / Escudos</p>
                  <ul className="text-xs space-y-1">
                    {(char.inventario?.armaduras || []).map((a: any, i: number) => (
                      <li key={i} className="flex justify-between">
                         <span className="truncate pr-2">{a.nome || 'Item sem nome'} {a.equipada ? '(Eq)' : ''}</span>
                         <span className="text-muted-foreground shrink-0">+ {a.ca || '?'} CA</span>
                      </li>
                    ))}
                    {!(char.inventario?.armaduras?.length > 0) && <li className="text-muted-foreground italic">Nada</li>}
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
