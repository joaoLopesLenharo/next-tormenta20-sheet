'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Dices, Loader2, Eye } from 'lucide-react'
import { rollDice, isValidDiceFormula } from '@/lib/dice-engine'

interface MasterDiceRollerProps {
  sessionId: string
  campaignId: string
  userId: string
}

export function MasterDiceRoller({
  sessionId,
  userId,
}: MasterDiceRollerProps) {
  const [formula, setFormula] = useState('1d20')
  const [observation, setObservation] = useState('')
  const [isSecret, setIsSecret] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRoll = async () => {
    setError(null)

    if (!isValidDiceFormula(formula)) {
      setError('Formula invalida. Use o formato NdX+M (ex: 1d20+5)')
      return
    }

    setRolling(true)

    const result = rollDice(formula)
    if (!result) {
      setError('Erro ao rolar dados')
      setRolling(false)
      return
    }

    const supabase = createClient()

    const { error: insertError } = await supabase.from('dice_rolls').insert({
      session_id: sessionId,
      user_id: userId,
      character_name: 'Mestre',
      roll_type: isSecret ? 'secreto' : 'livre',
      formula: formula,
      individual_results: result.individualResults,
      modifier: result.modifier,
      total: result.total,
      is_critical: result.isCritical,
      is_fumble: result.isFumble,
      natural_roll: result.naturalRoll,
      observation: observation.trim() || null,
      is_secret: isSecret,
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      setObservation('')
    }

    setRolling(false)
  }

  return (
    <Card className="section-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dices className="w-5 h-5 text-primary" />
          Rolagem do Mestre
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="form-group">
          <Label htmlFor="formula">Formula</Label>
          <Input
            id="formula"
            placeholder="1d20+5"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            className="font-mono"
          />
        </div>

        <div className="form-group">
          <Label htmlFor="observation">Observacao (opcional)</Label>
          <Input
            id="observation"
            placeholder="Ex: Teste de percepcao"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isSecret"
            checked={isSecret}
            onCheckedChange={(checked) => setIsSecret(checked as boolean)}
          />
          <Label
            htmlFor="isSecret"
            className="flex items-center gap-1 text-sm text-muted-foreground cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            Rolagem secreta (so voce ve)
          </Label>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          onClick={handleRoll}
          className="w-full btn-primary"
          disabled={rolling}
        >
          {rolling ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Dices className="w-4 h-4 mr-2" />
          )}
          Rolar
        </Button>
      </CardContent>
    </Card>
  )
}
