import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Activity, ArrowDownUp, ArrowRight, Check, CircleAlert, Clock3, Coins, ExternalLink, LineChart, Pause, Play, Plus, RefreshCw, ShieldCheck, Sparkles, Trash2, Wallet, X } from 'lucide-react'
import { encodeFunctionData, formatUnits, isAddress, parseUnits } from 'viem'
import { ParticleRibbon } from './VisualMotion'

type MarketAsset = { symbol: string; name: string; price: string; change: string; positive: boolean; id?: string; marketCap?: number; volume?: number; rank?: number }
type EIP1193 = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }
type Hex = `0x${string}`
type Address = `0x${string}`

const env = (key: string, fallback = ''): string => String((import.meta as ImportMeta & { env?: Record<string, string> }).env?.[key] ?? fallback).trim()
const injected = (): EIP1193 | null => ((window as Window & { ethereum?: EIP1193 }).ethereum ?? null)
const shortHash = (hash: string) => `${hash.slice(0, 10)}…${hash.slice(-6)}`
const usd = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const compact = (value: number) => value >= 1e12 ? `$${(value / 1e12).toFixed(2)}T` : value >= 1e9 ? `$${(value / 1e9).toFixed(2)}B` : value >= 1e6 ? `$${(value / 1e6).toFixed(2)}M` : usd(value)

const erc20Abi = [
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { type: 'function', name: 'allowance', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
] as const
const v2RouterAbi = [
  { type: 'function', name: 'addLiquidity', stateMutability: 'nonpayable', inputs: [{ name: 'tokenA', type: 'address' }, { name: 'tokenB', type: 'address' }, { name: 'amountADesired', type: 'uint256' }, { name: 'amountBDesired', type: 'uint256' }, { name: 'amountAMin', type: 'uint256' }, { name: 'amountBMin', type: 'uint256' }, { name: 'to', type: 'address' }, { name: 'deadline', type: 'uint256' }], outputs: [{ name: 'amountA', type: 'uint256' }, { name: 'amountB', type: 'uint256' }, { name: 'liquidity', type: 'uint256' }] },
  { type: 'function', name: 'removeLiquidity', stateMutability: 'nonpayable', inputs: [{ name: 'tokenA', type: 'address' }, { name: 'tokenB', type: 'address' }, { name: 'liquidity', type: 'uint256' }, { name: 'amountAMin', type: 'uint256' }, { name: 'amountBMin', type: 'uint256' }, { name: 'to', type: 'address' }, { name: 'deadline', type: 'uint256' }], outputs: [{ name: 'amountA', type: 'uint256' }, { name: 'amountB', type: 'uint256' }] },
] as const
const stakingAbi = [
  { type: 'function', name: 'stake', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'withdraw', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'claimReward', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'earned', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
] as const

async function callUint(provider: EIP1193, address: string, data: Hex): Promise<bigint> {
  const result = await provider.request({ method: 'eth_call', params: [{ to: address, data }, 'latest'] })
  if (typeof result !== 'string' || !result.startsWith('0x')) throw new Error('The contract read returned an invalid result.')
  return BigInt(result)
}
async function sendCall(provider: EIP1193, wallet: string, to: string, data: Hex): Promise<string> {
  const result = await provider.request({ method: 'eth_sendTransaction', params: [{ from: wallet, to, data, value: '0x0' }] })
  if (typeof result !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(result)) throw new Error('The wallet did not return a transaction hash.')
  return result
}
async function waitForReceipt(provider: EIP1193, hash: string): Promise<void> {
  for (let i = 0; i < 40; i++) {
    const receipt = await provider.request({ method: 'eth_getTransactionReceipt', params: [hash] }).catch(() => null) as { status?: string } | null
    if (receipt) {
      if (receipt.status === '0x0') throw new Error(`Transaction reverted: ${shortHash(hash)}`)
      return
    }
    await new Promise(resolve => window.setTimeout(resolve, 1500))
  }
  throw new Error(`Transaction was submitted (${shortHash(hash)}) but is still pending. Check the block explorer before retrying.`)
}
async function ensureChain(provider: EIP1193, required: number): Promise<void> {
  const raw = await provider.request({ method: 'eth_chainId' })
  const current = Number(BigInt(String(raw)))
  if (current === required) return
  try { await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: `0x${required.toString(16)}` }] }) }
  catch { throw new Error(`Switch your wallet to chain ID ${required}, then retry. Current wallet chain: ${current}.`) }
}
async function approveIfNeeded(provider: EIP1193, wallet: string, token: string, spender: string, amount: bigint): Promise<void> {
  const data = encodeFunctionData({ abi: erc20Abi, functionName: 'allowance', args: [wallet as Address, spender as Address] })
  const allowance = await callUint(provider, token, data)
  if (allowance >= amount) return
  const approveData = encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [spender as Address, amount] })
  const hash = await sendCall(provider, wallet, token, approveData)
  await waitForReceipt(provider, hash)
}

