import { useEffect, useMemo, useRef, useState } from 'react'
import LifiTradeWidget from './LifiTradeWidget'
import { encodeFunctionData, decodeFunctionResult } from 'viem'
import { EVM_CHAINS, type Eip1193Provider, type LifiQuote, type ProviderToken, executeLifiQuote, fetchLifiTokens, formatUnitsSafe, getLifiQuote, isEvmChainId, parseUnitsSafe } from './integrations'
import {
  Activity, ArrowDownUp, ArrowLeftRight, ArrowRight, Bell, BookOpen, Check, ChevronDown,
  CircleHelp, Clock3, Command, Compass, Copy, ExternalLink, Eye, EyeOff, FileCheck2,
  Globe2, Grid2X2, LayoutDashboard, LineChart, LockKeyhole, Menu, MoreHorizontal,
  Plus, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Star, TrendingDown,
  TrendingUp, Wallet, X, Zap
} from 'lucide-react'

type Page = 'Overview' | 'Swap' | 'Markets' | 'Advanced Trading' | 'Limit Orders' | 'Portfolio' | 'Earn' | 'Cross-Chain' | 'Activity' | 'Token Explorer' | 'Analytics' | 'Security Center' | 'Referral Program' | 'Settings'
type Asset = { symbol: string; name: string; color: string; letter: string; logo?: string; id?: string; address?: string; decimals?: number; isNative?: boolean; price: string; change: string; positive: boolean; marketCap?: number; volume?: number; rank?: number }

const pages: { name: Page; icon: typeof LayoutDashboard; group: string }[] = [
  { name: 'Overview', icon: LayoutDashboard, group: 'TRADE' },
  { name: 'Swap', icon: ArrowLeftRight, group: 'TRADE' },
  { name: 'Markets', icon: LineChart, group: 'TRADE' },
  { name: 'Advanced Trading', icon: SlidersHorizontal, group: 'TRADE' },
  { name: 'Limit Orders', icon: Clock3, group: 'TRADE' },
  { name: 'Cross-Chain', icon: Globe2, group: 'TRADE' },
  { name: 'Portfolio', icon: Wallet, group: 'MANAGE' },
  { name: 'Earn', icon: TrendingUp, group: 'MANAGE' },
  { name: 'Activity', icon: Activity, group: 'MANAGE' },
  { name: 'Token Explorer', icon: Compass, group: 'DISCOVER' },
  { name: 'Analytics', icon: LineChart, group: 'DISCOVER' },
  { name: 'Security Center', icon: ShieldCheck, group: 'DISCOVER' },
  { name: 'Referral Program', icon: Sparkles, group: 'MANAGE' },
  { name: 'Settings', icon: Settings2, group: 'PREFERENCES' },
]
const seedAssets: Asset[] = [
  { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', letter: '₿', logo: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png', id: 'bitcoin', price: '—', change: '—', positive: true },
  { symbol: 'ETH', name: 'Ethereum', color: '#627EEA', letter: 'Ξ', logo: 'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png', id: 'ethereum', price: '—', change: '—', positive: true },
  { symbol: 'SOL', name: 'Solana', color: '#9945FF', letter: '◎', logo: 'https://coin-images.coingecko.com/coins/images/4128/large/solana.png', id: 'solana', price: '—', change: '—', positive: true },
  { symbol: 'USDC', name: 'USDC', color: '#2775CA', letter: '$', logo: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png', id: 'usd-coin', price: '—', change: '—', positive: true },
  { symbol: 'BNB', name: 'BNB', color: '#F0B90B', letter: '◆', logo: 'https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', id: 'binancecoin', price: '—', change: '—', positive: true },
  { symbol: 'XRP', name: 'XRP', color: '#23292F', letter: 'X', logo: 'https://coin-images.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', id: 'ripple', price: '—', change: '—', positive: true },
  { symbol: 'DOGE', name: 'Dogecoin', color: '#C2A633', letter: 'Ð', logo: 'https://coin-images.coingecko.com/coins/images/5/large/dogecoin.png', id: 'dogecoin', price: '—', change: '—', positive: true },
  { symbol: 'ADA', name: 'Cardano', color: '#0033AD', letter: 'A', logo: 'https://coin-images.coingecko.com/coins/images/975/large/cardano.png', id: 'cardano', price: '—', change: '—', positive: true },
  { symbol: 'AVAX', name: 'Avalanche', color: '#E84142', letter: 'A', logo: 'https://coin-images.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png', id: 'avalanche-2', price: '—', change: '—', positive: true },
  { symbol: 'LINK', name: 'Chainlink', color: '#2A5ADA', letter: '⬡', logo: 'https://coin-images.coingecko.com/coins/images/877/large/chainlink-new-logo.png', id: 'chainlink', price: '—', change: '—', positive: true },
  { symbol: 'USDT', name: 'Tether', color: '#26A17B', letter: '₮', logo: 'https://coin-images.coingecko.com/coins/images/325/large/Tether.png', id: 'tether', price: '—', change: '—', positive: true },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', color: '#F09242', letter: '₿', logo: 'https://coin-images.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png', id: 'wrapped-bitcoin', price: '—', change: '—', positive: true },
  { symbol: 'UNI', name: 'Uniswap', color: '#FF007A', letter: '🦄', logo: 'https://coin-images.coingecko.com/coins/images/12504/large/uni.jpg', id: 'uniswap', price: '—', change: '—', positive: true },
  { symbol: 'ARB', name: 'Arbitrum', color: '#28A0F0', letter: 'A', logo: 'https://coin-images.coingecko.com/coins/images/16547/large/arb.jpg', id: 'arbitrum', price: '—', change: '—', positive: true },
  { symbol: 'OP', name: 'Optimism', color: '#FF0420', letter: 'O', logo: 'https://coin-images.coingecko.com/coins/images/25244/large/Optimism.png', id: 'optimism', price: '—', change: '—', positive: true },
  { symbol: 'POL', name: 'POL', color: '#8247E5', letter: 'P', logo: 'https://coin-images.coingecko.com/coins/images/4713/large/polygon.png', id: 'matic-network', price: '—', change: '—', positive: true },
  { symbol: 'CAKE', name: 'PancakeSwap', color: '#D1884F', letter: '🥞', logo: 'https://coin-images.coingecko.com/coins/images/12632/large/pancakeswap-cake.png', id: 'pancakeswap-token', price: '—', change: '—', positive: true },
  { symbol: 'AERO', name: 'Aerodrome Finance', color: '#0052FF', letter: 'A', logo: 'https://coin-images.coingecko.com/coins/images/31745/large/token.png', id: 'aerodrome-finance', price: '—', change: '—', positive: true },
  { symbol: 'JUP', name: 'Jupiter', color: '#C7F284', letter: 'J', logo: 'https://coin-images.coingecko.com/coins/images/34188/large/jup.png', id: 'jupiter-exchange-solana', price: '—', change: '—', positive: true },
  { symbol: 'PIO', name: 'PIO Gold', color: '#D6AD4B', letter: 'P', price: 'Not listed', change: 'Unverified', positive: true },
]
const formatUsd = (n: number) => n >= 1000 ? n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}) : n >= 1 ? n.toLocaleString('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:4}) : n.toLocaleString('en-US',{style:'currency',currency:'USD',minimumFractionDigits:4,maximumFractionDigits:8})
const formatCompactUsd = (n?: number) => n == null ? '—' : n >= 1e12 ? `$${(n/1e12).toFixed(2)}T` : n >= 1e9 ? `$${(n/1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n/1e6).toFixed(2)}M` : formatUsd(n)

const fmtAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

function ParticleRibbon() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let frame = 0
    let raf = 0
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const draw = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)
      const t = reduced ? 0.4 : frame * 0.007
      // A quiet flowing ribbon made from fine gold particle paths; no external asset needed.
      for (let strand = 0; strand < 25; strand++) {
        ctx.beginPath()
        for (let i = 0; i <= 110; i++) {
          const u = i / 110
          const x = w * (0.04 + u * 0.93)
          const wave = Math.sin(u * 7.1 + t + strand * 0.22) * h * 0.12
          const curl = Math.sin(u * 3.6 - t * 0.62) * h * 0.13
          const y = h * (0.52 + (u - 0.5) * 0.14) + wave + curl + (strand - 2.5) * 4
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(${strand % 4 === 0 ? '255,224,142' : strand % 3 === 0 ? '226,177,64' : '190,132,28'},${0.12 + (strand % 7) * 0.025})`
        ctx.lineWidth = strand % 5 === 0 ? 3.4 : strand % 2 === 0 ? 2.1 : 1.35
        ctx.stroke()
      }
      for (let i = 0; i < 340; i++) {
        const u = ((i / 105) + t * 0.018) % 1
        const x = w * (0.05 + u * 0.9)
        const y = h * (0.5 + Math.sin(u * 7.1 + t) * 0.12 + Math.sin(u * 3.6 - t * 0.62) * 0.13)
        const size = 0.5 + (i % 4) * 0.32
        const alpha = 0.16 + (Math.sin(i * 2.31 + t) + 1) * 0.16
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(207,157,49,${Math.min(0.78, alpha + 0.12)})`; ctx.fill()
      }
      frame++
      if (!reduced) raf = requestAnimationFrame(draw)
    }
    draw()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    return () => { cancelAnimationFrame(raf); observer.disconnect() }
  }, [])
  return <canvas className="particle-ribbon" ref={canvasRef} aria-hidden="true" />
}

function Brand() {
  return <div className="brand" aria-label="PioSwap">
    <img className="brand-coin" src="/pioswap-gold-coin-transparent.png" alt="" aria-hidden="true" />
    <span className="brand-name">Pio<span className="brand-light">Swap</span></span>
  </div>
}

