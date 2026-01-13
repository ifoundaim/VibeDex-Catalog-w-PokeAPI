import './style.css'
import {
  fetchPokemonDetails,
  fetchPokemonList,
  fetchProtectedResource
} from './api.js'

const state = {
  limit: 20,
  offset: 0,
  items: [],
  listLoading: false,
  listError: '',
  detailsLoading: false,
  detailsError: '',
  details: null,
  selectedUrl: '',
  searchQuery: '',
  sortMode: 'number',
  nameSortDirection: 'asc',
  numberSortDirection: 'asc',
  detailsCache: new Map(),
  proxyLoading: false,
  proxyError: '',
  proxyResult: null
}

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="app">
    <header class="top-bar">
      <div class="intro">
        <p class="eyebrow">VibeDex Catalog</p>
        <h1>Pokemon Catalog</h1>
        <p class="subtitle">Catch up with the latest creatures, one page at a time.</p>
        <div class="controls">
          <div class="control">
            <label for="search-input">Search name</label>
            <input
              id="search-input"
              type="search"
              placeholder="e.g. pikachu"
              autocomplete="off"
            />
          </div>
          <button class="ghost" id="sort-name" type="button">Sort A-Z</button>
          <button class="ghost" id="sort-number" type="button">Sort # First-Last</button>
          <button class="primary" id="load-more" type="button">Load More</button>
          <div class="loaded-count" id="loaded-count">Loaded: 0</div>
        </div>
      </div>
    </header>
    <div class="status" id="list-status" role="status" aria-live="polite"></div>
    <main class="content">
      <section class="list-panel">
        <div class="list" id="pokemon-list"></div>
      </section>
      <section class="detail-panel" id="detail-panel">
        <p class="muted">Select a Pokemon to see the details.</p>
      </section>
    </main>
    <section class="proxy-panel">
      <div class="proxy-card">
        <div class="proxy-header">
          <div>
            <p class="eyebrow">Protected API Demo</p>
            <p class="proxy-copy">
              Calls the local proxy so secrets stay on the server.
            </p>
          </div>
          <button class="ghost" id="proxy-demo" type="button">
            Protected API Demo
          </button>
        </div>
        <div class="status" id="proxy-status" role="status" aria-live="polite"></div>
        <pre class="proxy-output" id="proxy-output"></pre>
      </div>
    </section>
  </div>
