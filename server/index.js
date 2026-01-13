import express from 'express'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT ? Number(process.env.PORT) : 5174

const { PROXY_API_BASE_URL, PROXY_API_KEY } = process.env

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  next()
})

function normalizeQueryValue(value) {
  if (Array.isArray(value)) {
    return value[0]
  }

  if (typeof value === 'string') {
    return value
  }

  return ''
}

function buildUpstreamUrl(path, query) {
  const trimmedBase = PROXY_API_BASE_URL.replace(/\/+$/, '')
  const pathValue = path.startsWith('/') ? path : `/${path}`
  const queryValue = query ? (query.startsWith('?') ? query : `?${query}`) : ''

  return `${trimmedBase}${pathValue}${queryValue}`
}

app.get('/__demo/protected', (req, res) => {
  const authHeader = req.get('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!PROXY_API_KEY) {
    return res.status(500).json({
      error: 'Demo route missing PROXY_API_KEY.'
    })
  }

  if (token !== PROXY_API_KEY) {
    return res.status(401).json({
      error: 'Invalid or missing bearer token.'
    })
  }

  return res.json({
    ok: true,
    message: 'Protected demo payload unlocked.',
    receivedAt: new Date().toISOString()
  })
})

app.get('/api/proxy', async (req, res) => {
  if (!PROXY_API_BASE_URL) {
    return res.status(500).json({
      error: 'Proxy server is missing PROXY_API_BASE_URL.'
    })
  }

  if (!PROXY_API_KEY) {
    return res.status(401).json({
      error: 'Missing PROXY_API_KEY. Add it to server/.env and restart.'
    })
  }

  const path = normalizeQueryValue(req.query.path)
  const query = normalizeQueryValue(req.query.query)

  if (!path) {
    return res.status(400).json({
      error: 'Missing required "path" query parameter.'
    })
  }

  const upstreamUrl = buildUpstreamUrl(path, query)

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        Authorization: `Bearer ${PROXY_API_KEY}`
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

    if (!upstreamResponse.ok) {
      return res.status(upstreamResponse.status).json({
        error: 'Upstream request failed.',
        status: upstreamResponse.status,
        details: payload
      })
    }

    return res.status(upstreamResponse.status).json(payload)
  } catch (error) {
    return res.status(502).json({
      error: 'Unable to reach upstream API.',
      details: error?.message || 'Unknown error.'
    })
  }
})

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`)
})
