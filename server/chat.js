import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const app = express()
const port = Number(process.env.API_PORT || 3001)
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']
app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '100kb' }))

const SYSTEM_PROMPT = `You are PioSwap AI, a helpful assistant for the PioSwap decentralized exchange and ecosystem.
Answer clearly and accurately about PioSwap features, swaps, liquidity pools, referrals, staking, bridges, and general DeFi concepts.
Do not claim that a transaction has been executed, that funds are safe, or that a feature is live unless the user provides reliable context confirming it.
Never ask for or accept seed phrases, private keys, passwords, or wallet recovery codes.
Do not provide personalized financial advice. Explain risks, fees, slippage, approvals, and cross-chain considerations when relevant.
If you do not know a PioSwap-specific detail, say so instead of inventing it.`

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'PioSwap AI', provider: 'Gemini', configured: Boolean(process.env.GEMINI_API_KEY) })
})

app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is missing. Add it to .env.local and restart the server.' })
  }

  const messages = req.body?.messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Please provide a non-empty messages array.' })
  }

  const contents = messages
    .filter(message => message && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string')
    .slice(-12)
    .map(message => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content.slice(0, 8000) }],
    }))

  if (!contents.length) {
    return res.status(400).json({ error: 'No valid chat messages were provided.' })
  }

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 700 },
      }),
    })

    const raw = await upstream.text()
    let result
    try { result = raw ? JSON.parse(raw) : {} } catch { result = {} }

    if (!upstream.ok) {
      const message = result?.error?.message || `Gemini API request failed (${upstream.status}).`
      return res.status(upstream.status).json({ error: message })
    }

    const answer = result?.candidates?.[0]?.content?.parts
      ?.map(part => typeof part.text === 'string' ? part.text : '')
      .join('')
      .trim()

    if (!answer) {
      return res.status(502).json({ error: 'Gemini returned an empty response. Please try again.' })
    }
    return res.json({ answer })
  } catch (error) {
    console.error('PioSwap Gemini API error:', error)
    return res.status(502).json({ error: 'Unable to reach Gemini. Check your internet connection and try again.' })
  }
})

app.listen(port, () => {
  console.log(`PioSwap AI API server listening on http://localhost:${port}`)
})