function App() {
  const [page, setPage] = useState<Page>('Overview')
  const [mobileNav, setMobileNav] = useState(false)
  const [wallet, setWallet] = useState('')
  const [walletBusy, setWalletBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [query, setQuery] = useState('')
  const [fromAsset, setFromAsset] = useState('ETH')
  const [toAsset, setToAsset] = useState('PIO')
  const [amount, setAmount] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [theme, setTheme] = useState<'dark'|'light'>('dark')
  const [watchlist, setWatchlist] = useState<string[]>(['ETH', 'BTC', 'SOL'])
  const [activeTab, setActiveTab] = useState('All')
  const [showAllAssets, setShowAllAssets] = useState(false)
  const [settings, setSettings] = useState({ alerts: true, slippage: '0.50', compact: false })
  const [marketAssets, setMarketAssets] = useState<Asset[]>(seedAssets)
  const [marketStatus, setMarketStatus] = useState<'loading'|'live'|'error'>('loading')
  const [marketUpdated, setMarketUpdated] = useState('')
  const [modal, setModal] = useState<'connect'|'quote'|'none'>('none')

  useEffect(() => {
    const savedTheme = localStorage.getItem('pioswap-theme')
    if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme)
    const savedWatch = localStorage.getItem('pioswap-watchlist')
    if (savedWatch) { try { setWatchlist(JSON.parse(savedWatch)) } catch { /* ignore invalid local preference */ } }
    const savedSettings = localStorage.getItem('pioswap-settings')
    if (savedSettings) { try { setSettings({ alerts: true, slippage: '0.50', compact: false, ...JSON.parse(savedSettings) }) } catch { /* ignore invalid local preference */ } }
    const provider = (window as Window & { ethereum?: { request: (args: {method:string}) => Promise<unknown>; on?: (event:string, callback:(value:unknown)=>void)=>void; removeListener?: (event:string, callback:(value:unknown)=>void)=>void } }).ethereum
    if (!provider) return
    const onAccountsChanged = (value: unknown) => {
      const accounts = Array.isArray(value) ? value as string[] : []
      setWallet(accounts[0] || '')
      if (!accounts[0]) setToast('Wallet disconnected from this site.')
    }
    provider.on?.('accountsChanged', onAccountsChanged)
    void provider.request({ method: 'eth_accounts' }).then(value => {
      if (Array.isArray(value) && typeof value[0] === 'string') setWallet(value[0])
    }).catch(() => undefined)
    return () => provider.removeListener?.('accountsChanged', onAccountsChanged)
  }, [])
  useEffect(() => {
    let cancelled = false
    const loadMarkets = async () => {
      try {
        setMarketStatus('loading')
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h', { headers: { accept: 'application/json' } })
        if (!response.ok) throw new Error(`Market data returned ${response.status}`)
        const data = await response.json() as Array<{id:string;symbol:string;name:string;image:string;current_price:number;price_change_percentage_24h:number|null;market_cap:number;total_volume:number;market_cap_rank:number}>
        if (cancelled) return
        const mapped: Asset[] = data.map((coin) => ({ symbol: coin.symbol.toUpperCase(), name: coin.name, color: '#C6A45A', letter: coin.symbol.slice(0,1).toUpperCase(), logo: coin.image, id: coin.id, price: formatUsd(coin.current_price), change: coin.price_change_percentage_24h == null ? '—' : `${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h.toFixed(2)}%`, positive: (coin.price_change_percentage_24h ?? 0) >= 0, marketCap: coin.market_cap, volume: coin.total_volume, rank: coin.market_cap_rank }))
        const pio = seedAssets.find(a => a.symbol === 'PIO')!
        const merged = [...mapped]
        for (const important of seedAssets.filter(a => ['USDC','USDT','WBTC','UNI','ARB','OP','POL','CAKE','AERO','JUP'].includes(a.symbol))) if (!merged.some(a => a.symbol === important.symbol)) merged.push(important)
        merged.push(pio)
        setMarketAssets(merged)
        setMarketUpdated(new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}))
        setMarketStatus('live')
      } catch {
        if (!cancelled) { setMarketStatus('error'); setMarketAssets(seedAssets) }
      }
    }
    void loadMarkets()
    const interval = window.setInterval(loadMarkets, 120000)
    return () => { cancelled = true; window.clearInterval(interval) }
  }, [])
  useEffect(() => { localStorage.setItem('pioswap-theme', theme) }, [theme])
  useEffect(() => { localStorage.setItem('pioswap-watchlist', JSON.stringify(watchlist)) }, [watchlist])
  useEffect(() => { localStorage.setItem('pioswap-settings', JSON.stringify(settings)) }, [settings])
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(''), 3400)
    return () => window.clearTimeout(id)
  }, [toast])

  const filteredAssets = useMemo(() => marketAssets.filter(a => `${a.symbol} ${a.name}`.toLowerCase().includes(query.toLowerCase())), [query, marketAssets])
  const notify = (msg: string) => setToast(msg)
  async function connectWallet() {
    const eth = (window as Window & { ethereum?: { request: (args: {method:string}) => Promise<string[]> } }).ethereum
    if (!eth) { notify('No injected wallet detected. Install MetaMask or a compatible wallet.'); return }
    setWalletBusy(true)
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' })
      if (accounts?.[0]) { setWallet(accounts[0]); setModal('none'); notify('Wallet connected.') }
      else notify('No wallet account was returned.')
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Wallet connection was cancelled.')
    } finally { setWalletBusy(false) }
  }
  function toggleWatch(symbol: string) {
    setWatchlist(prev => prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol])
  }
  function doSwapPreview() {
    if (!wallet) { setModal('connect'); return }
    if (!amount || Number(amount) <= 0) { notify('Enter an amount greater than zero.'); return }
    setModal('quote')
  }
  const navTo = (p: Page) => { setPage(p); setMobileNav(false); setSearchOpen(false) }
  const masked = privacy ? '••••••' : '$ —'

  return <div className={`app theme-${theme}`}>
    <style>{`
      /* PioSwap polished gold identity and tactile button finish */
      .app .brand { display: inline-flex; align-items: center; gap: 10px; }
      .app .brand-coin { display: block; width: 42px; height: 42px; object-fit: contain; flex: 0 0 auto; filter: drop-shadow(0 2px 1px rgba(31, 19, 0, .42)) drop-shadow(0 0 7px rgba(235, 181, 51, .16)); }
      .app .brand-name { letter-spacing: -.045em; font-weight: 750; }
      .app .brand-light { color: #d5ad50; }
      .app .primary-button, .app .connect-button {
        color: #2c1c02 !important;
        border: 1px solid #fff0a5 !important;
        background: linear-gradient(180deg, #fff9ce 0%, #ffe98a 10%, #f8d04c 27%, #dba629 53%, #b97a0d 78%, #8e5a08 100%) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.96), inset 0 2px 5px rgba(255,255,255,.34), inset 0 -3px 0 rgba(105,65,0,.35), 0 4px 0 #76500d, 0 6px 14px rgba(0,0,0,.24), 0 0 18px rgba(241,190,57,.13) !important;
        text-shadow: 0 1px 0 rgba(255,255,255,.38);
        transform: translateY(0);
        transition: transform .16s ease, filter .16s ease, box-shadow .16s ease;
      }
      .app .primary-button:hover:not(:disabled), .app .connect-button:hover:not(:disabled) {
        filter: brightness(1.08) saturate(1.08);
        transform: translateY(-2px);
        box-shadow: inset 0 1px 0 rgba(255,255,255,1), inset 0 2px 6px rgba(255,255,255,.42), inset 0 -3px 0 rgba(105,65,0,.3), 0 6px 0 #76500d, 0 9px 18px rgba(0,0,0,.27), 0 0 24px rgba(241,190,57,.22) !important;
      }
      .app .primary-button:active:not(:disabled), .app .connect-button:active:not(:disabled) {
        transform: translateY(3px);
        box-shadow: inset 0 2px 5px rgba(95,58,0,.35), 0 1px 0 #76500d, 0 2px 5px rgba(0,0,0,.2) !important;
      }
      .app .primary-button:disabled, .app .connect-button:disabled { opacity: .62; cursor: not-allowed; }
      .app .secondary-button {
        color: var(--text, inherit);
        border: 1px solid rgba(218,174,72,.65) !important;
        background: linear-gradient(180deg, rgba(255,248,210,.13) 0%, rgba(215,164,45,.09) 45%, rgba(116,77,12,.12) 100%) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.24), inset 0 -2px 0 rgba(110,76,16,.2), 0 3px 0 rgba(119,83,20,.48), 0 5px 11px rgba(0,0,0,.12) !important;
        transform: translateY(0);
        transition: transform .16s ease, filter .16s ease, box-shadow .16s ease;
      }
      .app .secondary-button:hover:not(:disabled) { filter: brightness(1.12); transform: translateY(-1px); box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 4px 0 rgba(119,83,20,.48), 0 7px 14px rgba(0,0,0,.16) !important; }
      .app .secondary-button:active:not(:disabled) { transform: translateY(2px); box-shadow: inset 0 2px 4px rgba(0,0,0,.18), 0 1px 0 rgba(119,83,20,.48) !important; }
      .app .round-icon { border-color: rgba(226,184,76,.7) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.3), 0 3px 0 rgba(118,80,13,.55), 0 5px 10px rgba(0,0,0,.14) !important; }
      .app .brand-button { padding: 0; }
      @media (max-width: 640px) { .app .brand-coin { width: 35px; height: 35px; } .app .brand { gap: 7px; } }
      @media (prefers-reduced-motion: reduce) { .app .primary-button, .app .connect-button, .app .secondary-button { transition: none; } }
    `}</style>
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <header className="topbar">
      <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <X/> : <Menu/>}</button>
      <button className="brand-button" onClick={() => navTo('Overview')}><Brand /></button>
      <div className="top-nav">
        <button className={page === 'Swap' ? 'top-link selected' : 'top-link'} onClick={() => navTo('Swap')}>Trade</button>
        <button className={page === 'Markets' ? 'top-link selected' : 'top-link'} onClick={() => navTo('Markets')}>Markets</button>
        <button className={page === 'Cross-Chain' ? 'top-link selected' : 'top-link'} onClick={() => navTo('Cross-Chain')}>Cross-chain</button>
        <button className={page === 'Portfolio' ? 'top-link selected' : 'top-link'} onClick={() => navTo('Portfolio')}>Portfolio</button>
      </div>
      <div className="top-actions">
        <button className="icon-button" title="Search" onClick={() => setSearchOpen(!searchOpen)}><Search size={18}/></button>
        <button className="icon-button theme-toggle" title="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☼' : '◐'}</button>
        <button className="connect-button" onClick={() => wallet ? notify(`Connected: ${fmtAddress(wallet)}`) : setModal('connect')}>{wallet ? <><span className="online-dot"/> {fmtAddress(wallet)}</> : <><Wallet size={16}/> Connect wallet</>}</button>
      </div>
    </header>

    {searchOpen && <div className="search-popover"><Search size={17}/><input autoFocus placeholder="Search tokens or pages…" value={query} onChange={e => setQuery(e.target.value)}/><button className="icon-button" onClick={() => {setSearchOpen(false);setQuery('')}}><X size={16}/></button><div className="search-results">{filteredAssets.slice(0,5).map(a=><button key={a.symbol} onClick={()=>{navTo('Token Explorer');setQuery(a.symbol)}}><AssetIcon asset={a}/><span>{a.name}<small>{a.symbol}</small></span><ArrowRight size={15}/></button>)}</div></div>}

    <div className="layout">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="sidebar-network"><span className="network-dot"/> Multi-chain workspace <ChevronDown size={14}/></div>
        {['TRADE','MANAGE','DISCOVER','PREFERENCES'].map(group => <div className="nav-group" key={group}>
          <div className="nav-label">{group}</div>
          {pages.filter(p=>p.group===group).map(item => <button key={item.name} className={`nav-item ${page===item.name?'active':''}`} onClick={()=>navTo(item.name)}><item.icon size={17} strokeWidth={1.7}/><span>{item.name}</span>{item.name==='Security Center' && <span className="nav-count">!</span>}</button>)}
        </div>)}
        <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><strong>Need a hand?</strong><p>Explore guides to trading safely.</p><button onClick={()=>notify('Help center is not connected yet.')}>Visit help center <ArrowRight size={13}/></button></div><div className="version">PIOSWAP PREVIEW <span>·</span> 0.1.0</div></div>
      </aside>

      <main className="main">
        {page === 'Overview' && <Overview onNavigate={navTo} wallet={wallet} privacy={privacy} setPrivacy={setPrivacy} watchlist={watchlist} toggleWatch={toggleWatch} notify={notify} assets={marketAssets} marketStatus={marketStatus} marketUpdated={marketUpdated} />}
        {page === 'Swap' && <Swap theme={theme} assets={marketAssets} fromAsset={fromAsset} toAsset={toAsset} setFromAsset={setFromAsset} setToAsset={setToAsset} amount={amount} setAmount={setAmount} wallet={wallet} onConnect={()=>setModal('connect')} onPreview={doSwapPreview} notify={notify} />}
        {page === 'Markets' && <Markets query={query} setQuery={setQuery} assets={filteredAssets} watchlist={watchlist} toggleWatch={toggleWatch} marketStatus={marketStatus} marketUpdated={marketUpdated} onSelect={() => navTo('Token Explorer')} />}
        {page === 'Advanced Trading' && <AdvancedTrading notify={notify}/>}
        {page === 'Limit Orders' && <Unavailable title="Limit orders" eyebrow="ADVANCED TRADING" description="Limit orders require a real execution or monitoring mechanism. No simulated orders will be shown as active." />}
        {page === 'Cross-Chain' && <CrossChain theme={theme} assets={marketAssets} wallet={wallet} onConnect={()=>setModal('connect')} notify={notify}/>}
        {page === 'Portfolio' && <Portfolio privacy={privacy} setPrivacy={setPrivacy} wallet={wallet} assets={marketAssets} onConnect={()=>setModal('connect')}/>}
        {page === 'Earn' && <Unavailable title="Earn, with clarity." eyebrow="EARN" description="Yield products will appear only when a supported protocol, current rate source, fees, lockups, and risk disclosures are configured." />}
        {page === 'Activity' && <ActivityPage wallet={wallet}/>}
        {page === 'Token Explorer' && <TokenExplorer assets={filteredAssets} query={query} setQuery={setQuery} />}
        {page === 'Analytics' && <Analytics/>}
        {page === 'Security Center' && <SecurityCenter/>}
        {page === 'Referral Program' && <ReferralProgram wallet={wallet} notify={notify}/>}
        {page === 'Settings' && <SettingsPage theme={theme} setTheme={setTheme} settings={settings} setSettings={setSettings} notify={notify}/>}
      </main>
    </div>

    <nav className="mobile-bottom-nav" aria-label="Main navigation">
      {[{n:'Overview' as Page,i:LayoutDashboard},{n:'Swap' as Page,i:ArrowLeftRight},{n:'Markets' as Page,i:LineChart},{n:'Portfolio' as Page,i:Wallet},{n:'Activity' as Page,i:Activity},{n:'Referral Program' as Page,i:Sparkles}].map(it=><button key={it.n} className={page===it.n?'active':''} onClick={()=>navTo(it.n)}><it.i size={19}/><span>{it.n==='Overview'?'Home':it.n==='Referral Program'?'Refer':it.n}</span></button>)}
    </nav>

    {toast && <div className="toast"><Check size={16}/>{toast}<button onClick={()=>setToast('')}><X size={14}/></button></div>}
    {modal !== 'none' && <div className="modal-backdrop" onClick={()=>setModal('none')}><div className="modal" onClick={e=>e.stopPropagation()}>
      <button className="modal-close icon-button" onClick={()=>setModal('none')}><X size={18}/></button>
      {modal==='connect' ? <><div className="modal-symbol"><Wallet size={24}/></div><h2>Connect your wallet</h2><p>Connect a self-custody wallet to view its public address. PioSwap will never ask for your recovery phrase.</p><button className="primary-button full" disabled={walletBusy} onClick={connectWallet}>{walletBusy?'Connecting…':'Connect browser wallet'} <ArrowRight size={16}/></button><div className="modal-note"><LockKeyhole size={14}/> Connection only. Trading is not enabled in this preview.</div></> :
      <><div className="modal-symbol"><ShieldCheck size={24}/></div><h2>Execution not configured</h2><p>This preview does not have a verified PIO contract, swap provider, chain configuration, or transaction preflight. No transaction will be submitted.</p><button className="primary-button full" onClick={()=>setModal('none')}>Got it <Check size={16}/></button></>}
    </div></div>}
    <footer className="footer"><span>© 2026 PioSwap</span><span>Market data by CoinGecko · Built for clarity, not noise.</span><span className="preview-label"><span/> Preview build · trading disabled</span></footer>
  </div>
}

