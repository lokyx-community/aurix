/** Client-side integrations for PioSwap preview. All transaction signatures remain in the user's wallet. */
export type Eip1193Provider = { request: (args: { method: string; params?: unknown[] }) => Promise<any> }
export type ProviderToken = { address: string; symbol: string; name: string; decimals: number; logoURI?: string; priceUSD?: string; isNative?: boolean; chainId: number }
export type LifiQuote = {
  id?: string; fromChainId: number; toChainId: number; fromAddress?: string; toAddress?: string;
  action: { fromChainId: number; toChainId: number; fromToken: ProviderToken; toToken: ProviderToken; fromAmount: string; fromAddress?: string; toAddress?: string };
  estimate: { fromAmount?: string; toAmount: string; toAmountMin?: string; toAmountUSD?: string; priceImpact?: string | number; approvalAddress?: string; feeCosts?: Array<{name?: string; amountUSD?: string; token?: {symbol?: string}}>; gasCosts?: Array<{amountUSD?: string; estimate?: string; token?: {symbol?: string}}>; executionDuration?: number };
  transactionRequest?: { from?: string; to: string; data: string; value?: string; gasLimit?: string; gasPrice?: string; chainId?: number };
  tool?: string; toolDetails?: {name?: string; logoURI?: string}; [key: string]: any;
}
export type SavedTransaction = {
  id: string; type: 'swap'|'bridge'|'approval'; fromChainId: number; toChainId: number;
  txHash: string; status: string; createdAt: number; fromSymbol?: string; toSymbol?: string;
  amount?: string; explorer?: string; fromAddress?: string; recipientAddress?: string;
  transactionTarget?: string; blockNumber?: string; gasUsed?: string;
  effectiveGasPrice?: string; actualGasFeeWei?: string; receiptStatus?: 'success'|'failed';
  estimatedToAmount?: string; minimumToAmount?: string;
  destinationTxHash?: string; destinationExplorer?: string; routeExplorer?: string;
  routeSubstatus?: string; routeMessage?: string;
}

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const LIFI_BASE = 'https://li.quest/v1'
const LIFI_KEY = (import.meta as any).env?.VITE_LIFI_API_KEY as string | undefined
const lifiHeaders: Record<string,string> = { accept: 'application/json', ...(LIFI_KEY ? { 'x-lifi-api-key': LIFI_KEY } : {}) }

export const EVM_CHAINS: Record<string, { id: number; native: string; rpc: string; explorer: string; cow?: string }> = {
  'Ethereum': { id: 1, native: 'ETH', rpc: 'https://cloudflare-eth.com', explorer: 'https://etherscan.io', cow: 'mainnet' },
  'Arbitrum': { id: 42161, native: 'ETH', rpc: 'https://arb1.arbitrum.io/rpc', explorer: 'https://arbiscan.io', cow: 'arbitrum_one' },
  'Base': { id: 8453, native: 'ETH', rpc: 'https://mainnet.base.org', explorer: 'https://basescan.org', cow: 'base' },
  'Optimism': { id: 10, native: 'ETH', rpc: 'https://mainnet.optimism.io', explorer: 'https://optimistic.etherscan.io' },
  'Polygon': { id: 137, native: 'POL', rpc: 'https://polygon-rpc.com', explorer: 'https://polygonscan.com', cow: 'polygon' },
  'BNB Chain': { id: 56, native: 'BNB', rpc: 'https://bsc-dataseed.binance.org', explorer: 'https://bscscan.com', cow: 'bnb' },
  'Avalanche': { id: 43114, native: 'AVAX', rpc: 'https://api.avax.network/ext/bc/C/rpc', explorer: 'https://snowtrace.io', cow: 'avalanche' },
  'Linea': { id: 59144, native: 'ETH', rpc: 'https://rpc.linea.build', explorer: 'https://lineascan.build' },
  'zkSync Era': { id: 324, native: 'ETH', rpc: 'https://mainnet.era.zksync.io', explorer: 'https://explorer.zksync.io' },
  'Scroll': { id: 534352, native: 'ETH', rpc: 'https://rpc.scroll.io', explorer: 'https://scrollscan.com' },
  'Gnosis': { id: 100, native: 'xDAI', rpc: 'https://rpc.gnosischain.com', explorer: 'https://gnosisscan.io', cow: 'xdai' },
  'Celo': { id: 42220, native: 'CELO', rpc: 'https://forno.celo.org', explorer: 'https://celoscan.io' },
  'Mantle': { id: 5000, native: 'MNT', rpc: 'https://rpc.mantle.xyz', explorer: 'https://explorer.mantle.xyz' },
  'Fantom': { id: 250, native: 'FTM', rpc: 'https://rpc.ftm.tools', explorer: 'https://ftmscan.com' },
  'Cronos': { id: 25, native: 'CRO', rpc: 'https://evm.cronos.org', explorer: 'https://explorer.cronos.org' },
}
export const COW_BASES: Record<number,string> = {
  1:'mainnet', 100:'xdai', 42161:'arbitrum_one', 8453:'base', 137:'polygon', 56:'bnb', 43114:'avalanche', 59144:'linea'
}
export const COW_SETTLEMENT = '0x9008D19f58AAbD9eD0D60971565AA8510560ab41'
export const COW_RELAYER = '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110'
export const COW_APPDATA = '{}'
export const COW_APPDATA_HASH = '0xb48d38f93eaa084033fc5970bf96e559c33c4cdc07d889ab00b4d63f9590739d'

