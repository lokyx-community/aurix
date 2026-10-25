import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, ArrowDownUp, ArrowLeftRight, ArrowRight, Bell, BookOpen, Check, ChevronDown,
  CircleHelp, Clock3, Command, Compass, Copy, ExternalLink, Eye, EyeOff, FileCheck2,
  Globe2, Grid2X2, LayoutDashboard, LineChart, LockKeyhole, Menu, MoreHorizontal,
  Plus, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Star, TrendingDown,
  TrendingUp, Wallet, X, Zap
} from 'lucide-react'

type Page = 'Overview' | 'Swap' | 'Markets' | 'Advanced Trading' | 'Limit Orders' | 'Portfolio' | 'Earn' | 'Cross-Chain' | 'Activity' | 'Token Explorer' | 'Analytics' | 'Security Center' | 'Referral Program' | 'Settings'
type Asset = { symbol: string; name: string; color: string; letter: string; logo?: string; id?: string; price: string; change: string; positive: boolean; marketCap?: number; volume?: number; rank?: number }

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
  return <div className="brand"><span className="brand-mark">P<span>·</span></span><span>aur<span className="brand-light">ix</span></span></div>
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
    const savedTheme = localStorage.getItem('aurix-theme')
    if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme)
    const savedWatch = localStorage.getItem('aurix-watchlist')
    if (savedWatch) { try { setWatchlist(JSON.parse(savedWatch)) } catch { /* ignore invalid local preference */ } }
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
        for (const important of seedAssets.filter(a => ['USDC'].includes(a.symbol))) if (!merged.some(a => a.symbol === important.symbol)) merged.push(important)
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
  useEffect(() => { localStorage.setItem('aurix-theme', theme) }, [theme])
  useEffect(() => { localStorage.setItem('aurix-watchlist', JSON.stringify(watchlist)) }, [watchlist])
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
        <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><strong>Need a hand?</strong><p>Explore guides to trading safely.</p><button onClick={()=>notify('Help center is not connected yet.')}>Visit help center <ArrowRight size={13}/></button></div><div className="version">AURIX PREVIEW <span>·</span> 0.1.0</div></div>
      </aside>

      <main className="main">
        {page === 'Overview' && <Overview onNavigate={navTo} wallet={wallet} privacy={privacy} setPrivacy={setPrivacy} watchlist={watchlist} toggleWatch={toggleWatch} notify={notify} assets={marketAssets} marketStatus={marketStatus} marketUpdated={marketUpdated} />}
        {page === 'Swap' && <Swap assets={marketAssets} fromAsset={fromAsset} toAsset={toAsset} setFromAsset={setFromAsset} setToAsset={setToAsset} amount={amount} setAmount={setAmount} wallet={wallet} onConnect={()=>setModal('connect')} onPreview={doSwapPreview} notify={notify} />}
        {page === 'Markets' && <Markets query={query} setQuery={setQuery} assets={filteredAssets} watchlist={watchlist} toggleWatch={toggleWatch} marketStatus={marketStatus} marketUpdated={marketUpdated} onSelect={() => navTo('Token Explorer')} />}
        {page === 'Advanced Trading' && <AdvancedTrading notify={notify}/>}
        {page === 'Limit Orders' && <Unavailable title="Limit orders" eyebrow="ADVANCED TRADING" description="Limit orders require a real execution or monitoring mechanism. No simulated orders will be shown as active." />}
        {page === 'Cross-Chain' && <CrossChain notify={notify} wallet={wallet} onConnect={()=>setModal('connect')}/>}
        {page === 'Portfolio' && <Portfolio privacy={privacy} setPrivacy={setPrivacy} wallet={wallet} onConnect={()=>setModal('connect')}/>}
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
      {[{n:'Overview' as Page,i:LayoutDashboard},{n:'Swap' as Page,i:ArrowLeftRight},{n:'Markets' as Page,i:LineChart},{n:'Portfolio' as Page,i:Wallet},{n:'Activity' as Page,i:Activity}].map(it=><button key={it.n} className={page===it.n?'active':''} onClick={()=>navTo(it.n)}><it.i size={19}/><span>{it.n==='Overview'?'Home':it.n}</span></button>)}
    </nav>

    {toast && <div className="toast"><Check size={16}/>{toast}<button onClick={()=>setToast('')}><X size={14}/></button></div>}
    {modal !== 'none' && <div className="modal-backdrop" onClick={()=>setModal('none')}><div className="modal" onClick={e=>e.stopPropagation()}>
      <button className="modal-close icon-button" onClick={()=>setModal('none')}><X size={18}/></button>
      {modal==='connect' ? <><div className="modal-symbol"><Wallet size={24}/></div><h2>Connect your wallet</h2><p>Connect a self-custody wallet to view its public address. Aurix will never ask for your recovery phrase.</p><button className="primary-button full" disabled={walletBusy} onClick={connectWallet}>{walletBusy?'Connecting…':'Connect browser wallet'} <ArrowRight size={16}/></button><div className="modal-note"><LockKeyhole size={14}/> Connection only. Trading is not enabled in this preview.</div></> :
      <><div className="modal-symbol"><ShieldCheck size={24}/></div><h2>Execution not configured</h2><p>This preview does not have a verified PIO contract, swap provider, chain configuration, or transaction preflight. No transaction will be submitted.</p><button className="primary-button full" onClick={()=>setModal('none')}>Got it <Check size={16}/></button></>}
    </div></div>}
    <footer className="footer"><span>© 2026 Aurix</span><span>Market data by CoinGecko · Built for clarity, not noise.</span><span className="preview-label"><span/> Preview build · trading disabled</span></footer>
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
    <div className="status-strip"><div className="status-item"><span className="status-indicator muted"/> PIO token <strong>Awaiting verification</strong></div><div className="status-item"><span className="status-indicator"/> Wallet status <strong>{wallet?'Connected':'Not connected'}</strong></div><div className="status-item"><span className="status-indicator muted"/> Live data <strong>Not configured</strong></div></div>
    <div className="section-heading"><div><div className="eyebrow">YOUR OVERVIEW</div><h2>A little more clarity.</h2></div><button className="icon-button" onClick={()=>setPrivacy(!privacy)} title={privacy?'Show balances':'Hide balances'}>{privacy?<Eye size={17}/>:<EyeOff size={17}/>}</button></div>
    <div className="overview-grid">
      <div className="panel portfolio-card"><div className="panel-top"><span className="muted-label">TOTAL PORTFOLIO VALUE</span><span className="pill neutral">Wallet {wallet?'connected':'not connected'}</span></div><div className="portfolio-value">{privacy?'••••••':'— — —'}</div><div className="portfolio-sub">{wallet?'Live valuation provider not configured':'Connect your wallet to begin'}</div><div className="mini-chart"><svg viewBox="0 0 600 82" preserveAspectRatio="none" aria-label="No portfolio history available"><path d="M0 70 L600 70" stroke="currentColor" strokeOpacity=".1" fill="none" strokeDasharray="4 5"/><text x="300" y="45" textAnchor="middle" fill="currentColor" opacity=".48" fontSize="12">Portfolio history will appear here</text></svg></div><div className="portfolio-bottom"><span>Performance</span><span className="muted-text">Unavailable without historical data</span></div><button className="secondary-button full" onClick={()=>onNavigate('Portfolio')}>View portfolio <ArrowRight size={15}/></button></div>
      <div className="panel quick-swap"><div className="panel-heading"><div><div className="eyebrow">QUICK ACTION</div><h3>Swap, simply.</h3></div><button className="icon-button" onClick={()=>onNavigate('Swap')}><ArrowUpDownIcon/></button></div><div className="quick-swap-field"><span>You pay</span><strong>Enter amount</strong><span className="field-token"><span className="token-mini">Ξ</span> ETH <ChevronDown size={13}/></span></div><div className="swap-mid"><span><ArrowDownUp size={15}/></span></div><div className="quick-swap-field second"><span>You receive</span><strong>—</strong><span className="field-token"><span className="token-mini pio">P</span> PIO <ChevronDown size={13}/></span></div><div className="quote-hint"><ShieldCheck size={14}/> Quote and token verification required</div><button className="primary-button full" onClick={()=>onNavigate('Swap')}>Open swap <ArrowRight size={15}/></button></div>
    </div>
    <div className="section-heading market-section-head"><div><div className="eyebrow">MARKET WATCH</div><h2>Markets in focus.</h2></div><button className="text-button" onClick={()=>onNavigate('Markets')}>View all markets <ArrowRight size={15}/></button></div>
    <div className="panel market-panel"><div className="table-tabs">{['Watchlist','All','Gainers'].map(t=><button key={t} className={marketTab===t?'active':''} onClick={()=>setMarketTab(t)}>{t}</button>)}</div><AssetTable rows={shown} watchlist={watchlist} toggleWatch={toggleWatch} onSelect={()=>onNavigate('Token Explorer')}/><div className="data-note"><span className={`status-indicator ${marketStatus==='live'?'':'muted'}`}/> {marketStatus==='live'?`Live market data via CoinGecko · refreshed ${marketUpdated}. PIO is not listed in this feed.`:marketStatus==='loading'?'Loading live market data…':'Live market data is temporarily unavailable or rate-limited. Values are not being fabricated.'}</div></div>
    <div className="feature-row"><button className="feature-card" onClick={()=>onNavigate('Cross-Chain')}><div className="feature-icon"><Globe2 size={19}/></div><span className="feature-title">Across chains</span><span className="feature-desc">Compare routes before you move.</span><ArrowRight size={16}/></button><button className="feature-card" onClick={()=>onNavigate('Security Center')}><div className="feature-icon"><ShieldCheck size={19}/></div><span className="feature-title">Know before you sign</span><span className="feature-desc">Preflight checks, not guesswork.</span><ArrowRight size={16}/></button><button className="feature-card" onClick={()=>onNavigate('Activity')}><div className="feature-icon"><Activity size={19}/></div><span className="feature-title">Every step, visible</span><span className="feature-desc">Follow transactions from start to finish.</span><ArrowRight size={16}/></button></div>
  </div>
}
function ArrowUpDownIcon(){return <ArrowDownUp size={16}/>}
function AssetTable({rows,watchlist,toggleWatch,onSelect}:{rows:Asset[];watchlist:string[];toggleWatch:(s:string)=>void;onSelect:()=>void}) {
  return <div className="table-wrap"><table className="asset-table"><thead><tr><th>Asset</th><th>Price</th><th>24h change</th><th className="right market-cap-col">Market cap</th><th className="right">Watch</th></tr></thead><tbody>{rows.map((a,i)=><tr key={`${a.id ?? a.symbol}-${i}`} onClick={onSelect}><td><div className="asset-cell"><AssetIcon asset={a}/><span><strong>{a.name}</strong><small>{a.symbol}{a.symbol==='PIO'?' · Unverified':''}</small></span></div></td><td className={a.symbol==='PIO'?'muted-text':'mono'}>{a.price}</td><td><span className={`change ${a.positive?'positive':'negative'}`}>{a.symbol==='PIO'?'—':a.change}</span></td><td className="right mono market-cap-col">{a.symbol==='PIO'?'—':formatCompactUsd(a.marketCap)}</td><td className="right"><button className={`star-button ${watchlist.includes(a.symbol)?'starred':''}`} aria-label={`Toggle ${a.symbol} watchlist`} onClick={e=>{e.stopPropagation();toggleWatch(a.symbol)}}><Star size={16} fill={watchlist.includes(a.symbol)?'currentColor':'none'}/></button></td></tr>)}</tbody></table></div>
}
function Swap({assets,fromAsset,toAsset,setFromAsset,setToAsset,amount,setAmount,wallet,onConnect,onPreview,notify}:{assets:Asset[];fromAsset:string;toAsset:string;setFromAsset:(s:string)=>void;setToAsset:(s:string)=>void;amount:string;setAmount:(s:string)=>void;wallet:string;onConnect:()=>void;onPreview:()=>void;notify:(s:string)=>void}) {
  const [advanced,setAdvanced] = useState(false)
  const [slippage,setSlippage] = useState('0.50')
  const [assetSelect,setAssetSelect] = useState<'from'|'to'|null>(null)
  const [fromChain,setFromChain] = useState('Ethereum')
  const [toChain,setToChain] = useState('Ethereum')
  const [tokenQuery,setTokenQuery] = useState('')
  const chains = ['Ethereum','Arbitrum','Base','Optimism','Polygon','BNB Chain','Avalanche','Solana']
  const chainTokens: Record<string,string[]> = {
    'Ethereum':['ETH','USDC','USDT','WBTC','LINK','UNI'], 'Arbitrum':['ETH','USDC','USDT','ARB','LINK'],
    'Base':['ETH','USDC','AERO'], 'Optimism':['ETH','USDC','OP'], 'Polygon':['POL','USDC','USDT','LINK'],
    'BNB Chain':['BNB','USDT','CAKE'], 'Avalanche':['AVAX','USDC','USDT','LINK'], 'Solana':['SOL','USDC','USDT','JUP']
  }
  const tokenList = assets.filter(a => chainTokens[(assetSelect==='from'?fromChain:toChain)]?.includes(a.symbol) && `${a.name} ${a.symbol}`.toLowerCase().includes(tokenQuery.toLowerCase()))
  const from=assets.find(a=>a.symbol===fromAsset) ?? seedAssets[0], to=assets.find(a=>a.symbol===toAsset) ?? seedAssets[1]
  const sameChain = fromChain === toChain
  const supportedToken = (chain:string,symbol:string) => Boolean(chainTokens[chain]?.includes(symbol))
  const chooseChain = (side:'from'|'to', chain:string) => {
    if(side==='from'){setFromChain(chain); if(!supportedToken(chain,fromAsset)) setFromAsset((chainTokens[chain]||['ETH'])[0])}
    else {setToChain(chain); if(!supportedToken(chain,toAsset)) setToAsset((chainTokens[chain]||['ETH'])[0])}
  }
  return <div className="page-content narrow-page"><PageHeader eyebrow="TRADE / SWAP" title="Swap, with clarity." description="Choose a network first, then choose a token available on that network. No invented quotes or routes."/>
    <div className="swap-layout"><div className="swap-main panel swap-luxury-card">
      <div className="chain-pair-selectors"><label><span>PAY ON</span><select value={fromChain} onChange={e=>chooseChain('from',e.target.value)}>{chains.map(c=><option key={c}>{c}</option>)}</select></label><label><span>RECEIVE ON</span><select value={toChain} onChange={e=>chooseChain('to',e.target.value)}>{chains.map(c=><option key={c}>{c}</option>)}</select></label></div>
      <div className="swap-card-head"><div className="eyebrow">YOU PAY · {fromChain.toUpperCase()}</div><span className="muted-text">Wallet balance not indexed</span></div>
      <div className="amount-row"><input value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,''))} placeholder="0.00" inputMode="decimal" aria-label="Amount to pay"/><button className="token-select" onClick={()=>{setAssetSelect('from');setTokenQuery('')}}><AssetIcon asset={from} size="sm"/>{from.symbol}<ChevronDown size={15}/></button></div>
      <div className="amount-foot"><span>USD estimate requires a verified quote</span><button onClick={()=>notify(wallet?'Wallet balance lookup is not integrated yet.':'Connect a wallet to inspect balance.')}>MAX</button></div>
      <div className="swap-direction"><button className="round-icon" onClick={()=>{setFromAsset(toAsset);setToAsset(fromAsset);setFromChain(toChain);setToChain(fromChain)}} aria-label="Reverse assets and networks"><ArrowDownUp size={17}/></button></div>
      <div className="swap-card-head"><div className="eyebrow">YOU RECEIVE · {toChain.toUpperCase()}</div><span className="muted-text">No live quote</span></div>
      <div className="amount-row"><div className="output-amount">—</div><button className="token-select" onClick={()=>{setAssetSelect('to');setTokenQuery('')}}><AssetIcon asset={to} size="sm"/>{to.symbol}<ChevronDown size={15}/></button></div>
      <div className="amount-foot"><span>Output appears only after a provider returns a quote</span></div>
      {assetSelect&&<div className="asset-picker"><div className="picker-head"><strong>Select {assetSelect==='from'?'pay':'receive'} token · {assetSelect==='from'?fromChain:toChain}</strong><button className="icon-button" onClick={()=>setAssetSelect(null)}><X size={16}/></button></div><input className="text-input token-search-input" value={tokenQuery} onChange={e=>setTokenQuery(e.target.value)} placeholder="Search available tokens"/>{tokenList.length?tokenList.map(a=><button key={`${assetSelect}-${a.symbol}`} className="picker-row" onClick={()=>{assetSelect==='from'?setFromAsset(a.symbol):setToAsset(a.symbol);setAssetSelect(null)}}><AssetIcon asset={a}/><span>{a.name}<small>{a.symbol}</small></span><ArrowRight size={15}/></button>):<div className="picker-empty">No verified token list for this network yet.</div>}</div>}
      <div className="quote-summary"><div><span>Route</span><strong>{sameChain?'Same-chain route':'Cross-chain route required'}</strong></div><div><span>Network fee</span><strong>Unavailable</strong></div><div><span>Price impact</span><strong>Unavailable</strong></div><div><span>Quote status</span><strong>Provider not connected</strong></div></div>
      {!sameChain&&<div className="inline-warning"><ShieldCheck size={15}/> You selected different networks. Use Cross-Chain to check bridge availability; no bridge quote is currently available.</div>}
      <button className="disclosure-row" onClick={()=>setAdvanced(!advanced)}><span><Settings2 size={15}/> Advanced settings</span><ChevronDown size={15} className={advanced?'rotated':''}/></button>
      {advanced&&<div className="advanced-settings"><label>Slippage tolerance</label><div className="slippage-options">{['0.10','0.50','1.00'].map(s=><button key={s} className={slippage===s?'selected':''} onClick={()=>setSlippage(s)}>{s}%</button>)}</div><p>Preference only. Execution remains disabled until a provider supplies a validated quote and transaction data.</p></div>}
      <button className="primary-button full swap-cta" onClick={()=>{if(!wallet){onConnect();return} if(!amount||Number(amount)<=0){notify('Enter an amount greater than zero.');return} if(fromAsset===toAsset&&fromChain===toChain){notify('Choose different assets to swap.');return} notify('No live route provider is connected. Nothing was submitted.')}}>{wallet?'Check live route':'Connect wallet to continue'} <ArrowRight size={16}/></button>
      <div className="safe-note"><ShieldCheck size={15}/> No transaction is submitted without a verified provider quote.</div>
    </div><aside className="swap-aside"><div className="panel aside-panel"><div className="aside-heading"><ShieldCheck size={18}/><strong>Before a swap can execute</strong></div><p>A live router must return a quote and transaction payload. Aurix will validate chain, token addresses, recipient, approvals, fees and quote expiry before wallet handoff.</p><ul><li><Check size={14}/> Network and token selection</li><li><Check size={14}/> Itemized fees</li><li><Check size={14}/> Quote freshness</li><li><Check size={14}/> Wallet confirmation</li></ul></div><div className="panel aside-panel"><div className="eyebrow">PIO ASSET STATUS</div><h3>Verification pending</h3><p>PIO token details have not been supplied. It is intentionally excluded from selectable trade assets.</p><span className="pill warning">Not tradable yet</span></div></aside></div>
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
function CrossChain({notify,wallet,onConnect}:{notify:(s:string)=>void;wallet:string;onConnect:()=>void}) {
  const [from,setFrom]=useState('Ethereum');const [to,setTo]=useState('Solana');const [asset,setAsset]=useState('USDC');const [amount,setAmount]=useState('')
  return <div className="page-content narrow-page"><PageHeader eyebrow="TRADE / CROSS-CHAIN" title="One flow. Two chains." description="Compare a source and destination before committing to a route."/><div className="panel bridge-panel"><div className="chain-label">FROM NETWORK</div><div className="chain-select"><span className="chain-icon eth"><img src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png" alt="Ethereum logo"/></span><select value={from} onChange={e=>setFrom(e.target.value)}><option>Ethereum</option><option>Arbitrum</option><option>Base</option><option>Polygon</option></select><ChevronDown size={15}/></div><label>Token and amount</label><div className="amount-row bridge-amount"><input value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,''))} placeholder="0.00"/><select value={asset} onChange={e=>setAsset(e.target.value)}><option>USDC</option><option>ETH</option><option>USDT</option></select></div><div className="bridge-switch"><button className="round-icon" onClick={()=>{setFrom(to);setTo(from)}}><ArrowDownUp size={16}/></button></div><div className="chain-label">TO NETWORK</div><div className="chain-select"><span className="chain-icon sol"><img src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png" alt="Solana logo"/></span><select value={to} onChange={e=>setTo(e.target.value)}><option>Solana</option><option>Ethereum</option><option>Arbitrum</option><option>Base</option><option>Polygon</option></select><ChevronDown size={15}/></div><div className="bridge-disclosure"><div><span>Route provider</span><strong>Not configured</strong></div><div><span>Estimated receive</span><strong>—</strong></div><div><span>Network and provider fees</span><strong>—</strong></div><div><span>Destination confirmation</span><strong>Unavailable</strong></div></div><button className="primary-button full" onClick={()=>{if(from===to)notify('Choose two different networks.');else if(!wallet)onConnect();else notify('Cross-chain execution is disabled until a supported provider and token configuration are verified.')}}>{wallet?'Check route availability':'Connect wallet'} <ArrowRight size={16}/></button><div className="safe-note"><ShieldCheck size={15}/> No bridge route or completion time is being promised.</div></div></div>
}
function ReferralProgram({wallet,notify}:{wallet:string;notify:(s:string)=>void}) {
  const [address,setAddress]=useState('')
  const [fee,setFee]=useState('100')
  const [copied,setCopied]=useState(false)
  const splits=[{label:'Platform treasury',pct:50,detail:'Protocol operations, security and development'},{label:'Liquidity provider',pct:30,detail:'Liquidity provider reward allocation'},{label:'Direct LP referrer · L1',pct:10,detail:'Wallet that referred the liquidity provider'},{label:'Level 2',pct:5,detail:'Upstream referrer in the LP referral tree'},{label:'Level 3',pct:3,detail:'Third referral level'},{label:'Level 4',pct:2,detail:'Fourth referral level'}]
  const total=Number(fee)||0
  const fmt=(n:number)=>n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:4})
  const link=wallet?`${window.location.origin}/?lp-ref=${wallet}`:''
  return <div className="page-content"><PageHeader eyebrow="GROW / LIQUIDITY REFERRALS" title="Grow liquidity. Share the upside." description="A transparent proposed fee allocation for liquidity providers and the people who bring them in." right={<span className="pill warning">Design preview · not on-chain</span>}/>
    <div className="referral-hero panel"><div className="referral-glow"/><div className="eyebrow">LIQUIDITY PROVIDER REFERRAL PROGRAM</div><h2>100% of the fee,<br/><em>accounted for.</em></h2><p>Every fee share is visible before implementation. This page models the proposed distribution; no rewards are currently paid or tracked on-chain.</p><div className="referral-actions"><button className="primary-button" onClick={()=>wallet?notify('Referral tracking is not deployed yet. This is a preview link only.'):notify('Connect your wallet to preview your referral link.')}>{wallet?'Preview my referral link':'Connect wallet'} <ArrowRight size={15}/></button><span className="safe-note"><ShieldCheck size={14}/> No referral earnings are claimed</span></div></div>
    <div className="referral-grid"><div className="panel referral-split-panel"><div className="panel-top"><div><div className="eyebrow">PROPOSED FEE SPLIT</div><h3>Where each fee goes</h3></div><span className="pill neutral">100% total</span></div>{splits.map((s,i)=><div className="split-row" key={s.label}><div className="split-rank">{String(i+1).padStart(2,'0')}</div><div className="split-copy"><strong>{s.label}</strong><span>{s.detail}</span><div className="split-bar"><span style={{width:`${s.pct*2}%`}}/></div></div><strong className="split-pct">{s.pct}%</strong></div>)}<div className="fee-note"><ShieldCheck size={15}/> The split totals 100% of the defined fee pool. Smart-contract accounting, rounding rules, eligibility, and payout gas costs must be specified before deployment.</div></div>
    <div className="referral-side"><div className="panel referral-calculator"><div className="eyebrow">FEE DISTRIBUTION CALCULATOR</div><h3>See a sample fee</h3><label>Example total fee (USD)</label><input className="text-input" value={fee} onChange={e=>setFee(e.target.value.replace(/[^0-9.]/g,''))} inputMode="decimal"/><div className="calculator-list">{splits.map(s=><div key={s.label}><span>{s.label}</span><strong>{fmt(total*s.pct/100)}</strong></div>)}</div><div className="calculator-total"><span>Total allocated</span><strong>{fmt(splits.reduce((sum,s)=>sum+total*s.pct/100,0))}</strong></div></div><div className="panel referral-link-card"><div className="eyebrow">YOUR REFERRAL LINK</div><h3>Bring quality liquidity.</h3><p>{wallet?'A preview link is generated from your connected public wallet address.':'Connect a wallet to preview a referral link.'}</p><div className="referral-link-field">{link||'Connect wallet to generate link'}</div><button className="secondary-button full" disabled={!link} onClick={()=>{void navigator.clipboard?.writeText(link);setCopied(true);notify('Preview referral link copied. Tracking is not active yet.')}}><Copy size={15}/>{copied?'Copied':'Copy preview link'}</button><small>Referral attribution, anti-sybil rules and payouts require backend and contract implementation.</small></div></div></div>
    <div className="panel referral-rules"><h3>Rules that must be locked before launch</h3><div className="explainer-grid"><div><strong>Eligible fees</strong><p>Define whether the fee pool is protocol fees only or also includes LP and network costs. Network gas should not be silently shared.</p></div><div><strong>Referral tree</strong><p>Use immutable or governed referral binding, with self-referral prevention and explicit handling of missing levels.</p></div><div><strong>Accounting & claims</strong><p>Track accrued amounts on-chain or in auditable backend records. Never display simulated rewards as withdrawable balances.</p></div></div></div>
  </div>
}

