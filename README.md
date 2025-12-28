# VibeDex Catalog

Small Vite + vanilla JavaScript app that lists Pokemon from PokeAPI with pagination and a detail panel.

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

## How it works

- Pagination uses `limit=20` and an `offset` stored in `src/main.js`. Each "Load More" click increments the offset and appends new results to the existing list.
- Chaining fetches use the `url` returned in each list item. Clicking a card triggers a details request and renders name, sprite, types, height, weight, and abilities.
