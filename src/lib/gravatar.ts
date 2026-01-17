import md5 from 'blueimp-md5'

export function normalizeGravatarEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function buildGravatarUrl(email: string, size = 96): string | null {
  const normalized = normalizeGravatarEmail(email)
  if (!normalized) {
    return null
  }

  return `https://www.gravatar.com/avatar/${md5(normalized)}?s=${size}&d=404`
}
