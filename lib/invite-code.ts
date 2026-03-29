/**
 * Melhoria 1: Padronização de códigos em minúsculas
 * Todos os códigos de convite são armazenados, exibidos e comparados em minúsculo.
 */

/** Formata o código de convite para exibição - sempre em minúsculo */
export function formatInviteCodeDisplay(code: string | null | undefined): string {
  return (code ?? '').trim().toLowerCase()
}

/** Normaliza o código para busca no banco - sempre em minúsculo */
export function normalizeInviteCodeForLookup(raw: string): string {
  return raw.trim().toLowerCase()
}

/** Converte código para minúsculo em tempo real durante digitação */
export function normalizeInviteCodeInput(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)
}