export function parseUnitsSafe(value: string, decimals: number): bigint {
  if (!/^\d*(\.\d*)?$/.test(value) || !value || value === '.') throw new Error('Enter a valid positive amount.')
  const [whole='0', fraction=''] = value.split('.')
  if (fraction.length > decimals) throw new Error(`This token supports at most ${decimals} decimal places.`)
  const units = BigInt(whole || '0') * (10n ** BigInt(decimals)) + BigInt((fraction + '0'.repeat(decimals)).slice(0, decimals) || '0')
  if (units <= 0n) throw new Error('Amount must be greater than zero.')
  return units
}
export function formatUnitsSafe(value: string|bigint, decimals: number, maxFraction=6): string {
  try {
    const amount = BigInt(value); const base = 10n ** BigInt(decimals)
    const whole = amount / base; const rem = amount % base
    let fraction = rem.toString().padStart(decimals,'0').slice(0,maxFraction).replace(/0+$/,'')
    return `${whole.toLocaleString('en-US')}${fraction ? `.${fraction}` : ''}`
  } catch { return '—' }
}
export const isNativeToken = (token?: Partial<ProviderToken>|null) => Boolean(token?.isNative || token?.address?.toLowerCase() === ZERO_ADDRESS)
export function isEvmChainId(id: number) { return Number.isSafeInteger(id) && Object.values(EVM_CHAINS).some(chain => chain.id === id) }

async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const text = await res.text()
  let data: any = {}
  try { data = text ? JSON.parse(text) : {} } catch { data = { message: text } }
  if (!res.ok) throw new Error(data?.message || data?.error || data?.errors?.[0]?.message || `Provider returned HTTP ${res.status}`)
  return data
}

export async function fetchLifiTokens(chainId: number): Promise<ProviderToken[]> {
  if (!Number.isSafeInteger(chainId) || chainId <= 0) throw new Error('A valid LI.FI chain ID is required.')
  const data = await jsonFetch(`${LIFI_BASE}/tokens?chains=${chainId}`, { headers: lifiHeaders })
  const tokens = data?.tokens?.[String(chainId)]
  if (!Array.isArray(tokens)) throw new Error('LI.FI returned no token catalogue for this network.')
  return tokens.filter((t:any) => typeof t?.address === 'string' && typeof t?.symbol === 'string' && Number.isFinite(Number(t?.decimals))).map((t:any) => ({
    address: t.address, symbol: String(t.symbol).toUpperCase(), name: String(t.name || t.symbol), decimals: Number(t.decimals),
    logoURI: typeof t.logoURI === 'string' ? t.logoURI : undefined, priceUSD: t.priceUSD == null ? undefined : String(t.priceUSD),
    isNative: Boolean(t.isNative) || t.address.toLowerCase() === ZERO_ADDRESS, chainId,
  }))
}