export function AdBanner({ notify }: { notify: (message: string) => void }) {
  const [dismissed, setDismissed] = useState(false)
  const title = env('VITE_AD_BANNER_TITLE', 'A considered space for your next campaign')
  const copy = env('VITE_AD_BANNER_COPY', 'Partner with PioSwap to reach users exploring digital assets and on-chain finance.')
  const url = env('VITE_AD_BANNER_URL')
  const image = env('VITE_AD_BANNER_IMAGE_URL')
  if (dismissed) return null
  return <aside className="ad-banner" aria-label="Sponsored placement">
    <div className="ad-banner-art" aria-hidden="true">{image ? <img src={image} alt=""/> : <div className="ad-orbit"><span/><span/><span/></div>}</div>
    <div className="ad-banner-copy"><div className="ad-eyebrow"><span>{url ? 'SPONSORED' : 'AD SPACE'}</span><span className="ad-dot"/> {url ? 'PARTNER SPOTLIGHT' : 'AVAILABLE PLACEMENT'}</div><strong>{title}</strong><p>{copy}</p></div>
    {url ? <a className="ad-cta" href={url} target="_blank" rel="noreferrer">Explore <ExternalLink size={14}/></a> : <button className="ad-cta" onClick={() => notify('The banner slot is ready. Add VITE_AD_BANNER_TITLE, VITE_AD_BANNER_COPY, VITE_AD_BANNER_URL and optionally VITE_AD_BANNER_IMAGE_URL in .env.local to publish a real campaign.')}>Ad settings <ArrowRight size={14}/></button>}
    <button className="ad-close" aria-label="Dismiss sponsored banner" onClick={() => setDismissed(true)}><X size={14}/></button>
  </aside>
}

