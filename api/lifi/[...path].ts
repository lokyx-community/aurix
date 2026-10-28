// Vercel serverless proxy for LI.FI REST API. Keep LIFI_API_KEY in Vercel
// Environment Variables (server-side only); never prefix it with VITE_.
const LIFI_ORIGIN = 'https://li.quest'
const ALLOWED_ENDPOINTS = new Set(['v1/quote', 'v1/tokens', 'v1/status', 'v1/chains', 'v1/tools'])

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rawPath = Array.isArray(req.query?.path) ? req.query.path.join('/') : String(req.query?.path || '')
  const endpoint = `v1/${rawPath.replace(/^\/+|\/+$/g, '')}`
  if (!ALLOWED_ENDPOINTS.has(endpoint)) return res.status(404).json({ error: 'LI.FI endpoint not allowed' })

  const apiKey = process.env.LIFI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Server LI.FI API key is not configured' })

  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(req.query || {})) {
    if (key === 'path' || value == null) continue
    if (Array.isArray(value)) value.forEach((v) => query.append(key, String(v)))
    else query.set(key, String(value))
  }

  try {
    const upstream = await fetch(`${LIFI_ORIGIN}/${endpoint}${query.size ? `?${query.toString()}` : ''}`, {
      method: 'GET',
      headers: { accept: 'application/json', 'x-lifi-api-key': apiKey },
    })
    const body = await upstream.text()
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(upstream.status).send(body)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'LI.FI upstream request failed'
    return res.status(502).json({ error: message })
  }
}