export async function getLifiQuote(args: { fromChainId: number; toChainId: number; fromToken: ProviderToken; toToken: ProviderToken; fromAmount: string; fromAddress: string; toAddress?: string; slippage?: number }): Promise<LifiQuote> {
  const params = new URLSearchParams({
    fromChain: String(args.fromChainId), toChain: String(args.toChainId), fromToken: args.fromToken.address, toToken: args.toToken.address,
    fromAmount: args.fromAmount, fromAddress: args.fromAddress, toAddress: args.toAddress || args.fromAddress,
    slippage: String(args.slippage ?? 0.005), integrator: 'PioSwap',
  })
  // LI.FI's /quote response normally stores the selected networks inside `action`.
  // `fromChainId` and `toChainId` are not guaranteed to exist on the response root.
  // Normalize the response once so downstream execution always sees numeric root IDs.
  const response = await jsonFetch(`${LIFI_BASE}/quote?${params.toString()}`, { headers: lifiHeaders }) as Partial<LifiQuote> & {
    action?: LifiQuote['action']
    transactionRequest?: LifiQuote['transactionRequest']
    estimate?: LifiQuote['estimate']
  }
  if (!response?.transactionRequest?.to || !response?.transactionRequest?.data || !response?.estimate?.toAmount) throw new Error('LI.FI did not return an executable quote. Try another token or amount, or check the provider response.')

  const actionFromChainId = Number(response.action?.fromChainId ?? response.action?.fromToken?.chainId ?? response.transactionRequest?.chainId)
  const actionToChainId = Number(response.action?.toChainId ?? response.action?.toToken?.chainId)
  const rootFromChainId = response.fromChainId == null ? undefined : Number(response.fromChainId)
  const rootToChainId = response.toChainId == null ? undefined : Number(response.toChainId)
  const chainMismatch = !Number.isSafeInteger(actionFromChainId) || !Number.isSafeInteger(actionToChainId)
    || actionFromChainId !== args.fromChainId || actionToChainId !== args.toChainId
    || (rootFromChainId !== undefined && rootFromChainId !== args.fromChainId)
    || (rootToChainId !== undefined && rootToChainId !== args.toChainId)
  if (chainMismatch) {
    const actualFrom = Number.isSafeInteger(actionFromChainId) ? actionFromChainId : 'unknown'
    const actualTo = Number.isSafeInteger(actionToChainId) ? actionToChainId : 'unknown'
    throw new Error(`LI.FI quote networks do not match this selection. Requested ${args.fromChainId} → ${args.toChainId}; provider returned ${actualFrom} → ${actualTo}. Re-select both tokens and request a fresh quote.`)
  }
  const quote = { ...response, fromChainId: actionFromChainId, toChainId: actionToChainId } as LifiQuote
  if (quote.action?.fromToken?.address?.toLowerCase() !== args.fromToken.address.toLowerCase() || quote.action?.toToken?.address?.toLowerCase() !== args.toToken.address.toLowerCase()) throw new Error('Provider quote token addresses did not match your selected tokens.')
  if (BigInt(quote.action?.fromAmount || '-1') !== BigInt(args.fromAmount)) throw new Error('Provider quote source amount did not match the amount entered. Request a fresh quote.')
  if (quote.action?.fromAddress && quote.action.fromAddress.toLowerCase() !== args.fromAddress.toLowerCase()) throw new Error('Provider quote source wallet did not match the connected wallet.')
  const expectedRecipient = (args.toAddress || args.fromAddress).toLowerCase()
  if (quote.action?.toAddress && quote.action.toAddress.toLowerCase() !== expectedRecipient) throw new Error('Provider quote recipient did not match the requested recipient.')
  // Keep the optional LI.FI transaction payload in a local variable so TypeScript
  // narrows it after the explicit guard; never execute a quote without calldata.
  const txRequest = quote.transactionRequest
  if (!txRequest) throw new Error('LI.FI quote did not include a transaction request. Refresh the quote or choose another route.')
  if (txRequest.from && txRequest.from.toLowerCase() !== args.fromAddress.toLowerCase()) throw new Error('Provider transaction sender does not match the connected wallet.')
  if (!/^0x[a-fA-F0-9]{40}$/.test(txRequest.to) || !/^0x([a-fA-F0-9]{2})*$/.test(txRequest.data || '') || BigInt(quote.estimate.toAmount) <= 0n) throw new Error('Provider returned malformed transaction data or an invalid output amount.')
  return quote
}