type LimitOrder = { id: string; side: 'Buy' | 'Sell'; symbol: string; amount: string; target: number; createdAt: number; status: 'watching' | 'triggered' | 'paused'; lastNotified?: number }
const readOrders = (): LimitOrder[] => { try { const raw = localStorage.getItem('pioswap-limit-orders'); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed.filter((x): x is LimitOrder => x && typeof x.id === 'string' && typeof x.symbol === 'string' && typeof x.target === 'number') : [] } catch { return [] } }
export function LimitOrdersPage({ assets, wallet, onConnect, notify }: { assets: MarketAsset[]; wallet: string; onConnect: () => void; notify: (message: string) => void }) {
  const [side, setSide] = useState<'Buy' | 'Sell'>('Buy')
  const [symbol, setSymbol] = useState('ETH')
  const [amount, setAmount] = useState('')
  const [target, setTarget] = useState('')
  const [orders, setOrders] = useState<LimitOrder[]>(readOrders)
  const [tick, setTick] = useState(Date.now())
  const liveAssets = useMemo(() => assets.filter(a => a.id && Number(a.price.replace(/[$,]/g, '')) > 0), [assets])
  const currentPrice = (s: string) => { const a = assets.find(x => x.symbol === s); const n = Number(a?.price.replace(/[$,]/g, '')); return Number.isFinite(n) && n > 0 ? n : null }
  useEffect(() => { localStorage.setItem('pioswap-limit-orders', JSON.stringify(orders)) }, [orders])
  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 20000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    setOrders(prev => prev.map(order => {
      if (order.status !== 'watching') return order
      const price = currentPrice(order.symbol)
      if (price == null) return order
      const crossed = order.side === 'Buy' ? price <= order.target : price >= order.target
      if (crossed && order.status === 'watching') {
        notify(`${order.side} price alert triggered for ${order.symbol} at ${usd(price)}. This is a monitored alert, not an automatic swap.`)
        return { ...order, status: 'triggered', lastNotified: Date.now() }
      }
      return order
    }))
    // The live market feed in the main app refreshes in the background; this effect
    // rechecks those latest values whenever the app's feed state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, assets])
  function createOrder() {
    const qty = Number(amount), px = Number(target)
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(px) || px <= 0) { notify('Enter a positive amount and limit price.'); return }
    if (!currentPrice(symbol)) { notify(`No live reference price for ${symbol}. Choose a listed market.`); return }
    setOrders(prev => [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, side, symbol, amount: String(qty), target: px, createdAt: Date.now(), status: 'watching' }, ...prev])
    setAmount(''); setTarget(''); notify('Limit price alert saved on this device. It will not execute a swap automatically.')
  }
  function updateStatus(id: string, status: LimitOrder['status']) { setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o)) }
  function removeOrder(id: string) { setOrders(prev => prev.filter(o => o.id !== id)) }
  const watching = orders.filter(o => o.status === 'watching').length
  return <div className="page-content">
    <PageHeaderCompat eyebrow="TRADE / LIMIT ORDERS" title="Set the price. Stay in control." description="Create a persistent price alert against live public market data. This browser-only watch mode does not sign or execute an order while you are away." right={<span className="pill warning">Alert mode</span>} />
    <div className="limit-intro panel"><div className="limit-intro-icon"><Clock3 size={20}/></div><div><strong>Limit orders are now usable as price triggers</strong><p>A true unattended limit swap requires a keeper/order protocol and funded execution path. Until one is selected and configured, PioSwap will alert you when a target is crossed and leave execution to you.</p></div><span className="pill neutral">{watching} watching</span></div>
    <div className="limit-layout">
      <section className="panel limit-form"><div className="eyebrow">NEW PRICE TRIGGER</div><h3>Plan your entry or exit</h3><div className="order-tabs"><button className={side==='Buy'?'buy-active':''} onClick={() => setSide('Buy')}>Buy when price falls</button><button className={side==='Sell'?'sell-active':''} onClick={() => setSide('Sell')}>Sell when price rises</button></div>
        <label>Asset</label><select className="small-select" value={symbol} onChange={e => setSymbol(e.target.value)}>{liveAssets.map(a => <option key={a.symbol} value={a.symbol}>{a.symbol} · {a.name}</option>)}</select>
        <label>Amount ({symbol})</label><input className="text-input" value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" />
        <label>Target price (USD)</label><input className="text-input" value={target} onChange={e => setTarget(e.target.value)} inputMode="decimal" placeholder={currentPrice(symbol) ? currentPrice(symbol)!.toString() : '0.00'} />
        <div className="limit-current-price"><span>Current reference price</span><strong>{currentPrice(symbol) ? usd(currentPrice(symbol)!) : 'Not available'}</strong></div>
        <button className="primary-button full" onClick={createOrder}>Save price trigger <ArrowRight size={15}/></button><small>A wallet is not required to save a reminder. Amounts are not reserved and no transaction is submitted.</small>
      </section>
      <section className="panel limit-list-panel"><div className="panel-top"><div><div className="eyebrow">YOUR PRICE TRIGGERS</div><h3>Orders & alerts</h3></div><button className="icon-button" aria-label="Refresh displayed prices" onClick={() => setTick(Date.now())}><RefreshCw size={15}/></button></div>
        {orders.length ? <div className="limit-order-list">{orders.map(order => { const p = currentPrice(order.symbol); return <div className="limit-order-row" key={order.id}><div className="limit-order-token"><span className={`order-side-mark ${order.side.toLowerCase()}`}>{order.side==='Buy'?'B':'S'}</span><div><strong>{order.side} {order.symbol}</strong><small>{order.amount} {order.symbol} · {new Date(order.createdAt).toLocaleString()}</small></div></div><div className="limit-order-prices"><span>Target</span><strong>{usd(order.target)}</strong><small>Now {p == null ? '—' : usd(p)}</small></div><span className={`pill ${order.status==='triggered'?'success':order.status==='watching'?'warning':'neutral'}`}>{order.status==='triggered'?'Triggered':order.status==='watching'?'Watching':'Paused'}</span><div className="limit-order-actions">{order.status!=='watching'&&<button className="icon-button" title="Resume watching" onClick={() => updateStatus(order.id, 'watching')}><Play size={14}/></button>}{order.status==='watching'&&<button className="icon-button" title="Pause watching" onClick={() => updateStatus(order.id, 'paused')}><Pause size={14}/></button>}<button className="icon-button" title="Delete trigger" onClick={() => removeOrder(order.id)}><Trash2 size={14}/></button></div></div>})}</div> : <div className="limit-empty"><Clock3 size={25}/><strong>No saved triggers yet</strong><span>Start with a target price on the left. Your alerts stay in this browser.</span></div>}
        <div className="data-note"><CircleAlert size={14}/> This tab must remain open for local trigger checks. Notification delivery and unattended execution are not configured.</div>
      </section>
    </div>
  </div>
}

