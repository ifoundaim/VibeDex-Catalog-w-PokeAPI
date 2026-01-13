const BASE_URL = 'https://pokeapi.co/api/v2'
const PROXY_URL = '/api/proxy'

export async function fetchPokemonList(limit = 20, offset = 0) {
  const response = await fetch(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`)

  if (!response.ok) {
    throw new Error('Failed to fetch Pokemon list.')
  }

  return response.json()
}

export async function fetchPokemonDetails(url) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch Pokemon details.')
  }

  return response.json()
}

export async function fetchProtectedResource(path, query = '') {
  const params = new URLSearchParams({ path })

  if (query) {
    params.set('query', query)
  }

  let response

  try {
    response = await fetch(`${PROXY_URL}?${params.toString()}`)
  } catch (error) {
    const networkError = new Error(
      'Proxy server is not reachable. Start the server and try again.'
    )
    networkError.details = { error: error?.message || 'Network error.' }
    throw networkError
  }
  const contentType = response.headers.get('content-type') || ''
  let payload

  if (contentType.includes('application/json')) {
    payload = await response.json()
  } else {
    const text = await response.text()
    payload = { message: text }
  }

  if (!response.ok) {
    const errorMessage =
      payload?.error || 'Failed to fetch from the protected API.'
    const error = new Error(errorMessage)
    error.details = payload
    throw error
  }

  return payload
}