function Portfolio({privacy,setPrivacy,wallet,onConnect}:{privacy:boolean;setPrivacy:(b:boolean)=>void;wallet:string;onConnect:()=>void}) {
  return <div className="page-content"><PageHeader eyebrow="MANAGE / PORTFOLIO" title="Your assets, in context." description="Real balances and valuations will populate after wallet and data integrations are configured." right={<button className="icon-button" onClick={()=>setPrivacy(!privacy)}>{privacy?<Eye size={17}/>:<EyeOff size={17}/>}</button>}/><div className="portfolio-overview-grid"><div className="panel portfolio-large"><span className="muted-label">TOTAL VERIFIED VALUE</span><div className="portfolio-value">{privacy?'••••••':'— — —'}</div><div className="portfolio-sub">{wallet?'Wallet connected · price provider unavailable':'No wallet connected'}</div><div className="allocation-empty"><div className="empty-ring"/><span>Allocation unavailable until real holdings are indexed.</span></div>{!wallet&&<button className="primary-button" onClick={onConnect}>Connect wallet <ArrowRight size={15}/></button>}</div><div className="panel portfolio-large"><div className="panel-top"><h3>Network exposure</h3><Globe2 size={17}/></div><div className="empty-state"><div className="empty-icon"><Grid2X2 size={22}/></div><strong>No network data yet</strong><p>Holdings and allocation will be calculated from verified wallet data.</p></div></div></div><div className="panel market-panel"><div className="section-in-panel"><h3>Token holdings</h3><span className="pill neutral">Waiting for indexer</span></div><div className="empty-state compact"><Wallet size={24}/><strong>Your holdings will appear here</strong><p>No balances are invented or assumed to be zero.</p></div></div></div>
}
function ActivityPage({wallet}:{wallet:string}) {
  return <div className="page-content"><PageHeader eyebrow="MANAGE / ACTIVITY" title="Every step, visible." description="A single view of supported on-chain activity, with statuses backed by verified transaction data."/><div className="activity-filters">{['All','Swaps','Cross-chain','Approvals'].map((t,i)=><button key={t} className={i===0?'selected':''}>{t}</button>)}</div><div className="panel empty-state large"><div className="empty-icon"><Activity size={24}/></div><strong>{wallet?'No indexed activity yet':'Connect a wallet to begin'}</strong><p>{wallet?'An activity indexer is not configured, so no transaction history can be shown.':'Aurix will only display transactions that can be verified from supported chain data.'}</p></div></div>
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
  return <div className="page-content"><PageHeader eyebrow="PREFERENCES" title="Make it yours." description="Preferences stay on this device in this version."/><div className="settings-layout"><div className="panel settings-panel"><h3>Appearance</h3><p>Choose the surface that feels right.</p><div className="theme-choices"><button className={theme==='dark'?'selected':''} onClick={()=>setTheme('dark')}><span className="theme-swatch dark-swatch"/>Dark graphite {theme==='dark'&&<Check size={15}/>}</button><button className={theme==='light'?'selected':''} onClick={()=>setTheme('light')}><span className="theme-swatch light-swatch"/>Warm ivory {theme==='light'&&<Check size={15}/>}</button></div><div className="setting-row"><div><strong>Compact data tables</strong><span>Reduce vertical spacing in dense market views.</span></div><button className={`switch ${settings.compact?'on':''}`} onClick={()=>setSettings({...settings,compact:!settings.compact})} aria-label="Toggle compact tables"><span/></button></div><div className="setting-row"><div><strong>Asset alerts</strong><span>Opt in to alerts when a notification service is available.</span></div><button className={`switch ${settings.alerts?'on':''}`} onClick={()=>setSettings({...settings,alerts:!settings.alerts})} aria-label="Toggle asset alerts"><span/></button></div><div className="setting-row"><div><strong>Default slippage</strong><span>Applied only as a preference; execution is not enabled.</span></div><select className="small-select" value={settings.slippage} onChange={e=>setSettings({...settings,slippage:e.target.value})}><option value="0.10">0.10%</option><option value="0.50">0.50%</option><option value="1.00">1.00%</option></select></div><button className="secondary-button" onClick={()=>notify('Preferences are saved locally in this browser.')}>Save preferences <Check size={15}/></button></div><div className="panel settings-panel"><h3>Privacy & wallet</h3><p>Connection does not grant custody or authorize transactions.</p><div className="setting-row"><div><strong>Local-first preferences</strong><span>No account or cloud sync is configured.</span></div><span className="pill neutral">On device</span></div><div className="setting-row"><div><strong>Seed phrase storage</strong><span>Aurix never requests or stores recovery phrases.</span></div><ShieldCheck size={19}/></div><div className="setting-row"><div><strong>Network preferences</strong><span>Network support will be enabled after validation.</span></div><span className="pill neutral">Pending</span></div></div></div></div>
}
function Unavailable({title,eyebrow,description}:{title:string;eyebrow:string;description:string}) {
  return <div className="page-content"><PageHeader eyebrow={eyebrow} title={title} description={description}/><div className="panel empty-state large"><div className="empty-icon"><LockKeyhole size={23}/></div><strong>Not enabled in this build</strong><p>This area is designed into the product, but the underlying service is not connected. It will not show simulated activity as real.</p><span className="pill neutral">Integration required</span></div></div>
}
export default App
