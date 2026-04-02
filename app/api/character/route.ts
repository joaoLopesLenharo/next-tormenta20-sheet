import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

// UUID v4 regex para validar IDs
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Schema para validar o corpo da requisição de save
const SaveCharacterSchema = z.object({
  campaignId: z.string().regex(UUID_REGEX, 'Invalid campaignId format'),
  characterId: z.string().optional(),
  characterData: z.object({
    nome: z.string().optional(),
    raca: z.string().optional(),
    origem: z.string().optional(),
    divindade: z.string().optional(),
    tendencia: z.string().optional(),
    nivel: z.number().optional(),
    deslocamento: z.number().optional(),
    classes: z.array(z.any()).optional(),
    atributos: z.record(z.number()).optional(),
    pericias: z.record(z.any()).optional(),
    recursos: z.any().optional(),
    inventario: z.any().optional(),
    poderes: z.array(z.any()).optional(),
    magias: z.any().optional(),
    habilidades: z.array(z.any()).optional(),
    defenseAttributes: z.array(z.string()).optional(),
    defesa_outros: z.number().optional(),
    spellDCAttributes: z.array(z.string()).optional(),
    spellDC_outros: z.number().optional(),
  }).passthrough(),
  setAsActive: z.boolean().optional().default(true),
})

// Schema para múltiplos personagens armazenados no campo character_data
const MultiCharacterDataSchema = z.object({
  characters: z.array(z.object({
    id: z.string(),
    name: z.string(),
    data: z.any(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })),
  activeCharacterId: z.string().nullable(),
})

/**
 * GET - Buscar personagens do jogador em uma campanha
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get('campaignId')

  if (!campaignId || !UUID_REGEX.test(campaignId)) {
    return NextResponse.json(
      { error: 'Valid campaignId is required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Buscar membership do jogador
  const { data: membership, error } = await supabase
    .from('campaign_members')
    .select('id, character_name, character_data')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .single()

  if (error || !membership) {
    return NextResponse.json(
      { error: 'Not a member of this campaign' },
      { status: 403 }
    )
  }

  // Parse character_data para o formato de múltiplos personagens
  let multiCharData = { characters: [], activeCharacterId: null }
  
  if (membership.character_data) {
    // Verificar se já está no novo formato
    const parsed = MultiCharacterDataSchema.safeParse(membership.character_data)
    if (parsed.success) {
      multiCharData = parsed.data
    } else {
      // Migrar formato antigo (single character) para o novo formato
      const legacyData = membership.character_data as any
      if (legacyData.nome || legacyData.atributos) {
        const charId = `char_${Date.now()}`
        multiCharData = {
          characters: [{
            id: charId,
            name: legacyData.nome || membership.character_name || 'Personagem',
            data: legacyData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }],
          activeCharacterId: charId,
        }
      }
    }
  }

  return NextResponse.json({
    membershipId: membership.id,
    characterName: membership.character_name,
    characters: multiCharData.characters,
    activeCharacterId: multiCharData.activeCharacterId,
  })
}

/**
 * POST - Salvar/Criar personagem
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = SaveCharacterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { campaignId, characterId, characterData, setAsActive } = parsed.data

  // Buscar membership atual
  const { data: membership, error: fetchError } = await supabase
    .from('campaign_members')
    .select('id, character_data')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !membership) {
    return NextResponse.json(
      { error: 'Not a member of this campaign' },
      { status: 403 }
    )
  }

  // Parse existing character_data
  let multiCharData: { characters: any[]; activeCharacterId: string | null } = {
    characters: [],
    activeCharacterId: null,
  }

  if (membership.character_data) {
    const parsed = MultiCharacterDataSchema.safeParse(membership.character_data)
    if (parsed.success) {
      multiCharData = parsed.data
    } else {
      // Migrar formato antigo
      const legacyData = membership.character_data as any
      if (legacyData.nome || legacyData.atributos) {
        const charId = `char_${Date.now()}_legacy`
        multiCharData = {
          characters: [{
            id: charId,
            name: legacyData.nome || 'Personagem Antigo',
            data: legacyData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }],
          activeCharacterId: charId,
        }
      }
    }
  }

  const now = new Date().toISOString()
  let finalCharacterId = characterId

  if (characterId) {
    // Atualizar personagem existente
    const charIndex = multiCharData.characters.findIndex(c => c.id === characterId)
    if (charIndex >= 0) {
      multiCharData.characters[charIndex] = {
        ...multiCharData.characters[charIndex],
        name: characterData.nome || multiCharData.characters[charIndex].name,
        data: characterData,
        updatedAt: now,
      }
    } else {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }
  } else {
    // Criar novo personagem
    finalCharacterId = `char_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    multiCharData.characters.push({
      id: finalCharacterId,
      name: characterData.nome || 'Novo Personagem',
      data: characterData,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Definir como ativo se solicitado
  if (setAsActive && finalCharacterId) {
    multiCharData.activeCharacterId = finalCharacterId
  }

  // Salvar no banco
  const { error: updateError } = await supabase
    .from('campaign_members')
    .update({
      character_data: multiCharData,
      character_name: characterData.nome || membership.character_data?.characters?.find((c: any) => c.id === multiCharData.activeCharacterId)?.name || 'Personagem',
    })
    .eq('id', membership.id)

  if (updateError) {
    console.error('[character] Error saving character:', updateError)
    return NextResponse.json(
      { error: 'Failed to save character' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    characterId: finalCharacterId,
    characters: multiCharData.characters,
    activeCharacterId: multiCharData.activeCharacterId,
  })
}

/**
 * DELETE - Remover personagem
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get('campaignId')
  const characterId = searchParams.get('characterId')

  if (!campaignId || !UUID_REGEX.test(campaignId)) {
    return NextResponse.json(
      { error: 'Valid campaignId is required' },
      { status: 400 }
    )
  }

  if (!characterId) {
    return NextResponse.json(
      { error: 'characterId is required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Buscar membership atual
  const { data: membership, error: fetchError } = await supabase
    .from('campaign_members')
    .select('id, character_data')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !membership) {
    return NextResponse.json(
      { error: 'Not a member of this campaign' },
      { status: 403 }
    )
  }

  // Parse existing character_data
  const parsed = MultiCharacterDataSchema.safeParse(membership.character_data)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'No characters found' },
      { status: 404 }
    )
  }

  const multiCharData = parsed.data

  // Remover personagem
  const charIndex = multiCharData.characters.findIndex(c => c.id === characterId)
  if (charIndex < 0) {
    return NextResponse.json(
      { error: 'Character not found' },
      { status: 404 }
    )
  }

  multiCharData.characters.splice(charIndex, 1)

  // Se era o personagem ativo, definir outro como ativo
  if (multiCharData.activeCharacterId === characterId) {
    multiCharData.activeCharacterId = multiCharData.characters[0]?.id || null
  }

  // Salvar no banco
  const { error: updateError } = await supabase
    .from('campaign_members')
    .update({ character_data: multiCharData })
    .eq('id', membership.id)

  if (updateError) {
    console.error('[character] Error deleting character:', updateError)
    return NextResponse.json(
      { error: 'Failed to delete character' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    characters: multiCharData.characters,
    activeCharacterId: multiCharData.activeCharacterId,
  })
}

/**
 * PATCH - Trocar personagem ativo
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { campaignId, characterId } = body

  if (!campaignId || !UUID_REGEX.test(campaignId)) {
    return NextResponse.json(
      { error: 'Valid campaignId is required' },
      { status: 400 }
    )
  }

  if (!characterId) {
    return NextResponse.json(
      { error: 'characterId is required' },
      { status: 400 }
    )
  }

  // Buscar membership atual
  const { data: membership, error: fetchError } = await supabase
    .from('campaign_members')
    .select('id, character_data')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !membership) {
    return NextResponse.json(
      { error: 'Not a member of this campaign' },
      { status: 403 }
    )
  }

  // Parse existing character_data
  const parsed = MultiCharacterDataSchema.safeParse(membership.character_data)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'No characters found' },
      { status: 404 }
    )
  }

  const multiCharData = parsed.data

  // Verificar se o personagem existe
  const char = multiCharData.characters.find(c => c.id === characterId)
  if (!char) {
    return NextResponse.json(
      { error: 'Character not found' },
      { status: 404 }
    )
  }

  // Definir como ativo
  multiCharData.activeCharacterId = characterId

  // Salvar no banco
  const { error: updateError } = await supabase
    .from('campaign_members')
    .update({
      character_data: multiCharData,
      character_name: char.name,
    })
    .eq('id', membership.id)

  if (updateError) {
    console.error('[character] Error updating active character:', updateError)
    return NextResponse.json(
      { error: 'Failed to update active character' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    activeCharacterId: characterId,
    character: char,
  })
}
