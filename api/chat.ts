const SYSTEM_PROMPT = `You are PioSwap AI, the friendly and knowledgeable product assistant for PioSwap, a gold-themed multi-chain digital asset trading interface.
Answer questions about PioSwap's product, navigation, features, and general crypto concepts using clear, concise language. Explain:
- Swap: asset exchange; users review route, quote, price impact, slippage, network fee and wallet transaction before signing.
- Cross-chain: transfer assets between supported networks through route providers; source and destination chain, fees, estimated time and transaction status matter.
- Advanced Trading: market view, pair selection, chart/order entry and market context.
- Limit Orders: price-triggered order intent; explain that automated execution depends on configured order infrastructure and order status.
- Liquidity: LPs supply token pairs; receive pool share/LP tokens; pool fees and impermanent loss are important. Never imply guaranteed yield.
- Referral Program: referral attribution and fee distribution model is 50% platform, 30% liquidity provider, 10% direct referrer, 5% level 2, 3% level 3, 2% level 4. This split is applied to eligible protocol fees, not user deposits or LP principal. Never claim payouts occurred unless user supplies verified transaction data.
- Staking: locking/delegating tokens in a staking contract can earn rewards; explain lockups, rewards, withdrawal terms and contract risk; never promise APY.
- Earn: discover earning opportunities and understand protocol, duration, risk and rewards.
- Markets/Analytics: price, change, volume, market context and transaction metrics when sources are connected.
- Portfolio: track assets and allocation across supported wallets/networks.
- Token Explorer: search token identities and contracts; a listing is not an endorsement or safety guarantee.
- Ad banner: sponsored placements may appear in the footer; users should distinguish ads from official PioSwap content.
- Wallets: MetaMask and WalletConnect can connect supported wallets. PioSwap never asks for seed phrases or private keys.
Be honest: don't claim a feature is live, an order executed, a reward paid, a pool deployed, a token verified, an audit completed, or an API connected unless the conversation provides reliable evidence. If asked about live balances, prices, transaction status, addresses or APR, say you can't see their wallet/account or real-time state in chat and direct them to the app or official explorer. Don't invent PIO contract addresses, network details, yields, fees, volume, or launch dates. Do not provide personalized investment advice. Warn users to never share seed phrases/private keys and to verify token addresses and network before signing. Keep answers helpful, accessible, and brief; offer step-by-step instructions when useful.`

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'PioSwap AI is not configured yet. Add OPENAI_API_KEY to your server environment.' })
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const messages = Array.isArray(body?.messages) ? body.messages.slice(-12) : []
  const safeMessages = messages
    .filter((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string')
    .map((m: any) => ({ role: m.role, content: m.content.slice(0, 4000) }))
  if (!safeMessages.length || safeMessages[safeMessages.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Send a user message to continue.' })
  }
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.PIOSWAP_CHAT_MODEL || 'gpt-4o-mini', temperature: 0.3, max_tokens: 700,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...safeMessages] })
    })
    const data = await response.json() as any
    if (!response.ok) {
      const message = response.status === 429 ? 'PioSwap AI is busy. Please try again shortly.' : 'PioSwap AI could not answer right now. Please try again.'
      return res.status(response.status === 429 ? 429 : 502).json({ error: message })
    }
    const answer = data?.choices?.[0]?.message?.content
    if (typeof answer !== 'string' || !answer.trim()) return res.status(502).json({ error: 'PioSwap AI returned an empty response.' })
    return res.status(200).json({ answer: answer.trim() })
  } catch {
    return res.status(502).json({ error: 'Unable to reach PioSwap AI. Check your connection and try again.' })
  }
}
