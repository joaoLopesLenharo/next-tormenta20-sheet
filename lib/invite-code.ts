/** No Postgres o default MD5 gera hex em minúsculas; na UI padronizamos em maiúsculas. */
export function formatInviteCodeDisplay(code: string | null | undefined): string {
  return (code ?? '').trim().toUpperCase()
}

export function normalizeInviteCodeForLookup(raw: string): string {
  return raw.trim().toLowerCase()
}
