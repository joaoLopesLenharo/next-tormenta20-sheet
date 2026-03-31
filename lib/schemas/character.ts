import { z } from 'zod'

// Schema para atributos (6 atributos base do Tormenta 20)
export const AttributesSchema = z.object({
  forca: z.number().int().min(3).max(20),
  destreza: z.number().int().min(3).max(20),
  constituicao: z.number().int().min(3).max(20),
  inteligencia: z.number().int().min(3).max(20),
  sabedoria: z.number().int().min(3).max(20),
  carisma: z.number().int().min(3).max(20),
})

// Schema para recursos (vida, mana, prana)
export const ResourceSchema = z.object({
  atual: z.number().int().min(0),
  maximo: z.number().int().min(0),
  cor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
})

export const RecursosSchema = z.object({
  vida: ResourceSchema,
  mana: ResourceSchema,
  prana: ResourceSchema,
  recursos_extras: z.array(z.any()).optional(),
}).passthrough() // Permite campos extras como em Record<string, any>

// Schema para perícias
export const PericiaSchema = z.object({
  treinada: z.boolean().optional(),
  outros: z.number().int().optional(),
  atributo: z.string().optional(),
  bonusExtra: z.union([z.number(), z.string()]).optional(),
  desconto: z.string().optional(),
})

export const PericiasSchema = z.record(z.string(), PericiaSchema)

// Schema para inventário
export const InventarioSchema = z.object({
  armas: z.array(z.any()),
  armaduras: z.array(z.any()),
  itens: z.array(z.any()),
  dinheiro: z.record(z.string(), z.number()).optional(),
}).passthrough()

// Schema para magia
export const MagiasSchema = z.object({
  arcana: z.record(z.string(), z.array(z.any())).optional(),
  divina: z.record(z.string(), z.array(z.any())).optional(),
}).passthrough()

// Schema para ofício personalizado
export const OficioPersonalizadoSchema = z.object({
  id: z.string(),
  nome: z.string().min(1),
  atributo: z.string(),
  treinada: z.boolean().optional(),
  outros: z.number().int().optional(),
})

// Schema principal para CharacterType
export const CharacterDataSchema = z.object({
  nome: z.string().default(''),
  nivel: z.number().int().min(1).max(20).default(1),
  raca: z.string().default(''),
  classes: z.array(z.any()).default([]),
  divindade: z.string().default(''),
  tendencia: z.string().default(''),
  origem: z.string().default(''),
  deslocamento: z.number().int().default(9),
  foto: z.union([z.string(), z.object({}).passthrough()]).default(''),
  defenseAttribute: z.string().optional(),
  defenseAttributes: z.array(z.string()).default(['destreza']),
  atributos: AttributesSchema,
  recursos: RecursosSchema,
  defesa: z.number().int().min(0).default(10),
  defesa_outros: z.number().int().default(0),
  spellDCAttributes: z.array(z.string()).default(['inteligencia']),
  spellDC_outros: z.number().int().default(0),
  pericias: PericiasSchema.default({}),
  inventario: InventarioSchema,
  magias: MagiasSchema,
  habilidades: z.array(z.any()).default([]),
  poderes: z.array(z.any()).default([]),
  oficiosPersonalizados: z.array(OficioPersonalizadoSchema).optional(),
}).passthrough() // Permite campos extras para compatibilidade retroativa

export type CharacterData = z.infer<typeof CharacterDataSchema>
export type Atributos = z.infer<typeof AttributesSchema>
export type Recurso = z.infer<typeof ResourceSchema>
export type Pericia = z.infer<typeof PericiaSchema>
export type Pericias = z.infer<typeof PericiasSchema>
export type Inventario = z.infer<typeof InventarioSchema>
export type Magia = z.infer<typeof MagiasSchema>
export type OficioPersonalizado = z.infer<typeof OficioPersonalizadoSchema>

/**
 * Valida e sanitiza character_data do localStorage ou API
 * @param data - Dados brutos do personagem
 * @returns Dados validados e seguros
 * @throws ZodError se validação falhar
 */
export function validateCharacterData(data: unknown): CharacterData {
  return CharacterDataSchema.parse(data)
}

/**
 * Valida sem lançar erro, retornando null se inválido
 * @param data - Dados brutos do personagem
 * @returns Dados validados ou null
 */
export function tryValidateCharacterData(data: unknown): CharacterData | null {
  try {
    return validateCharacterData(data)
  } catch (error) {
    console.error('[v0] Character validation failed:', error)
    return null
  }
}

/**
 * Tenta reparar dados quebrados fazendo merge com defaults
 * @param data - Dados brutos do personagem
 * @returns Dados mesclados com defaults seguros
 */
export function validateAndRepairCharacterData(data: unknown, defaults: CharacterData): CharacterData {
  if (!data || typeof data !== 'object') {
    return defaults
  }

  try {
    return validateCharacterData(data)
  } catch {
    // Retorna dados com preenchimento seguro de defaults
    return {
      ...defaults,
      ...((data as any) || {}),
      atributos: {
        ...defaults.atributos,
        ...((data as any)?.atributos || {}),
      },
      recursos: {
        ...defaults.recursos,
        ...((data as any)?.recursos || {}),
      },
      pericias: {
        ...defaults.pericias,
        ...((data as any)?.pericias || {}),
      },
      inventario: {
        ...defaults.inventario,
        ...((data as any)?.inventario || {}),
      },
      magias: {
        ...defaults.magias,
        ...((data as any)?.magias || {}),
      },
    }
  }
}
