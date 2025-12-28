import './style.css'
import { fetchPokemonDetails, fetchPokemonList } from './api.js'

const state = {
  limit: 20,
  offset: 0,
  items: [],
  listLoading: false,
  listError: '',
  detailsLoading: false,
  detailsError: '',
  details: null,
  selectedUrl: ''
}

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="app">
    <header class="top-bar">
      <div>
        <p class="eyebrow">VibeDex Catalog</p>
        <h1>Pokemon Catalog</h1>
        <p class="subtitle">Catch up with the latest creatures, one page at a time.</p>
      </div>
      <div class="controls">
        <div class="loaded-count" id="loaded-count">Loaded: 0</div>
        <button class="primary" id="load-more" type="button">Load More</button>
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
  </div>
`

const listEl = document.querySelector('#pokemon-list')
const listStatusEl = document.querySelector('#list-status')
const detailPanelEl = document.querySelector('#detail-panel')
const loadMoreBtn = document.querySelector('#load-more')
const loadedCountEl = document.querySelector('#loaded-count')

function renderList() {
  loadedCountEl.textContent = `Loaded: ${state.items.length}`

  listEl.innerHTML = state.items
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
  state.detailsLoading = true
  state.detailsError = ''
  state.details = null
  state.selectedUrl = url
  renderList()
  renderDetails()

  try {
    state.details = await fetchPokemonDetails(url)
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

loadMorePokemon()
