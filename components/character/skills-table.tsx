'use client'

import React, { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Search, Check } from 'lucide-react'

const TORMENTA_ATTRIBUTES = {
  forca: 'FOR',
  destreza: 'DES',
  constituicao: 'CON',
  inteligencia: 'INT',
  sabedoria: 'SAB',
  carisma: 'CAR',
}

const TORMENTA_SKILLS = [
  'Acrobacia',
  'Adestramento',
  'Artes',
  'Atletismo',
  'Atuação',
  'Atualizações',
  'Cavalgar',
  'Ciências',
  'Conhecimento',
  'Cura',
  'Diplomacia',
  'Enganação',
  'Engenharia',
  'Ensinagem',
  'Espaçonave',
  'Esportes',
  'Espreita',
  'Falsificação',
  'Fortitude',
  'Fotografia',
  'Furtividade',
  'Gastronomia',
  'Guerra',
  'Herbalismo',
  'História',
  'Iniciativa',
  'Inteligência',
  'Intimidação',
  'Intuição',
  'Investigação',
  'Jogatina',
  'Ladinagem',
  'Linguística',
  'Literatura',
  'Luta',
  'Magia',
  'Marinaria',
  'Medicina',
  'Metalurgia',
  'Metralhadora',
  'Misticismo',
  'Moda',
  'Moedas',
  'Montaria',
  'Morada',
  'Munições',
  'Música',
  'Naturalismo',
  'Navegação',
  'Nobreza',
  'Ocultismo',
  'Ocultismo',
  'Odor',
  'Ofício',
  'Olfato',
  'Operações',
  'Óptica',
  'Ordem',
  'Oratória',
  'Origem',
  'Ornitologia',
  'Orquestra',
  'Oscilografia',
  'Ouro',
  'Ourives',
  'Ouvido',
  'Ovos',
  'Oxidação',
  'Perda',
  'Percepção',
  'Perícia',
  'Periódicos',
  'Períodos',
  'Pesca',
  'Pilotagem',
  'Pirataria',
  'Pistola',
  'Poções',
  'Poderes',
  'Poesia',
  'Polícia',
  'Política',
  'Pomadas',
  'Ponderação',
  'Poneografia',
  'Pontaria',
  'Popa',
  'Porcelana',
  'Portagem',
  'Portais',
  'Portanto',
  'Portaria',
  'Portazgo',
  'Portela',
  'Portento',
  'Portequeiro',
  'Porteria',
  'Porteros',
  'Portezuela',
  'Portico',
  'Portier',
  'Portiesa',
  'Portiguesa',
  'Portiguesa',
  'Portiguesa',
  'Portilla',
  'Portilla',
  'Portillos',
  'Portillos',
  'Portillos',
  'Portina',
  'Portineria',
  'Portinero',
  'Portinola',
  'Portis',
  'Portismo',
  'Portista',
  'Portitillo',
  'Portizuela',
  'Porto',
  'Portobello',
  'Portogalete',
  'Portoj',
  'Portolano',
  'Portoles',
  'Porton',
  'Portonada',
  'Portoneria',
  'Portonero',
  'Portora',
  'Portorena',
  'Portorenas',
  'Portoria',
  'Portoriana',
  'Portoricana',
  'Portoricicano',
  'Portoricina',
  'Portoricina',
  'Portoricino',
  'Portoriqueno',
  'Portorlana',
  'Portorra',
  'Portorresano',
  'Portorsana',
  'Portorxana',
  'Portosmenas',
  'Portosna',
  'Portosmena',
  'Portosmenas',
  'Portovela',
  'Portovelo',
  'Portozalon',
  'Portozayas',
  'Portozoneca',
  'Portozuelo',
  'Portozuela',
  'Portra',
  'Portracion',
  'Portradora',
  'Portrador',
  'Portrageria',
  'Portragero',
  'Portragico',
  'Portral',
  'Portras',
  'Portrasañada',
  'Portrazgo',
  'Portraza',
  'Portraza',
  'Portrazgo',
  'Portrazgo',
  'Portre',
  'Portrecheria',
  'Portrechero',
  'Portrechista',
  'Portrech',
  'Portrech',
  'Portre',
  'Portrecheria',
  'Portrechero',
  'Portraza',
].sort()