function AssetIcon({ asset, size='md' }: {asset: Asset; size?: 'md'|'sm'}) {
  return <span className={`asset-icon ${size} ${asset.logo ? 'has-logo' : 'logo-pending'}`} style={{'--asset-color':asset.color} as React.CSSProperties}>{asset.logo ? <img src={asset.logo} alt={`${asset.name} logo`} loading="lazy" onError={e=>{e.currentTarget.style.display='none';e.currentTarget.parentElement?.classList.add('logo-fallback')}}/> : null}<span className="asset-letter">{asset.letter}</span></span>
}
function PageHeader({ eyebrow, title, description, right }: {eyebrow:string;title:string;description?:string;right?:React.ReactNode}) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description&&<p>{description}</p>}</div>{right&&<div className="page-header-right">{right}</div>}</div>
}
function Overview({onNavigate,wallet,privacy,setPrivacy,watchlist,toggleWatch,notify,assets:liveAssets,marketStatus,marketUpdated}:{onNavigate:(p:Page)=>void;wallet:string;privacy:boolean;setPrivacy:(b:boolean)=>void;watchlist:string[];toggleWatch:(s:string)=>void;notify:(s:string)=>void;assets:Asset[];marketStatus:'loading'|'live'|'error';marketUpdated:string}) {
  const [marketTab,setMarketTab] = useState('Watchlist')
  const shown = liveAssets.filter(a=>marketTab==='Watchlist'?watchlist.includes(a.symbol):marketTab==='All'?true:a.positive).slice(0,8)
  return <div className="page-content">
    <div className="hero">
      <ParticleRibbon/>
      <div className="hero-content">
        <div className="hero-kicker"><span className="kicker-dot"/> A MORE CONSIDERED WAY TO TRADE</div>
        <h1>Move with<br/><em>intention.</em></h1>
        <p>One clear view of your assets. Thoughtful routes across chains. Every cost in the open.</p>
        <div className="hero-actions"><button className="primary-button" onClick={()=>onNavigate('Swap')}>Start swapping <ArrowRight size={16}/></button><button className="text-button" onClick={()=>onNavigate('Markets')}>Explore markets <ArrowRight size={15}/></button></div>
        <div className="hero-footnote"><span className="mini-lock"><ShieldCheck size={13}/></span> Self-custody by design <span className="dot-separator">·</span> No seed phrase collection</div>
      </div>
      <div className="hero-side-note"><span>01 / TRADE WITH CLARITY</span><span className="vertical-line"/></div>
    </div>
    <div className="status-strip"><div className="status-item"><span className="status-indicator muted"/> PIO token <strong>Awaiting verification</strong></div><div className="status-item"><span className="status-indicator"/> Wallet status <strong>{wallet?'Connected':'Not connected'}</strong></div><div className="status-item"><span className={`status-indicator ${marketStatus==='live'?'':'muted'}`}/> Market data <strong>{marketStatus==='live'?'Live feed':marketStatus==='loading'?'Loading':'Unavailable'}</strong></div></div>
    <div className="section-heading"><div><div className="eyebrow">YOUR OVERVIEW</div><h2>A little more clarity.</h2></div><button className="icon-button" onClick={()=>setPrivacy(!privacy)} title={privacy?'Show balances':'Hide balances'}>{privacy?<Eye size={17}/>:<EyeOff size={17}/>}</button></div>
    <div className="overview-grid">
      <div className="panel portfolio-card"><div className="panel-top"><span className="muted-label">TOTAL PORTFOLIO VALUE</span><span className="pill neutral">Wallet {wallet?'connected':'not connected'}</span></div><div className="portfolio-value">{privacy?'••••••':'— — —'}</div><div className="portfolio-sub">{wallet?'Live valuation provider not configured':'Connect your wallet to begin'}</div><div className="mini-chart"><svg viewBox="0 0 600 82" preserveAspectRatio="none" aria-label="No portfolio history available"><path d="M0 70 L600 70" stroke="currentColor" strokeOpacity=".1" fill="none" strokeDasharray="4 5"/><text x="300" y="45" textAnchor="middle" fill="currentColor" opacity=".48" fontSize="12">Portfolio history will appear here</text></svg></div><div className="portfolio-bottom"><span>Performance</span><span className="muted-text">Unavailable without historical data</span></div><button className="secondary-button full" onClick={()=>onNavigate('Portfolio')}>View portfolio <ArrowRight size={15}/></button></div>
      <div className="panel quick-swap"><div className="panel-heading"><div><div className="eyebrow">QUICK ACTION</div><h3>Swap, simply.</h3></div><button className="icon-button" onClick={()=>onNavigate('Swap')}><ArrowUpDownIcon/></button></div><div className="quick-swap-field"><span>You pay</span><strong>Enter amount</strong><span className="field-token"><span className="token-mini">Ξ</span> ETH <ChevronDown size={13}/></span></div><div className="swap-mid"><span><ArrowDownUp size={15}/></span></div><div className="quick-swap-field second"><span>You receive</span><strong>—</strong><span className="field-token"><span className="token-mini pio">P</span> PIO <ChevronDown size={13}/></span></div><div className="quote-hint"><ShieldCheck size={14}/> Quote and token verification required</div><button className="primary-button full" onClick={()=>onNavigate('Swap')}>Open swap <ArrowRight size={15}/></button></div>
    </div>
    <div className="section-heading market-section-head"><div><div className="eyebrow">MARKET WATCH</div><h2>Markets in focus.</h2></div><button className="text-button" onClick={()=>onNavigate('Markets')}>View all markets <ArrowRight size={15}/></button></div>
    <div className="panel market-panel"><div className="table-tabs">{['Watchlist','All','Gainers'].map(t=><button key={t} className={marketTab===t?'active':''} onClick={()=>setMarketTab(t)}>{t}</button>)}</div><AssetTable rows={shown} watchlist={watchlist} toggleWatch={toggleWatch} onSelect={()=>onNavigate('Token Explorer')}/><div className="data-note"><span className={`status-indicator ${marketStatus==='live'?'':'muted'}`}/> {marketStatus==='live'?`Live market data via CoinGecko · refreshed ${marketUpdated}. PIO is not listed in this feed.`:marketStatus==='loading'?'Loading live market data…':'Live market data is temporarily unavailable or rate-limited. Values are not being fabricated.'} {marketStatus==='error'&&<button className="text-button" onClick={()=>window.location.reload()}>Retry</button>}</div></div>
    <div className="feature-row"><button className="feature-card" onClick={()=>onNavigate('Cross-Chain')}><div className="feature-icon"><Globe2 size={19}/></div><span className="feature-title">Across chains</span><span className="feature-desc">Compare routes before you move.</span><ArrowRight size={16}/></button><button className="feature-card" onClick={()=>onNavigate('Security Center')}><div className="feature-icon"><ShieldCheck size={19}/></div><span className="feature-title">Know before you sign</span><span className="feature-desc">Preflight checks, not guesswork.</span><ArrowRight size={16}/></button><button className="feature-card" onClick={()=>onNavigate('Activity')}><div className="feature-icon"><Activity size={19}/></div><span className="feature-title">Every step, visible</span><span className="feature-desc">Follow transactions from start to finish.</span><ArrowRight size={16}/></button></div>
  </div>
}
function ArrowUpDownIcon(){return <ArrowDownUp size={16}/>}
function AssetTable({rows,watchlist,toggleWatch,onSelect}:{rows:Asset[];watchlist:string[];toggleWatch:(s:string)=>void;onSelect:()=>void}) {
  return <div className="table-wrap"><table className="asset-table"><thead><tr><th>Asset</th><th>Price</th><th>24h change</th><th className="right market-cap-col">Market cap</th><th className="right">Watch</th></tr></thead><tbody>{rows.map((a,i)=><tr key={`${a.id ?? a.symbol}-${i}`} onClick={onSelect}><td><div className="asset-cell"><AssetIcon asset={a}/><span><strong>{a.name}</strong><small>{a.symbol}{a.symbol==='PIO'?' · Unverified':''}</small></span></div></td><td className={a.symbol==='PIO'?'muted-text':'mono'}>{a.price}</td><td><span className={`change ${a.positive?'positive':'negative'}`}>{a.symbol==='PIO'?'—':a.change}</span></td><td className="right mono market-cap-col">{a.symbol==='PIO'?'—':formatCompactUsd(a.marketCap)}</td><td className="right"><button className={`star-button ${watchlist.includes(a.symbol)?'starred':''}`} aria-label={`Toggle ${a.symbol} watchlist`} onClick={e=>{e.stopPropagation();toggleWatch(a.symbol)}}><Star size={16} fill={watchlist.includes(a.symbol)?'currentColor':'none'}/></button></td></tr>)}</tbody></table></div>
}
const chainMeta: Record<string,{logo:string;type:'ready'|'soon';native:string;chainId?:number}> = {
  'Ethereum':{logo:'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',type:'ready',native:'ETH',chainId:1},
  'Arbitrum':{logo:'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',type:'ready',native:'ETH',chainId:42161},
  'Base':{logo:'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png',type:'ready',native:'ETH',chainId:8453},
  'Optimism':{logo:'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',type:'ready',native:'ETH',chainId:10},
  'Polygon':{logo:'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',type:'ready',native:'POL',chainId:137},
  'BNB Chain':{logo:'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',type:'ready',native:'BNB',chainId:56},
  'Avalanche':{logo:'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',type:'ready',native:'AVAX',chainId:43114},
  'Solana':{logo:'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',type:'ready',native:'SOL',chainId:1151111081099710},
  'TRON':{logo:'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',type:'ready',native:'TRX',chainId:728126428},
  'Bitcoin':{logo:'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png',type:'ready',native:'BTC',chainId:20000000000001},
  'Sui':{logo:'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sui/info/logo.png',type:'ready',native:'SUI',chainId:9270000000000000},
  'Stellar':{logo:'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/stellar/info/logo.png',type:'ready',native:'XLM',chainId:1201081091099710},
  'Linea':{logo:'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/linea/info/logo.png',type:'ready',native:'ETH',chainId:59144},
  'zkSync Era':{logo:'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/zksync/info/logo.png',type:'ready',native:'ETH',chainId:324},
  'Scroll':{logo:'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/scroll/info/logo.png',type:'ready',native:'ETH',chainId:534352},
  'Gnosis':{logo:'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/xdai/info/logo.png',type:'ready',native:'xDAI',chainId:100},
  'Celo':{logo:'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/celo/info/logo.png',type:'ready',native:'CELO',chainId:42220},
  'Mantle':{logo:'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/mantle/info/logo.png',type:'ready',native:'MNT',chainId:5000},
  'Fantom':{logo:'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/fantom/info/logo.png',type:'ready',native:'FTM',chainId:250},
  'Cronos':{logo:'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cronos/info/logo.png',type:'ready',native:'CRO',chainId:25},
  'TON':{logo:'https://coin-images.coingecko.com/coins/images/17980/large/ton_symbol.png',type:'soon',native:'TON'}
}
function ChainPicker({value,onChange,label}:{value:string;onChange:(v:string)=>void;label:string}) {
 const [open,setOpen]=useState(false); const [query,setQuery]=useState('')
 const options=Object.keys(chainMeta).filter(n=>n.toLowerCase().includes(query.toLowerCase()))
 const meta=chainMeta[value] || chainMeta.Ethereum
 return <div className="chain-picker-wrap"><span className="chain-picker-label">{label}</span><button type="button" className={`chain-picker-trigger ${open?'is-open':''}`} aria-expanded={open} onClick={()=>{setOpen(!open);setQuery('')}}><img src={meta.logo} alt="" onError={e=>{e.currentTarget.style.visibility='hidden'}}/><span className="chain-picker-current"><strong>{value}</strong><small>{meta.type!=='ready'?'Coming soon':isEvmChainId(meta.chainId ?? 0)?'EVM network':'Multi-wallet route'}</small></span><ChevronDown size={16}/></button>{open&&<><button className="picker-scrim" aria-label="Close network selector" onClick={()=>setOpen(false)}/><div className="chain-picker-menu"><div className="chain-menu-title">Choose network <button type="button" className="icon-button" onClick={()=>setOpen(false)}><X size={15}/></button></div><div className="chain-menu-search"><Search size={15}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search networks"/></div><div className="chain-menu-list">{options.map(name=>{const item=chainMeta[name];return <button type="button" key={name} disabled={item.type==='soon'} className={`chain-menu-option ${name===value?'selected':''} ${item.type==='soon'?'coming-soon':''}`} onClick={()=>{if(item.type==='ready'){onChange(name);setOpen(false)}}}><img src={item.logo} alt="" onError={e=>{e.currentTarget.style.visibility='hidden'}}/><span><strong>{name}</strong><small>{item.type==='ready'?`Native asset · ${item.native}`:'Coming soon'}</small></span>{item.type==='soon'?<em>Coming soon</em>:name===value?<Check size={16}/>:null}</button>})}</div></div></>}</div>
}

const sanitizeAmount = (value: string) => {
  const clean = value.replace(/[^0-9.]/g, '')
  const [whole = '', ...parts] = clean.split('.')
  return parts.length ? `${whole}.${parts.join('')}` : whole
}

function providerTokenToAsset(token: ProviderToken): Asset {
  const parsedPrice = token.priceUSD == null ? NaN : Number(token.priceUSD)
  return {
    symbol: token.symbol.toUpperCase(), name: token.name, color: '#C6A45A', letter: token.symbol.slice(0, 1).toUpperCase(),
    logo: token.logoURI, id: token.address, address: token.address, decimals: token.decimals, isNative: token.isNative,
    price: Number.isFinite(parsedPrice) ? formatUsd(parsedPrice) : '—', change: '—', positive: true,
  }
}

function fallbackNativeAsset(symbol: string, chainName: string, assets: Asset[]): Asset {
  const known = assets.find(a => a.symbol.toUpperCase() === symbol.toUpperCase()) ?? seedAssets.find(a => a.symbol.toUpperCase() === symbol.toUpperCase())
  if (known) return known
  const chain = chainMeta[chainName]
  const names: Record<string, string> = { TRX: 'TRON', BTC: 'Bitcoin', SUI: 'Sui', XLM: 'Stellar', TON: 'Toncoin', SOL: 'Solana' }
  const colors: Record<string, string> = { TRX: '#E84142', BTC: '#F7931A', SUI: '#6FBCF0', XLM: '#7B68EE', TON: '#0098EA', SOL: '#9945FF' }
  return { symbol: symbol.toUpperCase(), name: names[symbol.toUpperCase()] ?? chainName, color: colors[symbol.toUpperCase()] ?? '#C6A45A', letter: symbol.slice(0, 1).toUpperCase(), logo: chain?.logo, id: `native-${chainName.toLowerCase().replace(/\s+/g, '-')}`, price: '—', change: '—', positive: true, isNative: true }
}

function resolveProviderToken(tokens: ProviderToken[], symbol: string, selectedAddress?: string): ProviderToken {
  const exactAddress = selectedAddress ? tokens.find(t => t.address === selectedAddress || (isEvmChainId(t.chainId) && t.address.toLowerCase() === selectedAddress.toLowerCase())) : undefined
  if (exactAddress) return exactAddress
  const matches = tokens.filter(t => t.symbol.toUpperCase() === symbol.toUpperCase())
  if (!matches.length) throw new Error(`The provider token list does not contain ${symbol} on this network. Choose another token.`)
  if (symbol.toUpperCase() === matches[0].symbol.toUpperCase()) {
    const native = matches.find(t => t.isNative || t.address === '0x0000000000000000000000000000000000000000')
    if (native) return native
  }
  return matches.find(t => !t.isNative && Boolean(t.logoURI) && Boolean(t.priceUSD))
    ?? matches.find(t => !t.isNative && Boolean(t.logoURI))
    ?? matches[0]
}

function providerForTransactions(): Eip1193Provider | undefined {
  return (window as Window & { ethereum?: Eip1193Provider }).ethereum
}

function usdValue(value?: string | number | null) {
  if (value == null || value === '') return '—'
  const n = Number(value)
  return Number.isFinite(n) ? formatUsd(n) : '—'
}

function QuoteReview({ quote, fromToken, toToken, fromChainName, toChainName, quotedAt, status, executing, onRefresh, onExecute }: {
  quote: LifiQuote; fromToken: ProviderToken; toToken: ProviderToken; fromChainName: string; toChainName: string; quotedAt: number; status: string; executing: boolean; onRefresh: () => void; onExecute: () => void
}) {
  const received = formatUnitsSafe(quote.estimate.toAmount, toToken.decimals)
  const minimum = formatUnitsSafe(quote.estimate.toAmountMin ?? quote.estimate.toAmount, toToken.decimals)
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer) }, [])
  const feeCosts = quote.estimate.feeCosts ?? []
  const gasCosts = quote.estimate.gasCosts ?? []
  const feeKnown = feeCosts.some(f => f.amountUSD != null)
  const gasKnown = gasCosts.some(f => f.amountUSD != null)
  const feeUSD = feeKnown ? usdValue(feeCosts.reduce((sum, f) => sum + Number(f.amountUSD ?? 0), 0)) : '—'
  const gasUSD = gasKnown ? usdValue(gasCosts.reduce((sum, f) => sum + Number(f.amountUSD ?? 0), 0)) : '—'
  const impact = (quote.estimate as any).priceImpact
  const impactLabel = impact == null ? 'Not returned' : `${(Number(impact) * (Math.abs(Number(impact)) <= 1 ? 100 : 1)).toFixed(2)}%`
  const duration = quote.estimate.executionDuration == null ? 'Not returned' : quote.estimate.executionDuration < 60 ? `${Math.ceil(quote.estimate.executionDuration)} sec` : `${Math.ceil(quote.estimate.executionDuration / 60)} min`
  const remaining = Math.max(0, 45 - Math.floor((now - quotedAt) / 1000))
  return <section className="route-quote-card" aria-live="polite">
    <div className="route-quote-head"><div><span className="route-quote-kicker"><Check size={13}/> LIVE ROUTE FOUND</span><strong>Review your quote</strong></div><button className="secondary-button quote-refresh" onClick={onRefresh} disabled={executing}><Activity size={14}/> Refresh</button></div>
    <div className="route-estimate-highlight"><div><span>Estimated receive</span><strong>{received}</strong></div><div className="route-estimate-token"><AssetIcon asset={providerTokenToAsset(toToken)} size="sm"/><strong>{toToken.symbol}</strong></div><small>{toToken.priceUSD ? `Approx. ${usdValue(Number(received.replace(/,/g, '')) * Number(toToken.priceUSD))}` : 'Provider estimate · final amount may vary'}</small></div>
    <div className="route-provider-line"><span className="route-provider-logo">{quote.toolDetails?.logoURI ? <img src={quote.toolDetails.logoURI} alt="" /> : <ArrowDownUp size={15}/>}</span><div><strong>{quote.toolDetails?.name || quote.tool || 'LI.FI route'}</strong><small>{fromToken.symbol} on {fromChainName} <ArrowRight size={10}/> {toChainName}</small></div><span className="pill neutral">Provider quote</span></div>
    <div className="route-metric-grid">
      <div><span>Minimum received</span><strong>{minimum} {toToken.symbol}</strong></div>
      <div><span>Network gas</span><strong>{gasUSD}</strong></div>
      <div><span>Provider fees</span><strong>{feeUSD}</strong></div>
      <div><span>Price impact</span><strong>{impactLabel}</strong></div>
      <div><span>Estimated time</span><strong>{duration}</strong></div>
      <div><span>Quote age</span><strong>{remaining > 0 ? `${remaining}s left` : 'Refresh required'}</strong></div>
    </div>
    <div className="route-quote-note"><ShieldCheck size={14}/><span>Check the source network, destination, token, minimum receive and fees in your wallet before approving. Token approval, when needed, is exact-amount only.</span></div>
    {status && <div className="route-execution-status"><span className="status-indicator"/>{status}</div>}
    <button className="primary-button full route-execute-button" disabled={executing || remaining <= 0} onClick={onExecute}>{executing ? 'Waiting for wallet / confirmation…' : remaining <= 0 ? 'Quote expired · refresh to continue' : 'Confirm in wallet'} <ArrowRight size={15}/></button>
  </section>
}