export async function rpcRequest(rpc: string, method: string, params: unknown[]) {
  const data = await jsonFetch(rpc, { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ jsonrpc:'2.0', id:1, method, params }) })
  if (data.error) throw new Error(data.error.message || 'RPC request failed')
  return data.result
}

async function waitForReceipt(provider: Eip1193Provider, hash: string, onStatus: (s:string)=>void) {
  const started = Date.now()
  while (Date.now() - started < 180_000) {
    const receipt = await provider.request({ method:'eth_getTransactionReceipt', params:[hash] })
    if (receipt) return receipt
    onStatus('Transaction submitted. Waiting for source-chain confirmation…')
    await new Promise(resolve => window.setTimeout(resolve, 2200))
  }
  throw new Error(`Transaction ${hash} is still pending. You can track it in the block explorer.`)
}

function readSavedTransactions(): SavedTransaction[] {
  try { const x = JSON.parse(localStorage.getItem('pioswap-transactions') || '[]'); return Array.isArray(x) ? x : [] } catch { return [] }
}
export function saveTransaction(tx: SavedTransaction) {
  const current = readSavedTransactions().filter(x => x.id !== tx.id)
  current.unshift(tx); localStorage.setItem('pioswap-transactions', JSON.stringify(current.slice(0,50)))
  window.dispatchEvent(new CustomEvent('pioswap-transactions-updated'))
}
export function updateTransaction(id: string, patch: Partial<SavedTransaction>) {
  const current = readSavedTransactions().map(x => x.id === id ? { ...x, ...patch } : x)
  localStorage.setItem('pioswap-transactions', JSON.stringify(current)); window.dispatchEvent(new CustomEvent('pioswap-transactions-updated'))
}
export function getSavedTransactions() { return readSavedTransactions() }