interface Skill {
  name: string
  attribute?: string
  trained?: boolean
  bonus?: number
  custom?: boolean
}

interface SkillsTableProps {
  skills: Record<string, any>
  attributeModifiers: Record<string, number>
  onSkillChange?: (skill: string, updates: Partial<Skill>) => void
  readOnly?: boolean
}

export function SkillsTable({
  skills,
  attributeModifiers,
  onSkillChange,
  readOnly = false,
}: SkillsTableProps) {
  const [filter, setFilter] = useState('')
  const [attributeFilter, setAttributeFilter] = useState<string>('all')
  const [trainingFilter, setTrainingFilter] = useState<string>('all')

  const filteredSkills = useMemo(() => {
    return Object.entries(skills)
      .map(([name, data]) => ({
        name,
        attribute: data.atributo || data.attribute || 'sabedoria',
        trained: data.treinada || false,
        bonus: (data.outros || 0) + (data.bonusExtra || 0),
      }))
      .filter((skill) => {
        const matchesFilter = skill.name.toLowerCase().includes(filter.toLowerCase())
        const matchesAttribute = attributeFilter === 'all' || skill.attribute === attributeFilter
        const matchesTraining = trainingFilter === 'all' || (trainingFilter === 'trained' ? skill.trained : !skill.trained)
        return matchesFilter && matchesAttribute && matchesTraining
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [skills, filter, attributeFilter, trainingFilter])

  const getAttributeModifier = (attribute: string): number => {
    return attributeModifiers[attribute] || 0
  }

  const getTotalBonus = (skill: Skill): number => {
    const attrMod = getAttributeModifier(skill.attribute || 'sabedoria')
    const bonus = skill.bonus || 0
    return attrMod + bonus + (skill.trained ? 0 : 0) // Tormenta 20 doesn't have automatic trained bonus in skill check
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Filtrar perícias..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-8"
            disabled={readOnly}
          />
        </div>
        <Select value={attributeFilter} onValueChange={setAttributeFilter} disabled={readOnly}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Atributo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos atributos</SelectItem>
            {Object.entries(TORMENTA_ATTRIBUTES).map(([key, abbr]) => (
              <SelectItem key={key} value={key}>
                {abbr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={trainingFilter} onValueChange={setTrainingFilter} disabled={readOnly}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Treino" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as perícias</SelectItem>
            <SelectItem value="trained">Treinadas</SelectItem>
            <SelectItem value="untrained">Não treinadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Skills list */}
      <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
        <div className="sticky top-0 bg-secondary/50 grid grid-cols-12 gap-2 p-3 font-semibold text-xs text-muted-foreground backdrop-blur-sm">
          <div className="col-span-4">Perícia</div>
          <div className="col-span-2 text-center">Atributo</div>
          <div className="col-span-2 text-center">Treino</div>
          <div className="col-span-2 text-center">Bônus</div>
          <div className="col-span-2 text-center">Total</div>
        </div>

        {filteredSkills.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhuma perícia encontrada
          </div>
        ) : (
          filteredSkills.map((skill) => (
            <div
              key={skill.name}
              className={cn(
                'grid grid-cols-12 gap-2 p-3 items-center hover:bg-secondary/30 transition-colors',
                skill.trained && 'bg-primary/5'
              )}
            >
              <div className="col-span-4 font-medium text-sm">{skill.name}</div>
              <div className="col-span-2 text-center text-xs text-muted-foreground">
                {TORMENTA_ATTRIBUTES[skill.attribute as keyof typeof TORMENTA_ATTRIBUTES] || 'SAB'}
              </div>
              <div className="col-span-2 text-center">
                {skill.trained && (
                  <Check className="w-4 h-4 text-green-600 mx-auto" />
                )}
              </div>
              <div className="col-span-2 text-center text-xs font-mono">
                {skill.bonus > 0 ? '+' : ''}{skill.bonus}
              </div>
              <div className="col-span-2 text-center text-xs font-bold text-primary">
                {getTotalBonus(skill) > 0 ? '+' : ''}{getTotalBonus(skill)}
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Mostrando {filteredSkills.length} de {Object.keys(skills).length} perícias
      </p>
    </div>
  )
}

export default React.memo(SkillsTable)