function RouteError({ message }: { message: string }) {
  return message ? <div className="route-error" role="alert"><ShieldCheck size={15}/><span>{message}</span></div> : null
}

function Swap({theme,assets,fromAsset,toAsset,setFromAsset,setToAsset,amount,setAmount,wallet,onConnect,onPreview,notify}:{theme:'dark'|'light';assets:Asset[];fromAsset:string;toAsset:string;setFromAsset:(s:string)=>void;setToAsset:(s:string)=>void;amount:string;setAmount:(s:string)=>void;wallet:string;onConnect:()=>void;onPreview:()=>void;notify:(s:string)=>void}) {
  const [advanced,setAdvanced] = useState(false)
  const [slippage,setSlippage] = useState('0.50')
  const [assetSelect,setAssetSelect] = useState<'from'|'to'|null>(null)
  const [fromChain,setFromChain] = useState('Ethereum')
  const [toChain,setToChain] = useState('Ethereum')
  const [tokenQuery,setTokenQuery] = useState('')
  const [chainTokenList,setChainTokenList] = useState<Record<string,Asset[]>>({})
  const [tokenListLoading,setTokenListLoading] = useState(false)
  const [fromTokenAddress,setFromTokenAddress] = useState('')
  const [toTokenAddress,setToTokenAddress] = useState('')
  const [toAddress,setToAddress] = useState('')
  const [quote,setQuote] = useState<LifiQuote|null>(null)
  const [quoteTokens,setQuoteTokens] = useState<{from:ProviderToken;to:ProviderToken}|null>(null)
  const [quotedAt,setQuotedAt] = useState(0)
  const [quoteLoading,setQuoteLoading] = useState(false)
  const [quoteError,setQuoteError] = useState('')
  const [executing,setExecuting] = useState(false)
  const [executionStatus,setExecutionStatus] = useState('')
  const [multiWalletOpen,setMultiWalletOpen] = useState(false)
  const [multiWalletTokens,setMultiWalletTokens] = useState<{from?:string;to?:string}>({})
  const chainTokens: Record<string,string[]> = {
    'Ethereum':['ETH','USDC','USDT','WBTC','LINK','UNI'], 'Arbitrum':['ETH','USDC','USDT','ARB','LINK'],
    'Base':['ETH','USDC','AERO'], 'Optimism':['ETH','USDC','OP'], 'Polygon':['POL','USDC','USDT','LINK'],
    'BNB Chain':['BNB','USDT','CAKE'], 'Avalanche':['AVAX','USDC','USDT','LINK']
  }
  const selectedChain = assetSelect === 'from' ? fromChain : toChain
  const fromChainId = chainMeta[fromChain]?.chainId ?? 1
  const toChainId = chainMeta[toChain]?.chainId ?? 1
  const multiEcosystemSource = !isEvmChainId(fromChainId)

  useEffect(() => {
    if (!assetSelect) return
    const cid = EVM_CHAINS[selectedChain]?.id ?? chainMeta[selectedChain]?.chainId
    if (!cid || chainTokenList[selectedChain]?.length) return
    let cancelled = false
    setTokenListLoading(true)
    fetchLifiTokens(cid)
      .then(tokens => { if (!cancelled) setChainTokenList(prev => ({...prev,[selectedChain]:tokens.map(providerTokenToAsset)})) })
      .catch(() => { /* keep known fallback tokens in the selector */ })
      .finally(() => { if (!cancelled) setTokenListLoading(false) })
    return () => { cancelled = true }
  }, [assetSelect, selectedChain, chainTokenList])

  useEffect(() => {
    setQuote(null); setQuoteTokens(null); setQuotedAt(0); setQuoteError(''); setExecutionStatus('')
  }, [amount, fromAsset, toAsset, fromChain, toChain, slippage, fromTokenAddress, toTokenAddress, toAddress])

  const tokenList = (chainTokenList[selectedChain]?.length ? chainTokenList[selectedChain] : assets.filter(a => chainTokens[selectedChain]?.includes(a.symbol)))
    .filter(a => a.symbol !== 'PIO' && `${a.name} ${a.symbol}`.toLowerCase().includes(tokenQuery.toLowerCase()))
  const from = chainTokenList[fromChain]?.find(a=>a.symbol===fromAsset && (!fromTokenAddress || a.address===fromTokenAddress)) ?? assets.find(a=>a.symbol===fromAsset) ?? fallbackNativeAsset(fromAsset, fromChain, assets)
  const to = chainTokenList[toChain]?.find(a=>a.symbol===toAsset && (!toTokenAddress || a.address===toTokenAddress)) ?? assets.find(a=>a.symbol===toAsset) ?? fallbackNativeAsset(toAsset, toChain, assets)
  const sameChain = fromChain === toChain
  const supportedToken = (chain:string,symbol:string) => Boolean(chainTokens[chain]?.includes(symbol))
  const chooseChain = (side:'from'|'to', chain:string) => {
    if(side==='from') {
      setFromChain(chain); setFromTokenAddress('')
      if (!isEvmChainId(chainMeta[chain]?.chainId ?? 0)) setFromAsset(chainMeta[chain]?.native ?? 'ETH')
      else if(!supportedToken(chain,fromAsset)) setFromAsset((chainTokens[chain]||[chainMeta[chain]?.native||'ETH'])[0])
    } else {
      setToChain(chain); setToTokenAddress('')
      if (!isEvmChainId(chainMeta[chain]?.chainId ?? 0)) setToAsset(chainMeta[chain]?.native ?? 'USDC')
      else if(!supportedToken(chain,toAsset)) setToAsset((chainTokens[chain]||[chainMeta[chain]?.native||'USDC'])[0])
    }
  }
  async function findQuote() {
    setQuoteError(''); setExecutionStatus(''); setQuote(null); setQuoteTokens(null)
    if (multiEcosystemSource) {
      try {
        if (!amount || Number(amount) <= 0) throw new Error('Enter an amount greater than zero first.')
        if (fromAsset === 'PIO' || toAsset === 'PIO') throw new Error('PIO trading is paused until its official chain and token contract are verified.')
        const [fromList, toList] = await Promise.all([fetchLifiTokens(fromChainId), fetchLifiTokens(toChainId)])
        const f = resolveProviderToken(fromList, fromAsset, fromTokenAddress || undefined)
        const t = resolveProviderToken(toList, toAsset, toTokenAddress || undefined)
        setMultiWalletTokens({ from:f.address, to:t.address }); setMultiWalletOpen(true)
      } catch (e) { setQuoteError(e instanceof Error ? e.message : 'Could not prepare this route. Try another token or network.') }
      return
    }
    if (!wallet) { onConnect(); return }
    if (!amount || Number(amount) <= 0) { setQuoteError('Enter an amount greater than zero.'); return }
    if (fromAsset === 'PIO' || toAsset === 'PIO') { setQuoteError('PIO trading is paused until its official chain, token contract address and decimals are verified. Select a provider-listed token for a live quote.'); return }
    const srcId = EVM_CHAINS[fromChain]?.id
    const dstId = chainMeta[toChain]?.chainId
    if (!srcId || !dstId) { setQuoteError('This network is not available in the route provider.'); return }
    if (!isEvmChainId(srcId)) { setMultiWalletOpen(true); return }
    const provider = providerForTransactions()
    if (!provider) { setQuoteError('No injected EVM wallet detected. Install or unlock MetaMask, then connect it.'); return }
    setQuoteLoading(true)
    try {
      const [fromList, toList] = await Promise.all([fetchLifiTokens(srcId), fetchLifiTokens(dstId)])
      const fromToken = resolveProviderToken(fromList, fromAsset, fromTokenAddress || undefined)
      const toToken = resolveProviderToken(toList, toAsset, toTokenAddress || undefined)
      const rawAmount = parseUnitsSafe(amount, fromToken.decimals).toString()
      const targetAddress = toAddress.trim() || (isEvmChainId(dstId) ? wallet : '')
      if (!isEvmChainId(dstId) && !targetAddress) throw new Error(`Enter a destination ${toChain} wallet address before requesting a quote.`)
      const result = await getLifiQuote({ fromChainId:srcId, toChainId:dstId, fromToken, toToken, fromAmount:rawAmount, fromAddress:wallet, toAddress:targetAddress || wallet, slippage:Number(slippage)/100 })
      setQuote(result); setQuoteTokens({from:fromToken,to:toToken}); setQuotedAt(Date.now())
    } catch (e) { setQuoteError(e instanceof Error ? e.message : 'Could not fetch a live LI.FI quote. Try another token, network, or amount.') }
    finally { setQuoteLoading(false) }
  }
  async function executeQuote() {
    if (!quote || !quoteTokens) return
    const provider = providerForTransactions()
    if (!provider) { setQuoteError('No injected EVM wallet is available. Reconnect and request a fresh quote.'); return }
    if (!wallet) { onConnect(); return }
    setExecuting(true); setQuoteError(''); setExecutionStatus('Preparing transaction…')
    try {
      const result = await executeLifiQuote({ provider, wallet, quote, quotedAt, fromSymbol:quoteTokens.from.symbol, toSymbol:quoteTokens.to.symbol, amount, onStatus:setExecutionStatus })
      setExecutionStatus(`${result.status} · ${result.txHash}`)
      notify(`${result.status}. Transaction: ${result.txHash.slice(0,10)}…`)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Transaction could not be completed.'
      setQuoteError(message); setExecutionStatus('')
    } finally { setExecuting(false) }
  }

  // Keep the original PioSwap route form for EVM-source flows. When the source is a non-EVM
  // ecosystem, route execution moves to LI.FI's compatible wallet panel inside the same page.
  return <div className="page-content narrow-page"><PageHeader eyebrow="TRADE / SWAP" title="Swap, with clarity." description="Select networks and tokens, inspect the live quote and fees, then confirm the transaction in your wallet."/>
    <div className="swap-layout"><div className="swap-main panel swap-luxury-card">
      <div className="chain-pair-selectors"><ChainPicker label="PAY ON" value={fromChain} onChange={c=>chooseChain('from',c)}/><ChainPicker label="RECEIVE ON" value={toChain} onChange={c=>chooseChain('to',c)}/></div>
      <div className="swap-card-head"><div className="eyebrow">YOU PAY · {fromChain.toUpperCase()}</div><span className="muted-text">{wallet?`Wallet ${fmtAddress(wallet)}`:'Connect your wallet to see balances'}</span></div>
      <div className="amount-row"><input value={amount} onChange={e=>setAmount(sanitizeAmount(e.target.value))} placeholder="0.00" inputMode="decimal" aria-label="Amount to pay"/><button className="token-select" onClick={()=>{setAssetSelect('from');setTokenQuery('')}}><AssetIcon asset={from} size="sm"/>{from.symbol}<ChevronDown size={15}/></button></div>
      <div className="amount-foot"><span>{from.price !== '—' ? `Market price ${from.price}` : 'USD estimate shown by the quote provider'}</span><button type="button" onClick={()=>{if(!wallet){onConnect();return}notify('Balance-aware MAX amount is not yet indexed for this token.')}}>MAX</button></div>
      <div className="swap-direction"><button className="round-icon" onClick={()=>{setFromAsset(toAsset);setToAsset(fromAsset);setFromChain(toChain);setToChain(fromChain);setFromTokenAddress(toTokenAddress);setToTokenAddress(fromTokenAddress)}} aria-label="Reverse assets and networks"><ArrowDownUp size={17}/></button></div>
      <div className="swap-card-head"><div className="eyebrow">YOU RECEIVE · {toChain.toUpperCase()}</div><span className="muted-text">{quote ? 'Quote from LI.FI' : 'Estimated output'}</span></div>
      <div className="amount-row"><div className="output-amount">{quote && quoteTokens ? formatUnitsSafe(quote.estimate.toAmount, quoteTokens.to.decimals) : '—'}</div><button className="token-select" onClick={()=>{setAssetSelect('to');setTokenQuery('')}}><AssetIcon asset={to} size="sm"/>{to.symbol}<ChevronDown size={15}/></button></div>
      <div className="amount-foot"><span>{quote && quoteTokens ? `Minimum received ${formatUnitsSafe(quote.estimate.toAmountMin ?? quote.estimate.toAmount, quoteTokens.to.decimals)} ${quoteTokens.to.symbol}` : 'A route quote will estimate the amount after fees'}</span><span>{quote && quoteTokens ? usdValue(quote.estimate.toAmountUSD) : ''}</span></div>
      {assetSelect&&<div className="asset-picker"><div className="picker-head"><strong>Select {assetSelect==='from'?'pay':'receive'} token · {assetSelect==='from'?fromChain:toChain}</strong><button className="icon-button" onClick={()=>setAssetSelect(null)}><X size={16}/></button></div><div className="token-picker-meta">{chainTokenList[selectedChain]?.length ? `${chainTokenList[selectedChain].length.toLocaleString()} provider-listed tokens` : 'Loading the provider-listed token catalogue'}</div><input className="text-input token-search-input" value={tokenQuery} onChange={e=>setTokenQuery(e.target.value)} placeholder="Search tokens by name or symbol"/>{tokenListLoading&&!chainTokenList[selectedChain]?.length?<div className="picker-empty">Loading verified network token list…</div>:tokenList.length?tokenList.slice(0,80).map(a=><button key={`${assetSelect}-${a.address||a.id||a.symbol}`} className="picker-row" onClick={()=>{if(assetSelect==='from'){setFromAsset(a.symbol);setFromTokenAddress(a.address||'')}else{setToAsset(a.symbol);setToTokenAddress(a.address||'')}setAssetSelect(null);setTokenQuery('')}}><AssetIcon asset={a}/><span>{a.name}<small>{a.symbol}{a.address?` · ${a.address.slice(0,6)}…${a.address.slice(-4)}`:''}</small></span><ArrowRight size={15}/></button>):<div className="picker-empty">No provider-listed tokens matched. Check the network or search another symbol.</div>}</div>}
      {!isEvmChainId(toChainId)&&<div className="recipient-address-field"><label>DESTINATION WALLET ADDRESS · {toChain.toUpperCase()}</label><input className="text-input" value={toAddress} onChange={e=>setToAddress(e.target.value)} placeholder={`Paste a ${toChain} receive address`}/><small>Required for a destination on a different wallet ecosystem. Confirm the address in your destination wallet before continuing.</small></div>}
      <div className="quote-summary"><div><span>Route</span><strong>{sameChain?'Same-chain swap':'Cross-chain route'}</strong></div><div><span>Network fee</span><strong>{quote?usdValue((quote.estimate.gasCosts||[]).reduce((sum,c)=>sum+Number(c.amountUSD||0),0)):'Shown in quote'}</strong></div><div><span>Slippage</span><strong>{slippage}%</strong></div><div><span>Provider</span><strong>{quote?.toolDetails?.name||'LI.FI'}</strong></div></div>
      <button className="disclosure-row" onClick={()=>setAdvanced(!advanced)}><span><Settings2 size={15}/> Advanced settings</span><ChevronDown size={15} className={advanced?'rotated':''}/></button>
      {advanced&&<div className="advanced-settings"><label>Slippage tolerance</label><div className="slippage-options">{['0.10','0.30','0.50','1.00','2.00'].map(x=><button key={x} className={slippage===x?'selected':''} onClick={()=>setSlippage(x)}>{x}%</button>)}</div><p>Changing slippage invalidates the previous quote. A fresh provider quote is required before wallet confirmation.</p></div>}
      <RouteError message={quoteError}/>
      {multiWalletOpen&&<div className="multi-ecosystem-panel panel"><div className="multi-ecosystem-top"><div><div className="eyebrow">MULTI-WALLET ROUTE</div><h3>Connect the wallet for {fromChain}.</h3><p>This route starts on a non-EVM network, so its own wallet must sign. The amount and token selections above stay in your original PioSwap form.</p></div><button className="secondary-button" onClick={()=>setMultiWalletOpen(false)}>Close route panel</button></div><LifiTradeWidget appearance={theme} mode={sameChain?'swap':'bridge'} fromChainId={fromChainId} toChainId={toChainId} fromToken={multiWalletTokens.from} toToken={multiWalletTokens.to} fromAmount={amount}/></div>}
      <button className="primary-button full swap-cta" disabled={quoteLoading||executing} onClick={()=>void findQuote()}>{quoteLoading?'Finding the best route…':quote?'Refresh quote':'Find best route'} <ArrowRight size={16}/></button>
      {quote&&quoteTokens&&<QuoteReview quote={quote} fromToken={quoteTokens.from} toToken={quoteTokens.to} fromChainName={fromChain} toChainName={toChain} quotedAt={quotedAt} status={executionStatus} executing={executing} onRefresh={()=>void findQuote()} onExecute={()=>void executeQuote()}/>}
      <div className="safe-note"><ShieldCheck size={15}/> No transaction is submitted until you review and confirm it in the connected wallet.</div>
    </div><aside className="swap-aside"><div className="panel aside-panel"><div className="aside-heading"><ShieldCheck size={18}/><strong>Before you sign</strong></div><p>Quotes show the provider's live estimate. Compare minimum receive, fees, slippage and the destination address. Network switching may require a fresh quote.</p><ul><li><Check size={14}/> Live route quote</li><li><Check size={14}/> Token address match</li><li><Check size={14}/> Exact-amount approval where needed</li><li><Check size={14}/> On-chain receipt and bridge status</li></ul></div><div className="panel aside-panel"><div className="eyebrow">PIO ASSET STATUS</div><h3>Verification pending</h3><p>PIO token details have not been supplied. The token remains non-tradable until its official chain and contract are verified.</p><span className="pill warning">Not tradable yet</span></div></aside></div>
  </div>
}

