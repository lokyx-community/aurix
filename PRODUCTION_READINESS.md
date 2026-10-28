# PioSwap production-readiness gate

The codebase contains UI and transaction foundations for provider swaps/bridges, on-chain liquidity through a configured Uniswap V2-compatible router, staking through the included staking contract, on-chain referral binding, local price alerts, public-market analytics and yield discovery. These are not equivalent to a production-ready or audited exchange.

## Must be completed before mainnet

- [ ] Verify the official PIO token, chain ID, decimals, paired token addresses, AMM router and LP token addresses through official sources and a block explorer.
- [ ] Deploy the staking and referral contracts on a testnet; verify source and ownership; fund and test staking reward schedules; confirm wallet switching and all transaction receipts.
- [ ] Connect the actual fee collection path to the referral distributor. Confirm eligible fee basis, LP-provider identity, exact allocation, fallback handling, anti-sybil policy, and event indexing. Do not distribute user liquidity principal using referral percentages.
- [ ] Decide and integrate a separate order/keeper provider for unattended limit orders. Until then the UI is a local price-alert tool only.
- [ ] Add a server/indexer and database for platform-wide analytics, transaction history, referral balances and event reconciliation. Browser localStorage must not be treated as canonical accounting.
- [ ] Select protocol-specific adapters before turning Earn into deposit/withdraw/claim functionality.
- [ ] Add request validation, rate control, API retry/backoff, logging/monitoring, content-security policy and security headers.
- [ ] Test supported swap/bridge routes separately for chain, token, wallet, quote expiry, allowance, transaction revert and bridge recovery cases.
- [ ] Independently review all Solidity contracts and frontend transaction targets/calldata. The included contracts are starting points, not audit certificates.
- [ ] Configure a real advertising provider before claiming ads are served or billed. The built-in banner is only an ad-placement slot.
- [ ] Run `npm ci`, `npm run build`, mobile tests at 360/390/768px, and Foundry tests. Use testnet/fork tests and small amounts before any mainnet launch.

## Key/account safety

`VITE_` values are public in the browser bundle. Never put private keys, seed phrases or server-only provider keys in VITE variables or source control. The `VITE_LIFI_API_KEY` variable must contain a key specifically intended for public client use; otherwise use a server-side proxy backed by `LIFI_API_KEY`.
