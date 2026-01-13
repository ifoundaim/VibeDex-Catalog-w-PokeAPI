import { defineConfig, loadEnv } from 'vite'
import { buildUpstreamUrl, normalizeQueryValue } from './server/proxyUtils.js'

function json(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload, null, 2))
}

function createLocalProxyPlugin({ baseUrl, apiKey }) {
  return {
    name: 'vibedex-local-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', 'http://localhost')

        if (req.method !== 'GET') {
          return next()
        }

        // A self-contained demo "protected" endpoint so everything can run on localhost:5173.
        if (url.pathname === '/__demo/protected') {
          const auth = req.headers?.authorization || ''
          if (auth !== `Bearer ${apiKey}`) {
            return json(res, 401, { error: 'Unauthorized.' })
          }

          const query = Object.fromEntries(url.searchParams.entries())
          return json(res, 200, {
            ok: true,
            source: '__demo/protected',
            query
          })
        }

        if (url.pathname !== '/api/proxy') {
          return next()
        }

        const path = normalizeQueryValue(url.searchParams.getAll('path'))
        const query = normalizeQueryValue(url.searchParams.getAll('query'))

        if (!path) {
          return json(res, 400, { error: 'Missing required "path" query parameter.' })
        }

        if (path.startsWith('/api/proxy')) {
          return json(res, 400, { error: 'Refusing to proxy to /api/proxy (recursive).' })
        }

        const upstreamUrl = buildUpstreamUrl(baseUrl, path, query)

        try {
          const upstreamResponse = await fetch(upstreamUrl, {
            headers: {
              Authorization: `Bearer ${apiKey}`
            }
          })

          const contentType = upstreamResponse.headers.get('content-type') || ''
          let payload

          if (contentType.includes('application/json')) {
            payload = await upstreamResponse.json()
          } else {
            const text = await upstreamResponse.text()
            payload = { message: text }
          }

          res.statusCode = upstreamResponse.status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(payload, null, 2))
        } catch (error) {
          return json(res, 502, {
            error: 'Unable to reach upstream API.',
            details: error?.message || 'Unknown error.'
          })
        }
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const baseUrl = env.PROXY_API_BASE_URL || 'http://localhost:5173'
  const apiKey = env.PROXY_API_KEY || 'demo-key'

  return {
    plugins: [createLocalProxyPlugin({ baseUrl, apiKey })]
  }
})