export function AnalyticsPage({ assets, marketStatus, marketUpdated }: { assets: MarketAsset[]; marketStatus: 'loading' | 'live' | 'error'; marketUpdated: string }) {
  const [transactions, setTransactions] = useState<Array<{ hash: string; fromSymbol: string; toSymbol: string; amount: string; chain: string; time: number; status: string }>>([])
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    try { const raw = localStorage.getItem('pioswap-app-transactions'); setTransactions(raw ? JSON.parse(raw) : []) } catch { setTransactions([]) }
  }, [refresh])
  useEffect(() => {
    const handler = () => setRefresh(x => x + 1)
    window.addEventListener('pioswap:transaction-recorded', handler)
    return () => window.removeEventListener('pioswap:transaction-recorded', handler)
  }, [])
  const listed = assets.filter(a => a.id && Number(a.price.replace(/[$,]/g, '')) > 0)
  const aggregateVolume = listed.reduce((sum, a) => sum + (a.volume || 0), 0)
  const movers = listed.filter(a => Number.parseFloat(a.change.replace('%', '')) !== 0 && a.change !== '—').length
  const topVolume = [...listed].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 8)
  const maxVolume = Math.max(1, ...topVolume.map(a => a.volume || 0))
  const transactionCount = transactions.length
  const successful = transactions.filter(t => t.status.toLowerCase().includes('success') || t.status.toLowerCase().includes('done')).length
  return <div className="page-content">
    <PageHeaderCompat eyebrow="DISCOVER / ANALYTICS" title="See what the data can prove." description="Live asset-market context plus the transactions this browser records after a wallet execution. Market-wide volume is not PioSwap trading volume." right={<span className={`pill ${marketStatus==='live'?'success':'neutral'}`}>{marketStatus==='live'?'Live market feed':marketStatus==='loading'?'Loading feed':'Feed unavailable'}</span>} />
    <div className="metric-grid analytics-metrics">
      {[{title:'Tracked market 24h volume', value:marketStatus==='live'?compact(aggregateVolume):'—', note:'Sum of the currently loaded asset feed; not PioSwap volume'}, {title:'Assets with live prices', value:marketStatus==='live'?String(listed.length):'—', note:marketUpdated ? `Updated ${marketUpdated}` : 'Awaiting source'}, {title:'Market movers', value:marketStatus==='live'?String(movers):'—', note:'Assets with a reported 24h move'}, {title:'Wallet transactions recorded', value:String(transactionCount), note:`${successful} completed execution record${successful===1?'':'s'} saved in this browser`}].map(m => <div className="panel metric-card" key={m.title}><span>{m.title}</span><strong>{m.value}</strong><small>{m.note}</small></div>)}
    </div>
    <div className="analytics-layout"><section className="panel analytics-volume-panel"><div className="panel-top"><div><div className="eyebrow">MARKET CONTEXT</div><h3>24-hour volume leaders</h3></div><span className="pill neutral">CoinGecko feed</span></div>
      {topVolume.length ? <div className="analytics-bars">{topVolume.map(a => <div className="analytics-bar-row" key={a.symbol}><span className="analytics-bar-name">{a.symbol}</span><div className="analytics-bar-track"><span style={{ width: `${Math.max(2, ((a.volume || 0) / maxVolume) * 100)}%` }}/></div><strong>{compact(a.volume || 0)}</strong></div>)}</div> : <div className="limit-empty"><LineChart size={25}/><strong>{marketStatus==='loading'?'Loading current market data…':'Market data is not available'}</strong><span>Reconnect or retry the main market feed to populate this view.</span></div>}
    </section><section className="panel analytics-activity-panel"><div className="panel-top"><div><div className="eyebrow">EXECUTION LOG</div><h3>Recent wallet transactions</h3></div><span className="pill neutral">Local log</span></div>
      {transactions.length ? <div className="analytics-tx-list">{transactions.slice(0,8).map(t => <div className="analytics-tx-row" key={t.hash}><div className="analytics-tx-icon"><Check size={15}/></div><div className="analytics-tx-copy"><strong>{t.fromSymbol} → {t.toSymbol}</strong><small>{t.chain} · {new Date(t.time).toLocaleString()}</small></div><div className="analytics-tx-right"><span>{t.amount}</span>{t.chain==='Ethereum'&&<a href={`https://etherscan.io/tx/${t.hash}`} target="_blank" rel="noreferrer" title="Open transaction" aria-label="Open transaction"><ExternalLink size={13}/></a>}</div></div>)}</div> : <div className="limit-empty"><Activity size={25}/><strong>No recorded executions yet</strong><span>Completed wallet-signed swaps will appear here once this browser saves their transaction hashes.</span></div>}
    </section></div>
    <div className="data-note"><ShieldCheck size={14}/> Analytics persist only on this device in this version. Production-wide platform analytics needs a server/indexer, a database, and a verified event source; refreshing or changing browsers will not create global history.</div>
  </div>
}

export function recordPioSwapTransaction(record: { hash: string; fromSymbol: string; toSymbol: string; amount: string; chain?: string; status?: string }) {
  try {
    const records = JSON.parse(localStorage.getItem('pioswap-app-transactions') || '[]') as Array<Record<string, unknown>>
    if (records.some(r => r.hash === record.hash)) return
    records.unshift({ ...record, chain: record.chain || 'Ethereum', status: record.status || 'Submitted', time: Date.now() })
    localStorage.setItem('pioswap-app-transactions', JSON.stringify(records.slice(0, 200)))
    window.dispatchEvent(new Event('pioswap:transaction-recorded'))
  } catch { /* keep trading UI usable even when browser storage is unavailable */ }
}

