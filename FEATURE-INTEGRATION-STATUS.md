# PioSwap feature implementation notes

## Advanced Trading
- Added a live CoinGecko chart for supported assets and market snapshot (price/change/volume/cap).
- Added a wallet-signed market swap flow using the existing LI.FI quote and execution integration on Ethereum.
- Quote review uses the existing transaction review component and existing wallet confirmation path.
- Limit orders remain explicitly unavailable: a limit order needs a separate order execution protocol. No fake orderbook or simulated order status is displayed.

## Earn
- Added a live stablecoin-yield discovery list from DefiLlama's public yields API, including APY, TVL, chain and protocol link.
- Deposit/withdraw/reward claiming are not enabled. They require a chosen protocol, reviewed contract adapter, chain configuration and transaction-specific risk checks. DefiLlama is a discovery/rate source, not a deposit execution provider.

## Referral Program
- Added shareable wallet referral URLs and browser-local referral attribution, including self-referral prevention and immutable local binding.
- The proposed 50/30/10/5/3/2 fee calculator is retained.
- Server-side or on-chain referral accounting, verified eligible activity, anti-sybil controls, accrued balances and payouts are not enabled. Do not represent local attribution as a reward or claim.

## Credentials / production requirements
- Existing LI.FI server API key belongs in Vercel Environment Variables as `LIFI_API_KEY` (no `VITE_` prefix). It must not be placed in client source.
- The market data and yield discovery pages currently use public endpoints and can be rate-limited.
- No protocol-specific Earn deposit adapter or referral reward contract has been selected/deployed.
- No limit-order provider is currently configured.

## Build validation
- Build could not be validated in this workspace because package installation timed out and the dependency tree is incomplete. Run `npm ci` then `npm run build` locally before deployment.
