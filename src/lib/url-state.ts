const isBrowser = typeof window !== 'undefined'

export type SearchParamValue = string | string[] | null | undefined

export const readSearchParams = () =>
  new URLSearchParams(isBrowser ? window.location.search : '')

export const readParamList = (params: URLSearchParams, key: string) =>
  params.getAll(key)

export const readParamRange = (
  params: URLSearchParams,
  key: string
): [number, number] | null => {
  const value = params.get(key)
  if (!value) return null
  const parts = value.split('-')
  if (parts.length !== 2) return null
  const [startRaw, endRaw] = parts.map((part) => part.trim())
  if (!startRaw || !endRaw) return null
  const numericPattern = /^[+-]?\d+(\.\d+)?$/
  if (!numericPattern.test(startRaw) || !numericPattern.test(endRaw)) {
    return null
  }
  const start = Number(startRaw)
  const end = Number(endRaw)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  return start <= end ? [start, end] : [end, start]
}

export const updateSearchParams = (
  updates: Record<string, SearchParamValue>,
  options: { replace?: boolean } = {}
) => {
  if (!isBrowser) return
  const params = new URLSearchParams(window.location.search)

  for (const [key, value] of Object.entries(updates)) {
    params.delete(key)
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item)
      }
    } else if (value) {
      params.set(key, value)
    }
  }

  const search = params.toString()
  const nextUrl = search
    ? `${window.location.pathname}?${search}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`
  const method = options.replace === false ? 'pushState' : 'replaceState'
  window.history[method](null, '', nextUrl)
}
