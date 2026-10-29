import { useEffect, useRef, useState } from 'react'
import { Bot, MessageCircle, Send, Sparkles, X, RotateCcw, LoaderCircle } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }
const suggestions = ['What can I do on PioSwap?', 'How does the referral split work?', 'How do liquidity pools work?', 'How do I use cross-chain swap?']

export default function PioSwapChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Welcome to PioSwap. I’m your AI guide for trading, liquidity, staking, referrals, and every feature in the PioSwap ecosystem. What would you like to explore?' }])
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, busy, open])

  async function send(text = input) {
    const prompt = text.trim()
    if (!prompt || busy) return
    const next: Message[] = [...messages, { role: 'user', content: prompt }]
    setMessages(next); setInput(''); setError(''); setBusy(true)
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next.slice(-12) }) })
      const raw = await response.text()
      let data: { answer?: unknown; error?: string } = {}
      try {
        data = raw ? JSON.parse(raw) : {}
      } catch {
        throw new Error('The chat API returned an invalid response. Make sure the API server is running.')
      }
      if (!response.ok) throw new Error(data?.error || 'PioSwap AI is unavailable. Please try again.')
      setMessages(current => [...current, { role: 'assistant', content: String(data.answer || 'I couldn’t create a response. Please try again.') }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to reach PioSwap AI.')
    } finally { setBusy(false) }
  }

  return <div className="pioswap-ai-root">
    {open && <section className="pioswap-ai-panel" aria-label="PioSwap AI chat">
      <header className="pioswap-ai-head"><div className="pioswap-ai-avatar"><Sparkles size={17}/></div><div className="pioswap-ai-title"><strong>PioSwap AI</strong><span><i/> Product assistant · AI powered</span></div><button className="pioswap-ai-icon-btn" title="New chat" onClick={()=>{setMessages([{role:'assistant',content:'Welcome back. What can I help you understand about PioSwap?'}]);setError('')}}><RotateCcw size={15}/></button><button className="pioswap-ai-icon-btn" aria-label="Close chat" onClick={()=>setOpen(false)}><X size={17}/></button></header>
      <div className="pioswap-ai-messages">
        {messages.map((m,i)=><div key={i} className={`pioswap-ai-message ${m.role}`}><div className="pioswap-ai-message-icon">{m.role==='assistant'?<Bot size={14}/>:<span>You</span>}</div><div className="pioswap-ai-bubble">{m.content}</div></div>)}
        {messages.length===1&&!busy&&<div className="pioswap-ai-suggestions">{suggestions.map(s=><button key={s} onClick={()=>void send(s)}>{s}<span>↗</span></button>)}</div>}
        {busy&&<div className="pioswap-ai-typing"><LoaderCircle size={14}/> PioSwap AI is thinking…</div>}
        {error&&<div className="pioswap-ai-error">{error}<button onClick={()=>void send(messages[messages.length-1]?.content || '')}>Retry</button></div>}
        <div ref={bottomRef}/>
      </div>
      <form className="pioswap-ai-input-row" onSubmit={e=>{e.preventDefault();void send()}}><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask anything about PioSwap…" aria-label="Message PioSwap AI" maxLength={1200}/><button type="submit" disabled={!input.trim()||busy} aria-label="Send message"><Send size={16}/></button></form>
      <div className="pioswap-ai-footnote">AI can make mistakes. Never share your seed phrase or private key.</div>
    </section>}
    <button className={`pioswap-ai-launcher ${open?'opened':''}`} onClick={()=>setOpen(v=>!v)} aria-label={open?'Close PioSwap AI':'Chat with PioSwap AI'}>{open?<X size={22}/>:<><MessageCircle size={20}/><span>Ask PioSwap AI</span><Sparkles size={14}/></>}</button>
  </div>
}
