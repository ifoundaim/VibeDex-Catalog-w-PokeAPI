export function normalizeQueryValue(value) {
  if (Array.isArray(value)) {
    return value[0] || ''
  }

  if (typeof value === 'string') {
    return value
  }

  return ''
}

export function buildUpstreamUrl(baseUrl, path, query) {
  const trimmedBase = String(baseUrl || '').replace(/\/+$/, '')
  const pathValue = String(path || '').startsWith('/') ? String(path || '') : `/${path}`
  const queryValue = query ? (query.startsWith('?') ? query : `?${query}`) : ''

  return `${trimmedBase}${pathValue}${queryValue}`
}