function Markets({query,setQuery,assets:rows,watchlist,toggleWatch,marketStatus,marketUpdated,onSelect}:{query:string;setQuery:(s:string)=>void;assets:Asset[];watchlist:string[];toggleWatch:(s:string)=>void;marketStatus:'loading'|'live'|'error';marketUpdated:string;onSelect:()=>void}) {
  const [tab,setTab]=useState('All assets')
  const filtered=rows.filter(a=>tab==='Watchlist'?watchlist.includes(a.symbol):true)
  return <div className="page-content"><PageHeader eyebrow="DISCOVER / MARKETS" title="Markets, without the noise." description="Live market prices, 24-hour moves and market-cap rankings from CoinGecko. PIO is shown separately until its identity is verified."/><div className="market-tools"><div className="search-field"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by name or symbol"/></div><button className="secondary-button" onClick={()=>setTab(tab==='Watchlist'?'All assets':'Watchlist')}><SlidersHorizontal size={15}/>{tab==='Watchlist'?'Watchlist':'Filters'}</button></div><div className="panel market-panel"><div className="table-tabs">{['All assets','Watchlist'].map(t=><button className={tab===t?'active':''} onClick={()=>setTab(t)} key={t}>{t}</button>)}</div><AssetTable rows={filtered} watchlist={watchlist} toggleWatch={toggleWatch} onSelect={onSelect}/><div className="data-note"><span className={`status-indicator ${marketStatus==='live'?'':'muted'}`}/> {marketStatus==='live'?`Live CoinGecko data · last refreshed ${marketUpdated}.`:marketStatus==='loading'?'Fetching market data…':'Market data unavailable. Check your connection or retry shortly; no placeholder prices are shown.'}</div></div></div>
}
function AdvancedTrading({notify}:{notify:(s:string)=>void}) {
  const [side,setSide]=useState<'Buy'|'Sell'>('Buy')
  const [pair,setPair]=useState('ETH / USDC')
  return <div className="page-content"><PageHeader eyebrow="TRADE / ADVANCED" title="The details, in view." description="A professional layout for charting and order-book data, with honest availability states." right={<button className="secondary-button" onClick={()=>notify('Live exchange feed is not configured.')}><Activity size={15}/> Feed status</button>}/><div className="trading-grid"><div className="panel chart-panel"><div className="chart-toolbar"><button className="pair-select" onClick={()=>setPair(pair==='ETH / USDC'?'BTC / USDC':'ETH / USDC')}>{pair}<ChevronDown size={14}/></button><div className="chart-times">{['1m','5m','15m','1H','4H','1D'].map(t=><button key={t} onClick={()=>notify('Historical candles are unavailable until a data provider is connected.')}>{t}</button>)}</div></div><div className="chart-placeholder"><div className="chart-watermark">{pair.split(' / ')[0]}</div><LineChart size={42} strokeWidth={1}/><strong>Chart data unavailable</strong><span>Connect a market-data provider to display real candles.</span></div><div className="chart-footer"><span>Source: not connected</span><span>Last update: —</span></div></div><div className="panel orderbook-panel"><div className="orderbook-head"><h3>Order book</h3><span className="pill neutral">No feed</span></div><div className="orderbook-columns"><span>Price (USDC)</span><span>Amount</span><span>Total</span></div><div className="book-empty"><div className="book-line red"/><div className="book-line red short"/><div className="book-line red medium"/><div className="book-mid">Spread unavailable</div><div className="book-line green medium"/><div className="book-line green short"/><div className="book-line green"/></div><div className="data-note">No order book data is being fabricated.</div></div></div><div className="panel order-entry"><div className="order-tabs"><button className={side==='Buy'?'buy-active':''} onClick={()=>setSide('Buy')}>Buy</button><button className={side==='Sell'?'sell-active':''} onClick={()=>setSide('Sell')}>Sell</button></div><label>Order type</label><div className="input-static">Market <ChevronDown size={15}/></div><label>Price</label><div className="input-static">Market price unavailable</div><label>Amount</label><input className="text-input" placeholder="0.00" inputMode="decimal"/><div className="quote-summary"><div><span>Available balance</span><strong>—</strong></div><div><span>Estimated fee</span><strong>—</strong></div></div><button className={`primary-button full ${side==='Sell'?'sell-button':''}`} onClick={()=>notify('Order placement is disabled until a verified execution provider is integrated.')}>{side} {pair.split(' / ')[0]}</button></div></div>
}
function CrossChain({theme,assets,wallet,onConnect,notify}:{theme:'dark'|'light';assets:Asset[];wallet:string;onConnect:()=>void;notify:(s:string)=>void}) {
  const [from,setFrom]=useState('Ethereum')
  const [to,setTo]=useState('Solana')
  const [fromAsset,setFromAsset]=useState('USDC')
  const [toAsset,setToAsset]=useState('USDC')
  const [amount,setAmount]=useState('')
  const [toAddress,setToAddress]=useState('')
  const [assetSelect,setAssetSelect]=useState<'from'|'to'|null>(null)
  const [tokenQuery,setTokenQuery]=useState('')
  const [chainTokenList,setChainTokenList]=useState<Record<string,Asset[]>>({})
  const [tokenListLoading,setTokenListLoading]=useState(false)
  const [fromTokenAddress,setFromTokenAddress]=useState('')
  const [toTokenAddress,setToTokenAddress]=useState('')
  const [slippage,setSlippage]=useState('0.50')
  const [advanced,setAdvanced]=useState(false)
  const [quote,setQuote]=useState<LifiQuote|null>(null)
  const [quoteTokens,setQuoteTokens]=useState<{from:ProviderToken;to:ProviderToken}|null>(null)
  const [quotedAt,setQuotedAt]=useState(0)
  const [quoteLoading,setQuoteLoading]=useState(false)
  const [quoteError,setQuoteError]=useState('')
  const [executing,setExecuting]=useState(false)
  const [executionStatus,setExecutionStatus]=useState('')
  const [multiWalletOpen,setMultiWalletOpen]=useState(false)
  const [multiWalletTokens,setMultiWalletTokens]=useState<{from?:string;to?:string}>({})
  const fromChainId=chainMeta[from]?.chainId??1
  const toChainId=chainMeta[to]?.chainId??8453
  const multiEcosystemSource=!isEvmChainId(fromChainId)

  useEffect(()=>{
    if(!assetSelect)return
    const chain=assetSelect==='from'?from:to
    if(chainTokenList[chain]?.length)return
    const cid=chainMeta[chain]?.chainId
    if(!cid)return
    let cancelled=false
    setTokenListLoading(true)
    fetchLifiTokens(cid).then(tokens=>{if(!cancelled)setChainTokenList(prev=>({...prev,[chain]:tokens.map(providerTokenToAsset)}))})
      .catch(()=>{/* provider fallback text remains visible */})
      .finally(()=>{if(!cancelled)setTokenListLoading(false)})
    return()=>{cancelled=true}
  },[assetSelect,from,to,chainTokenList])
  useEffect(()=>{setQuote(null);setQuoteTokens(null);setQuotedAt(0);setQuoteError('');setExecutionStatus('')},[from,to,fromAsset,toAsset,amount,toAddress,slippage,fromTokenAddress,toTokenAddress])

  const selectedChain=assetSelect==='from'?from:to
  const tokenList=(chainTokenList[selectedChain]?.length?chainTokenList[selectedChain]:assets.filter(a=>['ETH','USDC','USDT','SOL','TRX','BTC','SUI','XLM'].includes(a.symbol)))
    .filter(a=>a.symbol!=='PIO'&&`${a.name} ${a.symbol}`.toLowerCase().includes(tokenQuery.toLowerCase()))
  const sourceToken=chainTokenList[from]?.find(a=>a.symbol===fromAsset&&(!fromTokenAddress||a.address===fromTokenAddress))??assets.find(a=>a.symbol===fromAsset)??fallbackNativeAsset(fromAsset,from,assets)
  const destinationToken=chainTokenList[to]?.find(a=>a.symbol===toAsset&&(!toTokenAddress||a.address===toTokenAddress))??assets.find(a=>a.symbol===toAsset)??fallbackNativeAsset(toAsset,to,assets)
  function chooseNetwork(side:'from'|'to',chain:string){
    if(side==='from'){
      setFrom(chain);setFromTokenAddress('');if(!isEvmChainId(chainMeta[chain]?.chainId??0))setFromAsset(chainMeta[chain]?.native??'ETH')
      else if(!['ETH','USDC','USDT','WBTC','LINK','UNI','ARB','OP','POL','BNB','AVAX','AERO','CAKE'].includes(fromAsset))setFromAsset(chainMeta[chain]?.native??'ETH')
    } else {
      setTo(chain);setToTokenAddress('');if(!isEvmChainId(chainMeta[chain]?.chainId??0))setToAsset(chainMeta[chain]?.native??'USDC')
      else if(!['ETH','USDC','USDT','WBTC','LINK','UNI','ARB','OP','POL','BNB','AVAX','AERO','CAKE'].includes(toAsset))setToAsset('USDC')
    }
  }
  async function findBridgeQuote(){
    setQuoteError('');setQuote(null);setQuoteTokens(null);setExecutionStatus('')
    if(from===to){setQuoteError('Choose two different networks for a cross-chain transfer.');return}
    if(!amount||Number(amount)<=0){setQuoteError('Enter an amount greater than zero.');return}
    if(fromAsset==='PIO'||toAsset==='PIO'){setQuoteError('PIO trading is paused until its official token contract is verified. Choose a provider-listed token for a live route.');return}
    if(multiEcosystemSource){
      try{
        const [source,destination]=await Promise.all([fetchLifiTokens(fromChainId),fetchLifiTokens(toChainId)])
        const f=resolveProviderToken(source,fromAsset,fromTokenAddress||undefined)
        const t=resolveProviderToken(destination,toAsset,toTokenAddress||undefined)
        setMultiWalletTokens({from:f.address,to:t.address});setMultiWalletOpen(true)
      }catch(e){setQuoteError(e instanceof Error?e.message:'Could not load tokens for this route.')}
      return
    }
    if(!wallet){onConnect();return}
    if(!isEvmChainId(toChainId)&&!toAddress.trim()){setQuoteError(`Enter the destination ${to} wallet address to receive the bridged tokens.`);return}
    setQuoteLoading(true)
    try{
      const [source,destination]=await Promise.all([fetchLifiTokens(fromChainId),fetchLifiTokens(toChainId)])
      const f=resolveProviderToken(source,fromAsset,fromTokenAddress||undefined)
      const t=resolveProviderToken(destination,toAsset,toTokenAddress||undefined)
      const rawAmount=parseUnitsSafe(amount,f.decimals).toString()
      const recipient=toAddress.trim()||(isEvmChainId(toChainId)?wallet:'')
      const result=await getLifiQuote({fromChainId,toChainId,fromToken:f,toToken:t,fromAmount:rawAmount,fromAddress:wallet,toAddress:recipient||wallet,slippage:Number(slippage)/100})
      setQuote(result);setQuoteTokens({from:f,to:t});setQuotedAt(Date.now())
    }catch(e){setQuoteError(e instanceof Error?e.message:'Could not find a live bridge route. Try another amount, token or network.')}
    finally{setQuoteLoading(false)}
  }
  async function executeBridge(){
    if(!quote||!quoteTokens)return
    const provider=providerForTransactions()
    if(!provider){setQuoteError('No injected EVM wallet is available. Reconnect and request a fresh quote.');return}
    if(!wallet){onConnect();return}
    setExecuting(true);setQuoteError('');setExecutionStatus('Preparing source transaction…')
    try{
      const result=await executeLifiQuote({provider,wallet,quote,quotedAt,fromSymbol:quoteTokens.from.symbol,toSymbol:quoteTokens.to.symbol,amount,onStatus:setExecutionStatus})
      setExecutionStatus(`${result.status} · ${result.txHash}`);notify(`${result.status}. Transaction: ${result.txHash.slice(0,10)}…`)
    }catch(e){setQuoteError(e instanceof Error?e.message:'Bridge transaction could not be completed.');setExecutionStatus('')}
    finally{setExecuting(false)}
  }

  return <div className="page-content narrow-page cross-chain-page"><PageHeader eyebrow="TRADE / CROSS-CHAIN" title="One flow. Two chains." description="Keep the original bridge layout: enter the amount, choose source and destination tokens, then inspect a live LI.FI route before signing."/><div className="swap-layout"><div className="panel bridge-panel swap-luxury-card">
    <div className="chain-pair-selectors"><ChainPicker label="FROM NETWORK" value={from} onChange={chain=>chooseNetwork('from',chain)}/><ChainPicker label="TO NETWORK" value={to} onChange={chain=>chooseNetwork('to',chain)}/></div>
    <div className="swap-card-head"><div className="eyebrow">YOU SEND · {from.toUpperCase()}</div><span className="muted-text">{wallet?`Wallet ${fmtAddress(wallet)}`:'Connect your source wallet to continue'}</span></div>
    <div className="amount-row bridge-amount"><input value={amount} onChange={e=>setAmount(sanitizeAmount(e.target.value))} placeholder="0.00" inputMode="decimal" aria-label="Amount to bridge"/><button className="token-select" onClick={()=>{setAssetSelect('from');setTokenQuery('')}}><AssetIcon asset={sourceToken} size="sm"/>{sourceToken.symbol}<ChevronDown size={15}/></button></div>
    <div className="amount-foot"><span>{sourceToken.price!=='—'?`Market price ${sourceToken.price}`:'Provider quote calculates output and fees'}</span><button type="button" onClick={()=>notify('Balance-based MAX is not yet enabled for this token. Enter the amount you want to bridge.')}>MAX</button></div>
    <div className="bridge-switch"><button className="round-icon" onClick={()=>{setFrom(to);setTo(from);setFromAsset(toAsset);setToAsset(fromAsset);setFromTokenAddress(toTokenAddress);setToTokenAddress(fromTokenAddress)}} aria-label="Reverse bridge networks and assets"><ArrowDownUp size={16}/></button></div>
    <div className="swap-card-head"><div className="eyebrow">YOU RECEIVE · {to.toUpperCase()}</div><span className="muted-text">{quote?'Live quote':'Estimate after route fees'}</span></div>
    <div className="amount-row"><div className="output-amount">{quote&&quoteTokens?formatUnitsSafe(quote.estimate.toAmount,quoteTokens.to.decimals):'—'}</div><button className="token-select" onClick={()=>{setAssetSelect('to');setTokenQuery('')}}><AssetIcon asset={destinationToken} size="sm"/>{destinationToken.symbol}<ChevronDown size={15}/></button></div>
    <div className="amount-foot"><span>{quote&&quoteTokens?`Minimum receive ${formatUnitsSafe(quote.estimate.toAmountMin??quote.estimate.toAmount,quoteTokens.to.decimals)} ${quoteTokens.to.symbol}`:'Final receive amount depends on route and fees'}</span><span>{quote?usdValue(quote.estimate.toAmountUSD):''}</span></div>
    {assetSelect&&<div className="asset-picker"><div className="picker-head"><strong>Select {assetSelect==='from'?'source':'destination'} token · {assetSelect==='from'?from:to}</strong><button className="icon-button" onClick={()=>setAssetSelect(null)}><X size={16}/></button></div><div className="token-picker-meta">{chainTokenList[selectedChain]?.length?`${chainTokenList[selectedChain].length.toLocaleString()} provider-listed tokens`:'Search LI.FI-listed tokens on the selected network'}</div><input className="text-input token-search-input" value={tokenQuery} onChange={e=>setTokenQuery(e.target.value)} placeholder="Search token name or symbol"/>{tokenListLoading&&!chainTokenList[selectedChain]?.length?<div className="picker-empty">Loading token catalogue…</div>:tokenList.length?tokenList.slice(0,80).map(a=><button key={`${assetSelect}-${a.address||a.id||a.symbol}`} className="picker-row" onClick={()=>{if(assetSelect==='from'){setFromAsset(a.symbol);setFromTokenAddress(a.address||'')}else{setToAsset(a.symbol);setToTokenAddress(a.address||'')}setAssetSelect(null);setTokenQuery('')}}><AssetIcon asset={a}/><span>{a.name}<small>{a.symbol}{a.address?` · ${a.address.slice(0,6)}…${a.address.slice(-4)}`:''}</small></span><ArrowRight size={15}/></button>):<div className="picker-empty">No tokens found for this search.</div>}</div>}
    {!isEvmChainId(toChainId)&&<div className="recipient-address-field"><label>DESTINATION WALLET ADDRESS · {to.toUpperCase()}</label><input className="text-input" value={toAddress} onChange={e=>setToAddress(e.target.value)} placeholder={`Paste the destination ${to} address`}/><small>For a different wallet ecosystem, use an address from the destination wallet. Verify it carefully before signing.</small></div>}
    <div className="quote-summary"><div><span>Route</span><strong>Cross-chain bridge</strong></div><div><span>Provider</span><strong>{quote?.toolDetails?.name||'LI.FI'}</strong></div><div><span>Slippage</span><strong>{slippage}%</strong></div><div><span>Status</span><strong>{quote?'Quote ready':'Awaiting quote'}</strong></div></div>
    <button className="disclosure-row" onClick={()=>setAdvanced(!advanced)}><span><Settings2 size={15}/> Advanced settings</span><ChevronDown size={15} className={advanced?'rotated':''}/></button>
    {advanced&&<div className="advanced-settings"><label>Slippage tolerance</label><div className="slippage-options">{['0.10','0.30','0.50','1.00','2.00'].map(x=><button key={x} className={slippage===x?'selected':''} onClick={()=>setSlippage(x)}>{x}%</button>)}</div><p>A fresh route is requested when slippage changes.</p></div>}
    <RouteError message={quoteError}/>
    {multiWalletOpen&&<div className="multi-ecosystem-panel panel"><div className="multi-ecosystem-top"><div><div className="eyebrow">MULTI-WALLET ROUTE</div><h3>Connect the wallet for {from}.</h3><p>This source chain uses its own wallet signer. Your original source/destination fields and amount remain available above.</p></div><button className="secondary-button" onClick={()=>setMultiWalletOpen(false)}>Close route panel</button></div><LifiTradeWidget appearance={theme} mode="bridge" fromChainId={fromChainId} toChainId={toChainId} fromToken={multiWalletTokens.from} toToken={multiWalletTokens.to} fromAmount={amount}/></div>}
    <button className="primary-button full swap-cta" disabled={quoteLoading||executing} onClick={()=>void findBridgeQuote()}>{quoteLoading?'Searching bridge routes…':quote?'Refresh bridge quote':'Find bridge route'} <ArrowRight size={16}/></button>
    {quote&&quoteTokens&&<QuoteReview quote={quote} fromToken={quoteTokens.from} toToken={quoteTokens.to} fromChainName={from} toChainName={to} quotedAt={quotedAt} status={executionStatus} executing={executing} onRefresh={()=>void findBridgeQuote()} onExecute={()=>void executeBridge()}/>}
    <div className="safe-note"><ShieldCheck size={15}/> Source confirmation and destination settlement are tracked separately. Never close the app until you have recorded the transaction hash.</div>
  </div><aside className="swap-aside"><div className="panel aside-panel"><div className="aside-heading"><ShieldCheck size={18}/><strong>Bridge review</strong></div><p>Read the destination address, minimum receive and fee estimates. When the source is EVM, the source transaction is signed in your injected wallet; non-EVM source routes use the compatible LI.FI wallet panel.</p><ul><li><Check size={14}/> Provider route and fees</li><li><Check size={14}/> Destination address confirmation</li><li><Check size={14}/> Source-chain receipt</li><li><Check size={14}/> Destination settlement status</li></ul></div><div className="panel aside-panel"><div className="eyebrow">PIO ASSET STATUS</div><h3>Verification pending</h3><p>PIO is not included until its official token contract and decimals are verified.</p><span className="pill warning">Not tradable yet</span></div></aside></div></div>
}