export function StakingPage({ wallet, onConnect, notify }: { wallet: string; onConnect: () => void; notify: (message: string) => void }) {
  const stakingAddress = env('VITE_PIO_STAKING_CONTRACT_ADDRESS')
  const tokenAddress = env('VITE_STAKING_TOKEN_ADDRESS', env('VITE_PIO_TOKEN_ADDRESS'))
  const chainId = Number(env('VITE_STAKING_CHAIN_ID', env('VITE_EVM_CHAIN_ID', '0')))
  const decimals = Math.max(0, Math.min(36, Number(env('VITE_STAKING_TOKEN_DECIMALS', env('VITE_PIO_DECIMALS', '18'))) || 18))
  const rewardDecimals = Math.max(0, Math.min(36, Number(env('VITE_STAKING_REWARD_DECIMALS', String(decimals))) || decimals))
  const symbol = env('VITE_STAKING_TOKEN_SYMBOL', 'PIO')
  const rewardSymbol = env('VITE_STAKING_REWARD_SYMBOL', symbol)
  const configReady = chainId > 0 && isAddress(stakingAddress) && isAddress(tokenAddress)
  const [tab, setTab] = useState<'Stake' | 'Unstake'>('Stake')
  const [amount, setAmount] = useState('')
  const [stakeBalance, setStakeBalance] = useState('—')
  const [walletBalance, setWalletBalance] = useState('—')
  const [earned, setEarned] = useState('—')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  async function refreshStats() {
    if (!wallet || !configReady) return
    const provider = injected(); if (!provider) return
    setLoading(true); setError('')
    try {
      await ensureChain(provider, chainId)
      const addr = wallet as Address
      const staked = await callUint(provider, stakingAddress, encodeFunctionData({ abi: stakingAbi, functionName: 'balanceOf', args: [addr] }))
      const rewards = await callUint(provider, stakingAddress, encodeFunctionData({ abi: stakingAbi, functionName: 'earned', args: [addr] }))
      const balance = await callUint(provider, tokenAddress, encodeFunctionData({ abi: erc20Abi, functionName: 'balanceOf', args: [addr] }))
      setStakeBalance(formatUnits(staked, decimals)); setEarned(formatUnits(rewards, rewardDecimals)); setWalletBalance(formatUnits(balance, decimals))
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not read staking data from the configured contracts.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void refreshStats(); /* wallet/config changes are intentionally the read trigger */ }, [wallet, stakingAddress, tokenAddress, chainId])
  async function submit() {
    if (!wallet) { onConnect(); return }
    if (!configReady) { notify('Staking setup is incomplete. Add the staking contract, token address and target chain to .env.local.'); return }
    const qty = Number(amount)
    if (!Number.isFinite(qty) || qty <= 0) { setError('Enter a positive token amount.'); return }
    const provider = injected(); if (!provider) { setError('No injected EVM wallet detected.'); return }
    setBusy(true); setError(''); setStatus('Checking network and token allowance…')
    try {
      await ensureChain(provider, chainId)
      const raw = parseUnits(amount, decimals)
      if (tab === 'Stake') {
        await approveIfNeeded(provider, wallet, tokenAddress, stakingAddress, raw)
        setStatus('Waiting for stake confirmation…')
        const data = encodeFunctionData({ abi: stakingAbi, functionName: 'stake', args: [raw] })
        const hash = await sendCall(provider, wallet, stakingAddress, data)
        setStatus(`Stake submitted · ${shortHash(hash)}`)
        await waitForReceipt(provider, hash)
        setStatus(`Stake confirmed · ${shortHash(hash)}`); notify('Staking deposit confirmed.')
      } else {
        const data = encodeFunctionData({ abi: stakingAbi, functionName: 'withdraw', args: [raw] })
        const hash = await sendCall(provider, wallet, stakingAddress, data)
        setStatus(`Withdrawal submitted · ${shortHash(hash)}`)
        await waitForReceipt(provider, hash)
        setStatus(`Withdrawal confirmed · ${shortHash(hash)}`); notify('Staking withdrawal confirmed.')
      }
      setAmount(''); await refreshStats()
    } catch (e) { setError(e instanceof Error ? e.message : 'The staking transaction did not complete.'); setStatus('') }
    finally { setBusy(false) }
  }
  async function claim() {
    if (!wallet) { onConnect(); return }
    if (!configReady) { notify('Configure the staking contract first.'); return }
    const provider = injected(); if (!provider) { setError('No injected EVM wallet detected.'); return }
    setBusy(true); setError(''); setStatus('Waiting for reward claim…')
    try { await ensureChain(provider, chainId); const data = encodeFunctionData({ abi: stakingAbi, functionName: 'claimReward' }); const hash = await sendCall(provider, wallet, stakingAddress, data); await waitForReceipt(provider, hash); setStatus(`Rewards claimed · ${shortHash(hash)}`); notify('Reward claim confirmed.'); await refreshStats() }
    catch (e) { setError(e instanceof Error ? e.message : 'Reward claim failed.'); setStatus('') }
    finally { setBusy(false) }
  }
  return <div className="page-content">
    <PageHeaderCompat eyebrow="EARN / STAKING" title="Put idle assets to work." description="Stake directly through the configured staking contract, monitor your balance and claim accrued rewards. APY is not advertised until an on-chain reward schedule is available." right={<span className={`pill ${configReady?'success':'warning'}`}>{configReady?'Contract configured':'Setup required'}</span>} />
    <div className="staking-summary-grid"><div className="panel staking-highlight"><div className="staking-mark"><Coins size={20}/></div><div className="eyebrow">YOUR STAKED BALANCE</div><strong>{loading ? 'Reading…' : stakeBalance}</strong><span>{symbol}</span><p>{configReady ? 'Read from the configured staking contract.' : 'Appears after deployment and contract configuration.'}</p></div><div className="panel staking-stat"><span>Wallet balance</span><strong>{walletBalance}</strong><small>{symbol} · on-chain token balance</small></div><div className="panel staking-stat"><span>Rewards claimable</span><strong>{earned}</strong><small>{rewardSymbol} · contract-reported accrued rewards</small></div></div>
    <div className="staking-layout"><section className="panel staking-action"><div className="staking-tabs"><button className={tab==='Stake'?'active':''} onClick={() => { setTab('Stake'); setError('') }}>Stake</button><button className={tab==='Unstake'?'active':''} onClick={() => { setTab('Unstake'); setError('') }}>Unstake</button></div><label>{tab==='Stake'?'Amount to stake':'Amount to withdraw'} ({symbol})</label><div className="staking-amount"><input className="text-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" inputMode="decimal"/><button className="text-button" onClick={() => setAmount(tab==='Stake'&&walletBalance!=='—'?walletBalance:tab==='Unstake'&&stakeBalance!=='—'?stakeBalance:'')}>MAX</button></div><button className="primary-button full" disabled={busy || !configReady} onClick={() => void submit()}>{busy ? 'Confirming…' : tab==='Stake' ? 'Approve & stake' : 'Withdraw stake'} <ArrowRight size={15}/></button><button className="secondary-button full" disabled={busy || !configReady || earned==='—' || Number(earned)<=0} onClick={() => void claim()}>Claim rewards <Sparkles size={15}/></button><button className="text-button refresh-staking" onClick={() => void refreshStats()} disabled={loading || !configReady}><RefreshCw size={13}/> Refresh contract balances</button>{error && <div className="error-note">{error}</div>}{status && <div className="data-note"><Check size={14}/>{status}</div>}</section>
      <aside className="panel staking-guide"><div className="eyebrow">BEFORE YOU DEPOSIT</div><h3>On-chain, not a demo</h3><p>The buttons submit wallet-signed calls only after contract addresses and chain ID are set. Never paste a recovery phrase here.</p><div className="staking-requirement"><ShieldCheck size={16}/><span>{configReady ? `Connected to configured chain ${chainId}` : 'Deploy and verify a staking contract, then add addresses in .env.local'}</span></div><div className="staking-requirement"><Check size={16}/><span>Stake first requires an ERC-20 approval; the exact amount is approved, not unlimited spend.</span></div><div className="staking-requirement"><CircleAlert size={16}/><span>Reward token funding, reward duration and contract audit are deployment responsibilities; no APY is guessed.</span></div><p className="staking-contract-address">{configReady ? `${stakingAddress.slice(0, 10)}…${stakingAddress.slice(-6)}` : 'VITE_PIO_STAKING_CONTRACT_ADDRESS not set'}</p></aside>
    </div>
  </div>
}

