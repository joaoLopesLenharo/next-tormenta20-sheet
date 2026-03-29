// Motor de dados para Tormenta 20
// Suporta notação NdX+M (ex: 2d6+3, 1d20-1, 4d4, d100)

export interface DiceResult {
  formula: string
  individualResults: number[]
  modifier: number
  total: number
  naturalRoll: number | null  // Para d20, o valor natural (sem modificador)
  isCritical: boolean         // 20 natural no d20
  isFumble: boolean           // 1 natural no d20
}

export interface ParsedDice {
  count: number
  sides: number
  modifier: number
}

/**
 * Parseia uma fórmula de dados no formato NdX+M
 * Exemplos: 2d6+3, 1d20-1, d100, 4d4
 */
export function parseDiceFormula(formula: string): ParsedDice | null {
  // Remove espaços e converte para minúsculo
  const cleaned = formula.toLowerCase().replace(/\s/g, '')
  
  // Regex para capturar NdX+M ou NdX-M ou NdX ou dX
  const match = cleaned.match(/^(\d*)d(\d+)([+-]\d+)?$/)
  
  if (!match) return null
  
  const count = match[1] ? parseInt(match[1], 10) : 1
  const sides = parseInt(match[2], 10)
  const modifier = match[3] ? parseInt(match[3], 10) : 0
  
  if (count < 1 || count > 100 || sides < 1 || sides > 1000) {
    return null
  }
  
  return { count, sides, modifier }
}

/**
 * Rola um único dado de N lados
 */
export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

/**
 * Executa uma rolagem de dados baseada na fórmula
 */
export function rollDice(formula: string): DiceResult | null {
  const parsed = parseDiceFormula(formula)
  
  if (!parsed) return null
  
  const { count, sides, modifier } = parsed
  
  const individualResults: number[] = []
  for (let i = 0; i < count; i++) {
    individualResults.push(rollDie(sides))
  }
  
  const diceSum = individualResults.reduce((sum, val) => sum + val, 0)
  const total = diceSum + modifier
  
  // Para d20, verificar crítico e falha crítica
  const isD20Roll = count === 1 && sides === 20
  const naturalRoll = isD20Roll ? individualResults[0] : null
  const isCritical = isD20Roll && individualResults[0] === 20
  const isFumble = isD20Roll && individualResults[0] === 1
  
  return {
    formula,
    individualResults,
    modifier,
    total,
    naturalRoll,
    isCritical,
    isFumble,
  }
}

/**
 * Rola dados de dano crítico (dobra a quantidade de dados, não o total)
 * Regra Tormenta 20: ao acertar crítico, rola o dobro de dados de dano
 */
export function rollCriticalDamage(formula: string): DiceResult | null {
  const parsed = parseDiceFormula(formula)
  
  if (!parsed) return null
  
  // Dobra a quantidade de dados
  const criticalFormula = `${parsed.count * 2}d${parsed.sides}${parsed.modifier >= 0 ? '+' : ''}${parsed.modifier}`
  
  return rollDice(criticalFormula)
}

/**
 * Formata o resultado da rolagem para exibição
 */
export function formatRollResult(result: DiceResult): string {
  const diceStr = result.individualResults.join(' + ')
  const modStr = result.modifier !== 0 
    ? (result.modifier > 0 ? ` + ${result.modifier}` : ` - ${Math.abs(result.modifier)}`)
    : ''
  
  return `[${diceStr}]${modStr} = ${result.total}`
}

/**
 * Determina a classe CSS baseada no resultado
 */
export function getRollResultClass(result: DiceResult): string {
  if (result.isCritical) return 'critical'
  if (result.isFumble) return 'fumble'
  return 'normal'
}

/**
 * Determina o status do resultado (para exibição visual)
 */
export function getRollStatus(result: DiceResult): 'critical' | 'fumble' | 'success' | 'normal' {
  if (result.isCritical) return 'critical'
  if (result.isFumble) return 'fumble'
  return 'normal'
}

/**
 * Valida se uma fórmula de dados é válida
 */
export function isValidDiceFormula(formula: string): boolean {
  return parseDiceFormula(formula) !== null
}

/**
 * Gera uma fórmula de d20 + modificador
 */
export function createD20Formula(modifier: number): string {
  if (modifier === 0) return '1d20'
  return modifier > 0 ? `1d20+${modifier}` : `1d20${modifier}`
}