const referralRegistryAbi = [
  { type:'function', name:'register', stateMutability:'nonpayable', inputs:[], outputs:[] },
  { type:'function', name:'bindReferrer', stateMutability:'nonpayable', inputs:[{name:'referrer',type:'address'}], outputs:[] },
  { type:'function', name:'referrerOf', stateMutability:'view', inputs:[{name:'user',type:'address'}], outputs:[{name:'',type:'address'}] },
  { type:'function', name:'referralCount', stateMutability:'view', inputs:[{name:'referrer',type:'address'}], outputs:[{name:'',type:'uint256'}] },
  { type:'function', name:'isRegistered', stateMutability:'view', inputs:[{name:'user',type:'address'}], outputs:[{name:'',type:'bool'}] },
] as const

type ReferralEthereumProvider = { request:(args:{method:string;params?:unknown[]})=>Promise<unknown> }
const referralRegistryAddress = (import.meta.env.VITE_REFERRAL_REGISTRY_ADDRESS || '').trim()


function ReferralProgram({wallet,notify}:{wallet:string;notify:(s:string)=>void}) {
  const [refCount,setRefCount]=useState('—')
  const [boundReferrer,setBoundReferrer]=useState('')
  const [registered,setRegistered]=useState(false)
  const [pending,setPending]=useState(false)
  const [copied,setCopied]=useState(false)
  const [incomingRef,setIncomingRef]=useState('')
  const [status,setStatus]=useState('')
  const link=wallet?`${window.location.origin}/?ref=${wallet}`:''
  const provider=(window as Window & {ethereum?:ReferralEthereumProvider}).ethereum
  const contractReady=Boolean(/^0x[a-fA-F0-9]{40}$/.test(referralRegistryAddress))

  useEffect(()=>{
    const candidate=new URLSearchParams(window.location.search).get('ref')||''
    if(/^0x[a-fA-F0-9]{40}$/.test(candidate)&&candidate.toLowerCase()!==wallet.toLowerCase()) setIncomingRef(candidate)
  },[wallet])

  const readContract=async (functionName:'referrerOf'|'referralCount'|'isRegistered',args:string[]=[]):Promise<unknown>=>{
    if(!provider||!contractReady) throw new Error('Referral registry is not configured. Set VITE_REFERRAL_REGISTRY_ADDRESS after deployment.')
    const data=encodeFunctionData({abi:referralRegistryAbi,functionName,args:args as never})
    const result=await provider.request({method:'eth_call',params:[{to:referralRegistryAddress,data},'latest']}) as `0x${string}`
    return decodeFunctionResult({abi:referralRegistryAbi,functionName,data:result,args:args as never})
  }
  const refresh=async()=>{
    if(!wallet||!contractReady) return
    try{
      const [ref,count,isReg]=await Promise.all([
        readContract('referrerOf',[wallet]),readContract('referralCount',[wallet]),readContract('isRegistered',[wallet])
      ])
      setBoundReferrer(String(ref)==='0x0000000000000000000000000000000000000000'?'':String(ref))
      setRefCount(String(count));setRegistered(Boolean(isReg))
    }catch(e){setStatus(e instanceof Error?e.message:'Could not read referral registry.')}
  }
  useEffect(()=>{void refresh()},[wallet,contractReady])

  const sendContract=async(functionName:'register'|'bindReferrer',args:[]|[string])=>{
    if(!wallet){notify('Connect your wallet first.');return}
    if(!provider){notify('No injected wallet found.');return}
    if(!contractReady){notify('Referral registry contract is not configured yet.');return}
    setPending(true);setStatus('Waiting for wallet confirmation…')
    try{
      const data=encodeFunctionData({abi:referralRegistryAbi,functionName,args:args as never})
      const hash=await provider.request({method:'eth_sendTransaction',params:[{from:wallet,to:referralRegistryAddress,data}]}) as string
      setStatus(`Transaction submitted: ${hash}`);notify('Referral transaction submitted. Waiting for confirmation…')
      const chainId=await provider.request({method:'eth_chainId'}) as string
      const rpcUrl=import.meta.env.VITE_REFERRAL_RPC_URL || ''
      // If a public RPC is configured, wait for the receipt and refresh the on-chain state.
      if(rpcUrl){
        let receipt:unknown=null
        for(let i=0;i<60;i++){
          try{const r=await fetch(rpcUrl,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getTransactionReceipt',params:[hash]})});const j=await r.json() as {result?:unknown};receipt=j.result;if(receipt)break}catch{}
          await new Promise(r=>setTimeout(r,2500))
        }
        if(receipt){setStatus(`Confirmed on chain ${chainId}: ${hash}`);notify('Referral transaction confirmed.');await refresh()}
        else {setStatus(`Submitted on chain ${chainId}. Receipt not confirmed yet; refresh later.`)}
      }else{setStatus(`Submitted: ${hash}. Configure VITE_REFERRAL_RPC_URL to auto-check confirmation.`)}
    }catch(e){const msg=e instanceof Error?e.message:'Referral transaction failed.';setStatus(msg);notify(msg)}
    finally{setPending(false)}
  }

  const copyLink=async()=>{
    if(!link)return
    try{await navigator.clipboard.writeText(link);setCopied(true);notify('Referral link copied.');window.setTimeout(()=>setCopied(false),1800)}
    catch{notify('Could not copy automatically. Select and copy the referral link.')}
  }
  const registerAndBind=async()=>{
    if(!incomingRef){notify('No valid referral address was found in this link.');return}
    if(boundReferrer){notify('This wallet already has a referrer bound; it cannot be changed.');return}
    await sendContract('bindReferrer',[incomingRef])
  }

  return <div className="page-content"><PageHeader eyebrow="GROW / REFERRALS" title="Grow together. Refer transparently." description="Create a shareable referral link and bind referrals on-chain. Referral registration works independently of platform fees; fee rewards will be added later." right={<span className={`pill ${contractReady?'success':'warning'}`}>{contractReady?'Registry configured':'Contract setup required'}</span>}/>
    {!contractReady&&<div className="panel" style={{padding:18,marginBottom:16}}><strong>Referral registry not deployed/configured yet</strong><p style={{margin:'8px 0 0',color:'var(--muted)'}}>Deploy <code>src/contracts/PioReferralRegistry.sol</code> to the target EVM chain, then set <code>VITE_REFERRAL_REGISTRY_ADDRESS</code> and rebuild. Until then, this page will not pretend referral tracking is live.</p></div>}
    <div className="referral-grid"><div className="panel referral-link-card"><div className="eyebrow">YOUR REFERRAL LINK</div><h3>Invite your community.</h3><p>{wallet?'Share your unique wallet-based referral URL. New users can bind your address once on-chain.':'Connect an EVM wallet to create your referral link.'}</p><div className="referral-link-field" style={{overflowWrap:'anywhere'}}>{link||'Connect wallet to generate a link'}</div><button className="secondary-button full" disabled={!link} onClick={()=>void copyLink()}><Copy size={15}/>{copied?'Copied':'Copy referral link'}</button><div className="fee-note" style={{marginTop:12}}><ShieldCheck size={15}/> No platform fee or reward payout is enabled in this release.</div></div>
    <div className="panel referral-calculator"><div className="eyebrow">ON-CHAIN REFERRAL STATUS</div><h3>Your referral dashboard</h3><div className="calculator-list"><div><span>Registered</span><strong>{registered?'Yes':'No'}</strong></div><div><span>Verified direct referrals</span><strong>{refCount}</strong></div><div><span>Bound referrer</span><strong style={{fontSize:12}}>{boundReferrer?fmtAddress(boundReferrer):'None'}</strong></div><div><span>Rewards / claimable</span><strong>Disabled</strong></div></div><button className="primary-button full" disabled={!wallet||!contractReady||pending||registered} onClick={()=>void sendContract('register',[])}>{pending?'Confirm in wallet…':registered?'Wallet registered':'Register wallet'}</button><button className="secondary-button full" style={{marginTop:8}} disabled={!wallet||!contractReady} onClick={()=>void refresh()}>Refresh on-chain status</button></div></div>
    {incomingRef&&<div className="panel" style={{padding:18,marginTop:16}}><div className="eyebrow">YOU WERE INVITED</div><h3>Bind your referrer</h3><p>Referrer wallet: <strong>{fmtAddress(incomingRef)}</strong>. This binding is one-time and irreversible on this registry contract.</p><button className="primary-button" disabled={!wallet||!contractReady||pending||Boolean(boundReferrer)} onClick={()=>void registerAndBind()}>{pending?'Confirm in wallet…':boundReferrer?'Referrer already bound':'Bind referrer on-chain'}</button></div>}
    {status&&<div className="panel" style={{padding:14,marginTop:16,overflowWrap:'anywhere'}}><strong>Transaction status</strong><p style={{margin:'6px 0 0'}}>{status}</p></div>}
    <div className="panel referral-rules" style={{marginTop:16}}><h3>Referral functionality in this release</h3><div className="explainer-grid"><div><strong>On-chain binding</strong><p>Each wallet can bind one referrer once. Self-referrals are rejected by the contract.</p></div><div><strong>Auditable attribution</strong><p>Registry events and referral counts are public and verifiable on the deployed chain.</p></div><div><strong>Rewards later</strong><p>Fee collection and reward payouts are deliberately disabled now. A separate audited reward contract can be added when platform fees are introduced.</p></div></div></div>
  </div>
}
function Portfolio({privacy,setPrivacy,wallet,assets,onConnect}:{privacy:boolean;setPrivacy:(b:boolean)=>void;wallet:string;assets:Asset[];onConnect:()=>void}) {
  type NativeHolding={chain:string;symbol:string;balance:string;usd:number|null;status:string}
  const [holdings,setHoldings]=useState<NativeHolding[]>([])
  const [loading,setLoading]=useState(false)
  const [loadError,setLoadError]=useState('')
  const [refreshKey,setRefreshKey]=useState(0)
  useEffect(()=>{
    let cancelled=false
    if(!wallet){setHoldings([]);setLoadError('');setLoading(false);return}
    const networks=[
      {chain:'Ethereum',symbol:'ETH',rpc:'https://cloudflare-eth.com'},
      {chain:'Arbitrum',symbol:'ETH',rpc:'https://arb1.arbitrum.io/rpc'},
      {chain:'Base',symbol:'ETH',rpc:'https://mainnet.base.org'},
      {chain:'Optimism',symbol:'ETH',rpc:'https://mainnet.optimism.io'},
      {chain:'Polygon',symbol:'POL',rpc:'https://polygon-rpc.com'},
      {chain:'BNB Chain',symbol:'BNB',rpc:'https://bsc-dataseed.binance.org'}
    ]
    const run=async()=>{
      setLoading(true);setLoadError('')
      const results:NativeHolding[]=[]
      let failures=0
      await Promise.all(networks.map(async n=>{
        try{
          const res=await fetch(n.rpc,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getBalance',params:[wallet,'latest']})})
          if(!res.ok)throw new Error('RPC unavailable')
          const json=await res.json() as {result?:string;error?:unknown}
          if(!json.result||json.error)throw new Error('RPC response invalid')
          const wei=BigInt(json.result)
          const whole=Number(wei)/1e18
          if(whole>0){const priceAsset=assets.find(a=>a.symbol===n.symbol);const price=priceAsset?Number(priceAsset.price.replace(/[$,]/g,'')):NaN;results.push({chain:n.chain,symbol:n.symbol,balance:whole.toLocaleString(undefined,{maximumFractionDigits:6}),usd:Number.isFinite(price)?whole*price:null,status:'Native balance via public RPC'})}
        }catch{failures++}
      }))
      if(!cancelled){setHoldings(results.sort((a,b)=>(b.usd??0)-(a.usd??0)));setLoadError(failures===networks.length?'Public RPC endpoints were unavailable. Retry later.':failures?'Some networks could not be queried; displayed holdings may be partial.':'');setLoading(false)}
    }
    void run()
    return()=>{cancelled=true}
  },[wallet,assets,refreshKey])
  const total=holdings.reduce((sum,h)=>sum+(h.usd??0),0)
  const hasUnpriced=holdings.some(h=>h.usd===null)
  return <div className="page-content"><PageHeader eyebrow="MANAGE / PORTFOLIO" title="Your assets, in context." description="Native balances are queried directly from supported EVM networks. Token balances and full portfolio indexing are not included yet." right={<button className="icon-button" onClick={()=>setPrivacy(!privacy)} aria-label={privacy?'Show portfolio values':'Hide portfolio values'}>{privacy?<Eye size={17}/>:<EyeOff size={17}/>}</button>}/><div className="portfolio-overview-grid"><div className="panel portfolio-large"><span className="muted-label">ESTIMATED NATIVE-ASSET VALUE</span><div className="portfolio-value">{privacy?'••••••':holdings.length?`${hasUnpriced?'≈ ':''}${formatUsd(total)}`:'— — —'}</div><div className="portfolio-sub">{wallet?loading?'Reading balances from public RPCs…':`Connected ${fmtAddress(wallet)} · ${holdings.length} native balance${holdings.length===1?'':'s'} found`:'No wallet connected'}</div><div className="allocation-empty"><div className="empty-ring"/><span>Value excludes ERC-20/SPL tokens and may be partial. Missing prices are not counted as zero.</span></div>{!wallet&&<button className="primary-button" onClick={onConnect}>Connect wallet <ArrowRight size={15}/></button>}</div><div className="panel portfolio-large"><div className="panel-top"><h3>Network exposure</h3><Globe2 size={17}/></div>{holdings.length?<div className="native-holdings">{holdings.map(h=><div className="native-holding-row" key={h.chain}><span>{h.chain}</span><strong>{privacy?'••••':`${h.balance} ${h.symbol}`}</strong></div>)}</div>:<div className="empty-state"><div className="empty-icon"><Grid2X2 size={22}/></div><strong>{loading?'Checking supported networks…':'No native balances found'}</strong><p>{wallet?'Only supported EVM native assets are queried. Other chains show as coming soon.':'Connect a wallet to read public on-chain balances.'}</p></div>}</div></div><div className="panel market-panel"><div className="section-in-panel"><h3>Native asset holdings</h3><span className="pill neutral">{loading?'Refreshing':holdings.length?'RPC data':'No data'}</span></div>{loadError&&<div className="data-note">{loadError}</div>}{holdings.length?<div className="native-holdings">{holdings.map(h=><div className="native-holding-row" key={h.chain}><div><strong>{h.symbol}</strong><small>{h.chain} · {h.status}</small></div><strong>{privacy?'••••':`${h.balance} ${h.symbol}`}</strong><strong>{privacy?'••••':h.usd===null?'Price unavailable':formatUsd(h.usd)}</strong></div>)}</div>:<div className="empty-state compact"><Wallet size={24}/><strong>{loading?'Loading balances':'No native balances to display'}</strong><p>{wallet?'Token balances require a token indexer; this page currently queries native coin balances only.':'Connect a wallet to begin.'}</p></div>}{wallet&&<button className="secondary-button" onClick={()=>setRefreshKey(k=>k+1)}>Refresh balances</button>}</div></div>
}
function ActivityPage({wallet}:{wallet:string}) {
  return <div className="page-content"><PageHeader eyebrow="MANAGE / ACTIVITY" title="Every step, visible." description="A single view of supported on-chain activity, with statuses backed by verified transaction data."/><div className="activity-filters">{['All','Swaps','Cross-chain','Approvals'].map((t,i)=><button key={t} className={i===0?'selected':''}>{t}</button>)}</div><div className="panel empty-state large"><div className="empty-icon"><Activity size={24}/></div><strong>{wallet?'No indexed activity yet':'Connect a wallet to begin'}</strong><p>{wallet?'An activity indexer is not configured, so no transaction history can be shown.':'PioSwap will only display transactions that can be verified from supported chain data.'}</p></div></div>
}
function TokenExplorer({assets:rows,query,setQuery}:{assets:Asset[];query:string;setQuery:(s:string)=>void}) {
  return <div className="page-content"><PageHeader eyebrow="DISCOVER / TOKEN EXPLORER" title="Look closer." description="Search assets and distinguish token identity from liquidity and risk."/><div className="search-field explorer-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Token name, symbol, or contract address"/></div><div className="panel market-panel"><AssetTable rows={rows} watchlist={[]} toggleWatch={()=>{}} onSelect={()=>{}}/><div className="data-note"><ShieldCheck size={15}/> PIO identity and contract details are not yet configured. Verification is not a guarantee of safety.</div></div><div className="panel explainer"><h3>What verification means</h3><div className="explainer-grid"><div><strong>Identity</strong><p>Network, contract address, decimals, and authoritative references.</p></div><div><strong>Market quality</strong><p>Liquidity and pricing quality when reliable data is available.</p></div><div><strong>Risk signals</strong><p>Independent warnings where supported, without a universal safety guarantee.</p></div></div></div></div>
}
function Analytics() {
  return <div className="page-content"><PageHeader eyebrow="DISCOVER / ANALYTICS" title="Evidence over noise." description="Market and route analytics will be sourced from real data providers."/><div className="metric-grid">{[{t:'Market volume',v:'—',s:'Source not connected'},{t:'Active networks',v:'—',s:'Supported network list pending'},{t:'Route success',v:'—',s:'Requires verified execution history'},{t:'Average execution',v:'—',s:'Requires transaction samples'}].map(m=><div className="panel metric-card" key={m.t}><span>{m.t}</span><strong>{m.v}</strong><small>{m.s}</small></div>)}</div><div className="panel chart-panel analytics-chart"><div className="panel-top"><h3>Market activity</h3><span className="pill neutral">No feed</span></div><div className="chart-placeholder"><LineChart size={40}/><strong>Analytics will appear here</strong><span>Historical and live data are not connected.</span></div></div></div>
}
function SecurityCenter() {
  const checks=[['Wallet signing','External wallet confirmation required'],['PIO token identity','Pending official token details'],['Market-data source','Not configured'],['Transaction simulation','Not configured'],['Incident status','No status provider connected']]
  return <div className="page-content"><PageHeader eyebrow="DISCOVER / SECURITY" title="Know before you sign." description="Security controls must reflect actual checks, not a decorative safety score."/><div className="security-banner"><div className="security-banner-icon"><ShieldCheck size={24}/></div><div><strong>Trading is disabled in this preview.</strong><p>No claim of production security or audit status is made.</p></div><span className="pill warning">Preview</span></div><div className="panel checks-panel">{checks.map(([t,d])=><div className="check-row" key={t}><div className="check-row-icon"><FileCheck2 size={17}/></div><div><strong>{t}</strong><span>{d}</span></div><span className="pill neutral">Pending</span></div>)}</div><div className="panel explainer"><h3>Before launch</h3><p>Enable execution only after token and network verification, quote validation, transaction-target checks, simulation where supported, independent security review, and critical-path tests are complete.</p></div></div>
}
function SettingsPage({theme,setTheme,settings,setSettings,notify}:{theme:'dark'|'light';setTheme:(t:'dark'|'light')=>void;settings:{alerts:boolean;slippage:string;compact:boolean};setSettings:(s:{alerts:boolean;slippage:string;compact:boolean})=>void;notify:(s:string)=>void}) {
  return <div className="page-content"><PageHeader eyebrow="PREFERENCES" title="Make it yours." description="Preferences stay on this device in this version."/><div className="settings-layout"><div className="panel settings-panel"><h3>Appearance</h3><p>Choose the surface that feels right.</p><div className="theme-choices"><button className={theme==='dark'?'selected':''} onClick={()=>setTheme('dark')}><span className="theme-swatch dark-swatch"/>Dark graphite {theme==='dark'&&<Check size={15}/>}</button><button className={theme==='light'?'selected':''} onClick={()=>setTheme('light')}><span className="theme-swatch light-swatch"/>Warm ivory {theme==='light'&&<Check size={15}/>}</button></div><div className="setting-row"><div><strong>Compact data tables</strong><span>Reduce vertical spacing in dense market views.</span></div><button className={`switch ${settings.compact?'on':''}`} onClick={()=>setSettings({...settings,compact:!settings.compact})} aria-label="Toggle compact tables"><span/></button></div><div className="setting-row"><div><strong>Asset alerts</strong><span>Opt in to alerts when a notification service is available.</span></div><button className={`switch ${settings.alerts?'on':''}`} onClick={()=>setSettings({...settings,alerts:!settings.alerts})} aria-label="Toggle asset alerts"><span/></button></div><div className="setting-row"><div><strong>Default slippage</strong><span>Applied only as a preference; execution is not enabled.</span></div><select className="small-select" value={settings.slippage} onChange={e=>setSettings({...settings,slippage:e.target.value})}><option value="0.10">0.10%</option><option value="0.50">0.50%</option><option value="1.00">1.00%</option></select></div><button className="secondary-button" onClick={()=>notify('Preferences are saved locally in this browser.')}>Save preferences <Check size={15}/></button></div><div className="panel settings-panel"><h3>Privacy & wallet</h3><p>Connection does not grant custody or authorize transactions.</p><div className="setting-row"><div><strong>Local-first preferences</strong><span>No account or cloud sync is configured.</span></div><span className="pill neutral">On device</span></div><div className="setting-row"><div><strong>Seed phrase storage</strong><span>PioSwap never requests or stores recovery phrases.</span></div><ShieldCheck size={19}/></div><div className="setting-row"><div><strong>Network preferences</strong><span>Network support will be enabled after validation.</span></div><span className="pill neutral">Pending</span></div></div></div></div>
}
function Unavailable({title,eyebrow,description}:{title:string;eyebrow:string;description:string}) {
  return <div className="page-content"><PageHeader eyebrow={eyebrow} title={title} description={description}/><div className="panel empty-state large"><div className="empty-icon"><LockKeyhole size={23}/></div><strong>Not enabled in this build</strong><p>This area is designed into the product, but the underlying service is not connected. It will not show simulated activity as real.</p><span className="pill neutral">Integration required</span></div></div>
}
export default App