`

const listEl = document.querySelector('#pokemon-list')
const listStatusEl = document.querySelector('#list-status')
const detailPanelEl = document.querySelector('#detail-panel')
const loadMoreBtn = document.querySelector('#load-more')
const loadedCountEl = document.querySelector('#loaded-count')
const searchInputEl = document.querySelector('#search-input')
const sortNameBtn = document.querySelector('#sort-name')
const sortNumberBtn = document.querySelector('#sort-number')
const proxyDemoBtn = document.querySelector('#proxy-demo')
const proxyStatusEl = document.querySelector('#proxy-status')
const proxyOutputEl = document.querySelector('#proxy-output')

const PROXY_DEMO_PATH = '/__demo/protected'
const PROXY_DEMO_QUERY = ''

function getVisibleItems() {
  const query = state.searchQuery.trim().toLowerCase()
  let visibleItems = state.items

  if (query) {
    visibleItems = visibleItems.filter((item) => item.name.includes(query))
  }

  const direction =
    state.sortMode === 'name'
      ? state.nameSortDirection
      : state.numberSortDirection

  visibleItems = [...visibleItems].sort((a, b) => {
    if (state.sortMode === 'name') {
      return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
    }

    return a.index - b.index
  })

  if (direction === 'desc') {
    visibleItems.reverse()
  }

  return visibleItems
}

function renderControls() {
  loadedCountEl.textContent = `Loaded: ${state.items.length}`
  sortNameBtn.textContent =
    state.nameSortDirection === 'asc' ? 'Sort A-Z' : 'Sort Z-A'
  sortNumberBtn.textContent =
    state.numberSortDirection === 'asc'
      ? 'Sort # First-Last'
      : 'Sort # Last-First'

  sortNameBtn.classList.toggle('active', state.sortMode === 'name')
  sortNumberBtn.classList.toggle('active', state.sortMode === 'number')
  sortNameBtn.setAttribute('aria-pressed', state.sortMode === 'name')
  sortNumberBtn.setAttribute('aria-pressed', state.sortMode === 'number')
}

function renderList() {
  const visibleItems = getVisibleItems()
  renderControls()

  if (!visibleItems.length) {
    listEl.innerHTML = state.searchQuery.trim()
      ? '<p class="muted">No matches.</p>'
      : ''
    return
  }

  listEl.innerHTML = visibleItems
    .map((item) => {
      const selectedClass = item.url === state.selectedUrl ? 'selected' : ''
      return `
        <button class="card ${selectedClass}" data-url="${item.url}" type="button">
          <span class="index">#${String(item.index).padStart(3, '0')}</span>
          <span class="name">${item.name}</span>
        </button>
      `
    })
    .join('')
}

function renderListStatus() {
  if (state.listLoading) {
    listStatusEl.textContent = 'Loading Pokemon list...'
    listStatusEl.className = 'status loading'
  } else if (state.listError) {
    listStatusEl.textContent = state.listError
    listStatusEl.className = 'status error'
  } else {
    listStatusEl.textContent = ''
    listStatusEl.className = 'status'
  }

  loadMoreBtn.disabled = state.listLoading
}

function renderDetails() {
  if (state.detailsLoading) {
    detailPanelEl.innerHTML = '<p class="muted">Loading...</p>'
    return
  }

  if (state.detailsError) {
    detailPanelEl.innerHTML = `<p class="error">${state.detailsError}</p>`
    return
  }

  if (!state.details) {
    detailPanelEl.innerHTML = '<p class="muted">Select a Pokemon to see the details.</p>'
    return
  }

  const sprite = state.details.sprites?.front_default
  const types = state.details.types.map((type) => type.type.name).join(', ')
  const abilities = state.details.abilities
    .map((ability) => ability.ability.name)
    .join(', ')

  detailPanelEl.innerHTML = `
    <div class="detail-header">
      <h2>${state.details.name}</h2>
      ${sprite ? `<img src="${sprite}" alt="${state.details.name}" />` : ''}
    </div>
    <div class="detail-grid">
      <div>
        <h3>Types</h3>
        <p>${types}</p>
      </div>
      <div>
        <h3>Height</h3>
        <p>${state.details.height}</p>
      </div>
      <div>
        <h3>Weight</h3>
        <p>${state.details.weight}</p>
      </div>
      <div>
        <h3>Abilities</h3>
        <p>${abilities}</p>
      </div>
    </div>
  `
}

function renderProxyDemo() {
  if (state.proxyLoading) {
    proxyStatusEl.textContent = 'Loading protected data...'
    proxyStatusEl.className = 'status loading'
    proxyOutputEl.textContent = 'Fetching response from the proxy...'
  } else if (state.proxyError) {
    proxyStatusEl.textContent = state.proxyError
    proxyStatusEl.className = 'status error'
    proxyOutputEl.textContent = state.proxyResult
      ? JSON.stringify(state.proxyResult, null, 2)
      : 'Request failed. Check the server output.'
  } else {
    proxyStatusEl.textContent = 'Ready to fetch protected data.'
    proxyStatusEl.className = 'status'
    proxyOutputEl.textContent = state.proxyResult
      ? JSON.stringify(state.proxyResult, null, 2)
      : 'Click the button to run a request through the local proxy.'
  }

  proxyDemoBtn.disabled = state.proxyLoading
}

async function loadMorePokemon() {
  if (state.listLoading) {
    return
  }

  state.listLoading = true
  state.listError = ''
  renderListStatus()

  try {
    const data = await fetchPokemonList(state.limit, state.offset)
    const newItems = data.results.map((item, index) => ({
      ...item,
      index: state.offset + index + 1
    }))

    state.items = [...state.items, ...newItems]
    state.offset += state.limit
    renderList()
  } catch (error) {
    state.listError = 'Could not load the Pokemon list. Please try again.'
  } finally {
    state.listLoading = false
    renderListStatus()
  }
}

async function loadPokemonDetails(url) {
  state.detailsError = ''
  state.selectedUrl = url
  renderList()

  const cachedDetails = state.detailsCache.get(url)
  if (cachedDetails) {
    state.detailsLoading = false
    state.details = cachedDetails
    renderDetails()
    return
  }

  state.detailsLoading = true
  state.details = null
  renderDetails()

  try {
    const details = await fetchPokemonDetails(url)
    state.details = details
    state.detailsCache.set(url, details)
  } catch (error) {
    state.detailsError = 'Could not load Pokemon details. Please try again.'
  } finally {
    state.detailsLoading = false
    renderDetails()
  }
}

listEl.addEventListener('click', (event) => {
  const card = event.target.closest('[data-url]')
  if (!card) {
    return
  }

  const { url } = card.dataset
  if (url) {
    loadPokemonDetails(url)
  }
})

loadMoreBtn.addEventListener('click', () => {
  loadMorePokemon()
})

searchInputEl.addEventListener('input', (event) => {
  state.searchQuery = event.target.value
  renderList()
})

sortNameBtn.addEventListener('click', () => {
  if (state.sortMode === 'name') {
    state.nameSortDirection = state.nameSortDirection === 'asc' ? 'desc' : 'asc'
  } else {
    state.sortMode = 'name'
    state.nameSortDirection = 'asc'
  }

  renderList()
})

sortNumberBtn.addEventListener('click', () => {
  if (state.sortMode === 'number') {
    state.numberSortDirection =
      state.numberSortDirection === 'asc' ? 'desc' : 'asc'
  } else {
    state.sortMode = 'number'
    state.numberSortDirection = 'asc'
  }

  renderList()
})

proxyDemoBtn.addEventListener('click', async () => {
  if (state.proxyLoading) {
    return
  }

  state.proxyLoading = true
  state.proxyError = ''
  state.proxyResult = null
  renderProxyDemo()

  try {
    const data = await fetchProtectedResource(PROXY_DEMO_PATH, PROXY_DEMO_QUERY)
    state.proxyResult = data
  } catch (error) {
    state.proxyError =
      error?.message || 'Could not load protected API data.'
    state.proxyResult = error?.details || null
  } finally {
    state.proxyLoading = false
    renderProxyDemo()
  }
})

loadMorePokemon()
renderProxyDemo()
