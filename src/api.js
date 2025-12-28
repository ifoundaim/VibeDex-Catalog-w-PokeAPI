const BASE_URL = 'https://pokeapi.co/api/v2'

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