export async function executeLifiQuote(options: {
  provider: Eip1193Provider; wallet: string; quote: LifiQuote; quotedAt: number; fromSymbol: string; toSymbol: string; amount: string;
  onStatus: (s:string)=>void;
  onTransactionUpdate?: (tx: SavedTransaction)=>void;
}): Promise<{txHash:string;status:string}> {
  const { provider, wallet, quote, quotedAt, onStatus, onTransactionUpdate } = options
  const receiptFields = (receipt: any) => {
    const gasUsed = receipt?.gasUsed == null ? undefined : String(receipt.gasUsed)
    const effectiveGasPrice = receipt?.effectiveGasPrice == null ? (receipt?.gasPrice == null ? undefined : String(receipt.gasPrice)) : String(receipt.effectiveGasPrice)
    let actualGasFeeWei: string | undefined
    try { if (gasUsed && effectiveGasPrice) actualGasFeeWei = (BigInt(gasUsed) * BigInt(effectiveGasPrice)).toString() } catch { /* ignore malformed optional receipt fields */ }
    return {
      blockNumber: receipt?.blockNumber == null ? undefined : String(receipt.blockNumber),
      gasUsed, effectiveGasPrice, actualGasFeeWei,
      receiptStatus: receipt?.status == null ? undefined : (BigInt(receipt.status) === 1n ? 'success' as const : 'failed' as const),
    }
  }
  const notifySaved = (tx: SavedTransaction) => onTransactionUpdate?.(tx)
  if (Date.now() - quotedAt > 45_000) throw new Error('This quote is older than 45 seconds. Refresh it before executing.')
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) throw new Error('Connected wallet address is invalid.')
  if (!isEvmChainId(Number(quote.fromChainId))) throw new Error('This route starts on a non-EVM chain. Use the multi-wallet LI.FI panel to sign from that source chain.')
  if (!quote.transactionRequest || !/^0x[a-fA-F0-9]{40}$/.test(quote.transactionRequest.to) || !/^0x([a-fA-F0-9]{2})*$/.test(quote.transactionRequest.data || '')) throw new Error('Provider transaction target or calldata is missing or malformed.')
  if (quote.transactionRequest.chainId && Number(quote.transactionRequest.chainId) !== Number(quote.fromChainId)) throw new Error('Transaction chain does not match the source chain in the quote.')
  const accounts = await provider.request({ method:'eth_accounts' }) as string[]
  if (!Array.isArray(accounts) || accounts[0]?.toLowerCase() !== wallet.toLowerCase()) throw new Error('The active wallet account changed. Reconnect and request a fresh quote.')
  const currentChainHex = await provider.request({ method:'eth_chainId' }) as string
  const currentChain = parseInt(currentChainHex, 16)
  if (currentChain !== Number(quote.fromChainId)) {
    await provider.request({ method:'wallet_switchEthereumChain', params:[{ chainId:`0x${Number(quote.fromChainId).toString(16)}` }] })
    throw new Error('Wallet network switched. Get a fresh quote before continuing.')
  }

  const token = quote.action?.fromToken
  const spender = quote.estimate?.approvalAddress
  const requiredAmount = BigInt(quote.action?.fromAmount || '0')
  if (!isNativeToken(token)) {
    if (!token?.address || !spender || requiredAmount <= 0n) throw new Error('Provider did not return complete ERC-20 approval details. Execution blocked; refresh the quote or choose another route.')
    if (!/^0x[a-fA-F0-9]{40}$/.test(token.address) || !/^0x[a-fA-F0-9]{40}$/.test(spender)) throw new Error('Provider approval address is invalid; execution blocked.')
    const allowanceCall = `0xdd62ed3e${wallet.slice(2).toLowerCase().padStart(64,'0')}${spender.slice(2).toLowerCase().padStart(64,'0')}`
    const allowanceHex = await provider.request({ method:'eth_call', params:[{to:token.address, data:allowanceCall}, 'latest'] }) as string
    if (BigInt(allowanceHex) < requiredAmount) {
      onStatus(`Approval required for ${token.symbol}. Confirm the exact-amount approval in your wallet.`)
      const approveData = `0x095ea7b3${spender.slice(2).toLowerCase().padStart(64,'0')}${requiredAmount.toString(16).padStart(64,'0')}`
      const approvalHash = await provider.request({ method:'eth_sendTransaction', params:[{ from:wallet, to:token.address, data:approveData, value:'0x0' }] }) as string
      const approvalExplorer = `${Object.values(EVM_CHAINS).find(x=>x.id===Number(quote.fromChainId))?.explorer || 'https://etherscan.io'}/tx/${approvalHash}`
      let approvalRecord: SavedTransaction = {
        id:approvalHash, type:'approval', fromChainId:Number(quote.fromChainId), toChainId:Number(quote.fromChainId),
        txHash:approvalHash, status:'Approval submitted · awaiting confirmation', createdAt:Date.now(),
        fromSymbol:token.symbol, toSymbol:token.symbol, amount:options.amount, explorer:approvalExplorer,
        fromAddress:wallet, transactionTarget:token.address,
      }
      saveTransaction(approvalRecord); notifySaved(approvalRecord)
      onStatus(`Approval submitted: ${approvalHash}. Waiting for confirmation…`)
      try {
        const approvalReceipt = await waitForReceipt(provider, approvalHash, onStatus)
        const fields = receiptFields(approvalReceipt)
        approvalRecord = { ...approvalRecord, ...fields, status:fields.receiptStatus==='failed'?'Approval reverted on-chain':'Approval confirmed' }
        updateTransaction(approvalHash, { ...fields, status:approvalRecord.status }); notifySaved(approvalRecord)
        if (fields.receiptStatus === 'failed') throw new Error('The approval transaction reverted on-chain. Do not continue until you review it in the explorer.')
      } catch (error) {
        const current = { ...approvalRecord, status:approvalRecord.status.includes('reverted') ? approvalRecord.status : 'Approval submitted · confirmation pending' }
        updateTransaction(approvalHash, { status:current.status }); notifySaved(current)
        throw error
      }
      throw new Error(`Approval confirmed. Transaction: ${approvalHash}. Review and request a fresh quote, then press execute again.`)
    }
  }

  const req = quote.transactionRequest
  const tx: Record<string,string> = { from:wallet, to:req.to, data:req.data, value: req.value == null ? '0x0' : (String(req.value).startsWith('0x') ? String(req.value) : `0x${BigInt(req.value).toString(16)}`) }
  if (req.gasLimit) tx.gas = String(req.gasLimit).startsWith('0x') ? String(req.gasLimit) : `0x${BigInt(req.gasLimit).toString(16)}`
  if (req.gasPrice) tx.gasPrice = String(req.gasPrice).startsWith('0x') ? String(req.gasPrice) : `0x${BigInt(req.gasPrice).toString(16)}`
  onStatus('Review the transaction target, amount and gas in your wallet before confirming.')
  const txHash = await provider.request({ method:'eth_sendTransaction', params:[tx] }) as string
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) throw new Error('Wallet did not return a valid transaction hash.')
  const fromChainId = Number(quote.fromChainId), toChainId = Number(quote.toChainId)
  const saved: SavedTransaction = {
    id:txHash, type:fromChainId===toChainId?'swap':'bridge', fromChainId, toChainId, txHash,
    status:'Submitted · awaiting source confirmation', createdAt:Date.now(), fromSymbol:options.fromSymbol,
    toSymbol:options.toSymbol, amount:options.amount,
    estimatedToAmount:formatUnitsSafe(quote.estimate.toAmount, quote.action.toToken.decimals, 8),
    minimumToAmount:formatUnitsSafe(quote.estimate.toAmountMin ?? quote.estimate.toAmount, quote.action.toToken.decimals, 8),
    explorer:`${Object.values(EVM_CHAINS).find(x=>x.id===fromChainId)?.explorer || 'https://etherscan.io'}/tx/${txHash}`,
    fromAddress:wallet, recipientAddress:quote.action?.toAddress || wallet, transactionTarget:req.to,
  }
  saveTransaction(saved); notifySaved(saved)
  onStatus(`Transaction submitted: ${txHash}. Waiting for source-chain confirmation…`)
  let receipt: any
  try {
    receipt = await waitForReceipt(provider, txHash, onStatus)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transaction confirmation failed.'
    const pending = { ...saved, status:message.includes('reverted')?'Reverted on-chain':'Submitted · confirmation pending' }
    updateTransaction(txHash, { status:pending.status }); notifySaved(pending)
    throw error
  }
  const receiptData = receiptFields(receipt)
  if (receiptData.receiptStatus === 'failed') {
    const reverted = { ...saved, ...receiptData, status:'Reverted on-chain' }
    updateTransaction(txHash, { ...receiptData, status:reverted.status }); notifySaved(reverted)
    throw new Error(`Transaction ${txHash} reverted on-chain. Open the block explorer for the failure details.`)
  }
  const sourceConfirmed: SavedTransaction = {
    ...saved, ...receiptData,
    status:fromChainId===toChainId?'Confirmed on-chain':'Source confirmed · destination pending',
  }
  updateTransaction(txHash, { ...receiptData, status:sourceConfirmed.status }); notifySaved(sourceConfirmed)
  if (fromChainId === toChainId) return { txHash, status:'Confirmed on-chain' }

  onStatus('Source transaction confirmed. Checking destination settlement with LI.FI…')
  for (let i=0; i<30; i++) {
    try {
      const status = await jsonFetch(`${LIFI_BASE}/status?${new URLSearchParams({ txHash, fromChain:String(fromChainId), toChain:String(toChainId) })}`, { headers:lifiHeaders })
      const normalized = String(status?.status || 'PENDING').toUpperCase()
      const receiving = status?.receiving || {}
      const routePatch: Partial<SavedTransaction> = {
        routeSubstatus: status?.substatus ? String(status.substatus) : undefined,
        routeMessage: status?.substatusMessage ? String(status.substatusMessage) : undefined,
        destinationTxHash: receiving?.txHash || status?.toTxHash || undefined,
        destinationExplorer: receiving?.txLink || status?.toTxLink || status?.destinationExplorer || undefined,
        routeExplorer: status?.lifiExplorerLink || status?.explorerLink || undefined,
      }
      const latest = { ...sourceConfirmed, ...routePatch }
      updateTransaction(txHash, routePatch); notifySaved(latest)
      if (normalized === 'DONE') {
        const completed = { ...latest, status:'Destination confirmed' }
        updateTransaction(txHash,{...routePatch,status:completed.status}); notifySaved(completed)
        return {txHash,status:'Destination confirmed'}
      }
      if (normalized === 'FAILED') {
        const failed = { ...latest, status:'Bridge failed · source confirmed' }
        updateTransaction(txHash,{...routePatch,status:failed.status}); notifySaved(failed)
        throw new Error('The source transaction confirmed, but the bridge provider reports failure. Use the route and explorer details in Activity before taking recovery action.')
      }
      onStatus(`Bridge status: ${normalized.toLowerCase()}. Destination funds are not confirmed yet.`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('provider reports failure')) throw error
      onStatus('Source confirmed. Destination settlement is still being indexed; check Activity for the latest status.')
    }
    await new Promise(resolve=>window.setTimeout(resolve, 10_000))
  }
  const pendingDestination = { ...sourceConfirmed, status:'Source confirmed · destination pending' }
  updateTransaction(txHash,{status:pendingDestination.status}); notifySaved(pendingDestination)
  return {txHash,status:'Source confirmed · destination pending'}
}

