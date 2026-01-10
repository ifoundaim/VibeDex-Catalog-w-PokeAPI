# VibeDex Catalog

Small Vite + vanilla JavaScript app that lists Pokemon from PokeAPI with pagination and a detail panel.

## Install

```bash
npm install
npm --prefix server install
```

## Run

```bash
npm run dev
```

## Run client + server

```bash
# Terminal 1 (client)
npm run dev

# Terminal 2 (server)
npm --prefix server run dev
```

Or run both with one command:

```bash
npm run dev:all
```

## Server environment

Create `server/.env` from the example and fill in your upstream API details:

```bash
cp server/.env.example server/.env
```

- `PROXY_API_BASE_URL`: Base URL of the protected API (no secrets in the browser).
- `PROXY_API_KEY`: Secret key used by the proxy server.

The proxy uses `Authorization: Bearer <PROXY_API_KEY>` when calling the upstream API.
The demo button calls the path defined in `src/main.js`, so update `PROXY_DEMO_PATH` to match your API.

## How it works

- Pagination uses `limit=20` and an `offset` stored in `src/main.js`. Each "Load More" click increments the offset and appends new results to the existing list.
- Chaining fetches use the `url` returned in each list item. Clicking a card triggers a details request and renders name, sprite, types, height, weight, and abilities.
- Search and sort are client-side: the app filters and orders the in-memory list without extra API calls.
- Detail requests are cached in memory by URL so repeat clicks render instantly and avoid extra network traffic.
