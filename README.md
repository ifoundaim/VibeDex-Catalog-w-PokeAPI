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

`npm run dev` starts both the Vite client and the proxy server.
`npm run dev:all` is an alias for the same combined workflow.

To run them separately:

```bash
# Terminal 1 (client only)
npm run dev:client

# Terminal 2 (server only)
npm run dev:server
```

## Server environment

Create `server/.env` from the example and fill in your upstream API details:

```bash
cp server/.env.example server/.env
```

- `PROXY_API_BASE_URL`: Base URL of the protected API (no secrets in the browser).
- `PROXY_API_KEY`: Secret key used by the proxy server.

The proxy uses `Authorization: Bearer <PROXY_API_KEY>` when calling the upstream API.
The demo button calls the path defined in `src/main.js`. For a self-contained demo, set
`PROXY_API_BASE_URL` to `http://localhost:5173` and keep `PROXY_DEMO_PATH` as
`/__demo/protected`.
The Vite dev server proxies `/__demo` to the local proxy server for this flow.

## How it works

- Pagination uses `limit=20` and an `offset` stored in `src/main.js`. Each "Load More" click increments the offset and appends new results to the existing list.
- Chaining fetches use the `url` returned in each list item. Clicking a card triggers a details request and renders name, sprite, types, height, weight, and abilities.
- Search and sort are client-side: the app filters and orders the in-memory list without extra API calls.
- Detail requests are cached in memory by URL so repeat clicks render instantly and avoid extra network traffic.