export async function fetchCowTokens(chainId: number): Promise<ProviderToken[]> {
  const network = COW_BASES[chainId]
  if (!network) throw new Error('Limit orders are not available on this network via CoW Protocol.')
  const data = await jsonFetch(`https://api.cow.fi/${network}/api/v1/tokens`)
  const tokens = Array.isArray(data) ? data : data?.tokens
  if (!Array.isArray(tokens)) throw new Error('CoW Protocol did not return its token catalogue.')
  return tokens.filter((t:any)=>/^0x[a-fA-F0-9]{40}$/.test(t?.address||'') && t?.symbol && Number.isFinite(Number(t?.decimals))).map((t:any)=>({address:t.address,symbol:String(t.symbol).toUpperCase(),name:String(t.name||t.symbol),decimals:Number(t.decimals),logoURI:t.logoURI||undefined,chainId}))
}
export async function cowFetch(url:string, init?:RequestInit) { return jsonFetch(url,init) }
export function cowApiBase(chainId:number) { const network=COW_BASES[chainId]; if(!network) throw new Error('CoW Protocol does not support limit orders on the selected network.'); return `https://api.cow.fi/${network}/api/v1` }

export async function waitForCowOrder(chainId:number, uid:string) {
  const base = cowApiBase(chainId)
  const data = await jsonFetch(`${base}/orders/${encodeURIComponent(uid)}`)
  return data
}