export function LiquidityPage({ notify, wallet, onConnect }: { notify: (message: string) => void; wallet: string; onConnect: () => void }) {
  const [pair, setPair] = useState<'USDC' | 'ETH'>('USDC')
  const [mode, setMode] = useState<'Add' | 'Remove'>('Add')
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')
  const [lpAmount, setLpAmount] = useState('')
  const [minA, setMinA] = useState('')
  const [minB, setMinB] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const chainId = Number(env('VITE_LP_CHAIN_ID', env('VITE_EVM_CHAIN_ID', '0')))
  const pioToken = env('VITE_PIO_TOKEN_ADDRESS')
  const quoteToken = env(pair === 'USDC' ? 'VITE_USDC_TOKEN_ADDRESS' : 'VITE_WETH_TOKEN_ADDRESS')
  const router = env('VITE_LP_ROUTER_ADDRESS')
  const lpToken = env(pair === 'USDC' ? 'VITE_PIO_USDC_LP_TOKEN_ADDRESS' : 'VITE_PIO_WETH_LP_TOKEN_ADDRESS')
  const pioDecimals = Math.max(0, Math.min(36, Number(env('VITE_PIO_DECIMALS', '18')) || 18))
  const quoteDecimals = Math.max(0, Math.min(36, Number(env(pair === 'USDC' ? 'VITE_USDC_DECIMALS' : 'VITE_WETH_DECIMALS', pair === 'USDC' ? '6' : '18')) || (pair === 'USDC' ? 6 : 18)))
  const ready = chainId > 0 && [pioToken, quoteToken, router].every(value => isAddress(value)) && (mode === 'Add' || isAddress(lpToken))
  async function transact() {
    if (!wallet) { onConnect(); return }
    if (!ready) { notify('Liquidity is not configured. Add the verified token, router, chain ID and LP token addresses to .env.local.'); return }
    const provider = injected(); if (!provider) { setError('No injected EVM wallet detected.'); return }
    setBusy(true); setError(''); setStatus('Checking selected chain…')
    try {
      await ensureChain(provider, chainId)
      const pioAddr = pioToken as Address, quoteAddr = quoteToken as Address
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)
      if (mode === 'Add') {
        if (!(Number(amountA) > 0) || !(Number(amountB) > 0)) throw new Error('Enter positive amounts for both PIO and the paired asset.')
        const rawA = parseUnits(amountA, pioDecimals), rawB = parseUnits(amountB, quoteDecimals)
        // Catch insufficient balances before asking for token approvals.
        const balA = await callUint(provider, pioToken, encodeFunctionData({ abi: erc20Abi, functionName: 'balanceOf', args: [wallet as Address] }))
        const balB = await callUint(provider, quoteToken, encodeFunctionData({ abi: erc20Abi, functionName: 'balanceOf', args: [wallet as Address] }))
        if (balA < rawA || balB < rawB) throw new Error(`Insufficient token balance. Current balances: ${formatUnits(balA, pioDecimals)} PIO and ${formatUnits(balB, quoteDecimals)} ${pair}.`)
        setStatus('Checking token approvals…')
        await approveIfNeeded(provider, wallet, pioToken, router, rawA)
        await approveIfNeeded(provider, wallet, quoteToken, router, rawB)
        setStatus('Waiting for liquidity transaction confirmation…')
        const data = encodeFunctionData({ abi: v2RouterAbi, functionName: 'addLiquidity', args: [pioAddr, quoteAddr, rawA, rawB, rawA * 995n / 1000n, rawB * 995n / 1000n, wallet as Address, deadline] })
        const hash = await sendCall(provider, wallet, router, data)
        await waitForReceipt(provider, hash)
        setStatus(`Liquidity addition confirmed · ${shortHash(hash)}`); notify('Liquidity addition confirmed on-chain.')
      } else {
        if (!isAddress(lpToken)) throw new Error(`Set the verified ${pair} LP token address before removing liquidity.`)
        if (!(Number(lpAmount) > 0) || !(Number(minA) >= 0) || !(Number(minB) >= 0) || minA.trim() === '' || minB.trim() === '') throw new Error('Enter the LP amount and explicit minimum outputs for PIO and the paired asset. Zero minimum outputs are not recommended.')
        if (Number(minA) === 0 || Number(minB) === 0) throw new Error('Minimum outputs must be greater than zero to avoid an unprotected withdrawal.')
        const rawLP = parseUnits(lpAmount, Number(env('VITE_LP_TOKEN_DECIMALS', '18')) || 18)
        const minRawA = parseUnits(minA, pioDecimals), minRawB = parseUnits(minB, quoteDecimals)
        const lpBal = await callUint(provider, lpToken, encodeFunctionData({ abi: erc20Abi, functionName: 'balanceOf', args: [wallet as Address] }))
        if (lpBal < rawLP) throw new Error(`Insufficient LP balance. Wallet holds ${formatUnits(lpBal, Number(env('VITE_LP_TOKEN_DECIMALS', '18')) || 18)} LP tokens.`)
        await approveIfNeeded(provider, wallet, lpToken, router, rawLP)
        setStatus('Waiting for liquidity withdrawal confirmation…')
        const data = encodeFunctionData({ abi: v2RouterAbi, functionName: 'removeLiquidity', args: [pioAddr, quoteAddr, rawLP, minRawA, minRawB, wallet as Address, deadline] })
        const hash = await sendCall(provider, wallet, router, data)
        await waitForReceipt(provider, hash)
        setStatus(`Liquidity removal confirmed · ${shortHash(hash)}`); notify('Liquidity withdrawal confirmed on-chain.')
      }
      setAmountA(''); setAmountB(''); setLpAmount(''); setMinA(''); setMinB('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Liquidity transaction failed.'); if (!error) setStatus('') }
    finally { setBusy(false) }
  }
  return <div className="page-content liquidity-page">
    <PageHeaderCompat eyebrow="TRADE / LIQUIDITY" title="Liquidity, with clear controls." description="Add or remove liquidity via a configured Uniswap V2-compatible router. Transactions stay disabled until verified addresses and the target network are supplied." right={<span className={`pill ${ready?'success':'warning'}`}>{ready?'Contracts configured':'Setup required'}</span>} />
    <div className="liquidity-layout">
      <section className="panel liquidity-main">
        <div className="liquidity-tabs"><button className={mode==='Add'?'active':''} onClick={() => { setMode('Add'); setError('') }}>Add liquidity</button><button className={mode==='Remove'?'active':''} onClick={() => { setMode('Remove'); setError('') }}>Remove liquidity</button></div>
        <label className="liquidity-label">Pool pair</label><select className="small-select liquidity-select" value={pair} onChange={e => { setPair(e.target.value as 'USDC' | 'ETH'); setError(''); setStatus('') }}><option value="USDC">PIO / USDC</option><option value="ETH">PIO / WETH</option></select>
        <div className="liquidity-pair-logos"><img src="/pio-coin-logo.svg" alt="PIO Coin logo"/><span>PIO</span><span className="liquidity-pair-divider">/</span><span className={pair==='USDC'?'usdc-logo':'eth-pair-logo'}>{pair==='USDC'?'$':'Ξ'}</span><span>{pair}</span></div>
        {mode === 'Add' ? <><label className="liquidity-label">PIO amount</label><input className="text-input" value={amountA} onChange={e => setAmountA(e.target.value)} inputMode="decimal" placeholder="0.00 PIO"/><label className="liquidity-label">{pair} amount</label><input className="text-input" value={amountB} onChange={e => setAmountB(e.target.value)} inputMode="decimal" placeholder={`0.00 ${pair}`}/><div className="liquidity-status"><ShieldCheck size={17}/><div><strong>0.5% minimum-amount protection</strong><p>The router call sets 0.5% minimum amounts for both assets. The amounts still need to match the pool ratio; the router may revert if they do not. Review both token approvals in your wallet.</p></div></div></> : <><label className="liquidity-label">LP token amount to redeem</label><input className="text-input" value={lpAmount} onChange={e => setLpAmount(e.target.value)} inputMode="decimal" placeholder="0.00 LP"/><div className="liquidity-remove-grid"><div><label className="liquidity-label">Minimum PIO received</label><input className="text-input" value={minA} onChange={e => setMinA(e.target.value)} inputMode="decimal" placeholder="Set min output"/></div><div><label className="liquidity-label">Minimum {pair} received</label><input className="text-input" value={minB} onChange={e => setMinB(e.target.value)} inputMode="decimal" placeholder="Set min output"/></div></div><div className="liquidity-status"><ShieldCheck size={17}/><div><strong>Set minimums before withdrawing</strong><p>There is no fabricated quote here. Check live pool reserves and set your acceptable minimum outputs before signing the LP removal.</p></div></div></>}
        <button className="primary-button full" disabled={busy || !ready} onClick={() => void transact()}>{busy ? 'Waiting for wallet / chain…' : !wallet ? 'Connect wallet' : mode==='Add' ? 'Approve & add liquidity' : 'Approve & remove liquidity'} <ArrowRight size={15}/></button>
        {!ready && <p className="liquidity-footnote">Required: PIO token, {pair} token, V2-compatible router and chain ID; removal also needs the verified LP token contract. See .env.example and DEPLOYMENT-CHECKLIST.md.</p>}
        {status && <div className="data-note"><Check size={14}/>{status}</div>}{error && <div className="error-note">{error}</div>}
      </section>
      <aside className="panel liquidity-info"><div className="eyebrow">LIQUIDITY + REFERRALS</div><div className="liquidity-logo-large"><img src="/pio-coin-logo.svg" alt="PIO Coin SVG logo"/></div><h3>{`PIO / ${pair} pool`}</h3><p>{ready ? `Ready to call the configured V2-compatible router on chain ${chainId}.` : 'A real pool must exist or be created on the target chain using a verified router.'}</p><div className="fee-split-mini">{[{label:'Platform treasury',pct:50},{label:'Liquidity provider reward allocation',pct:30},{label:'Direct LP referrer',pct:10},{label:'Level 2',pct:5},{label:'Level 3',pct:3},{label:'Level 4',pct:2}].map(x => <div key={x.label}><span>{x.label}</span><strong>{x.pct}%</strong></div>)}</div><div className="liquidity-status"><CircleAlert size={17}/><div><strong>Referral rewards come from eligible protocol fees</strong><p>Deposited PIO and paired tokens remain pool principal; never split the user's liquidity deposit using these percentages. The 50/30/10/5/3/2 split needs the deployed fee-distributor contract connected to actual collected protocol fees.</p></div></div><div className="pill neutral">No referral payout inferred from LP deposit</div></aside>
    </div>
  </div>
}

function PageHeaderCompat({ eyebrow, title, description, right }: { eyebrow: string; title: string; description?: string; right?: ReactNode }) {
  return <div className="page-header page-header-ribbon"><ParticleRibbon/><div className="page-header-main"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{right && <div className="page-header-right">{right}</div>}</div>
}
