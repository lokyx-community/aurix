# PioSwap integration and mainnet-release gate

## Integrated in the current frontend

- LI.FI Widget-based swap and cross-chain flows with EVM, Solana, Tron, Bitcoin, Sui and Stellar provider packages. Wallet connection, token selection, quote review and provider-specific transaction handling are supplied by LI.FI Widget.
- CoW Protocol verified quote, EIP-712 signed sell limit-order creation, account order fetching, exact-amount VaultRelayer allowance checks, and best-effort cancellation on supported networks.
- CoinGecko market feed, DexScreener DEX-pool market activity, partial native/ERC-20 balance reads over public RPCs, and local transaction activity history.

## Must be completed before a production/mainnet launch

- [ ] Independently review every provider request, EIP-712 typed-data schema, contract/spender address, chain map, and transaction calldata validation.
- [ ] Add automated unit/integration/e2e tests for wallet account changes, chain changes, request failures, expired quotes, approval/transaction reverts, pending transactions, bridge recovery, limit-order signatures, fills, cancellations and API rate limits.
- [ ] Add transaction simulation/preflight and block if critical validation cannot be established. Current provider quote verification is not a replacement for independent security review.
- [ ] Test swap and bridge routes separately for each supported chain/token/provider and confirm the API response schemas against current provider docs.
- [ ] Add retry-safe/idempotent UI handling so a user does not accidentally submit a duplicate transaction or limit order after an uncertain network response.
- [ ] Replace best-effort public RPCs with reliable, monitored RPC infrastructure and add full wallet activity/portfolio indexing if needed.
- [ ] Add content security policy, security headers, dependency scanning, observability, incident response, rate control, and privacy review.
- [ ] Configure partner credentials properly. `VITE_*` variables are client-visible and must never contain secret credentials.
- [ ] Test and independently review the non-EVM flows provided by LI.FI Widget (Solana, Tron, Bitcoin, Sui, Stellar) on supported assets/wallets before production release. TON is not included in the configured LI.FI providers.
- [ ] Keep PIO trading disabled until its official chain, contract address, decimals, and identity are verified from an authoritative source.
- [ ] Test on testnets or forks, perform an independent security review and get approval before a mainnet release.

## Operational notes

- Provider routes are dynamic; a quote may not exist for every pair/amount/network. The app only executes if the provider returns an accepted transaction request.
- The app keeps successful provider-reported transaction submissions in browser local storage and updates source/destination state when observed. This is not a server-backed audit log or full historical activity index.
- CoW limit orders are signed off-chain; they may remain open or expire without filling. Off-chain cancellation is best effort and can race a settlement.
- Advanced Trading displays real DEX pool liquidity and volume snapshots, not a centralized exchange order book or guaranteed fill price.
- Portfolio discovery is partial: native assets plus a small list of common ERC-20s over six EVM networks, best-effort public RPCs, and indicative prices.
- The fee-sharing referral page is a design/calculator only. It does not implement fee collection or payouts.

A successful frontend build by itself does not prove exchange safety. No feature should be marketed as audited or production-ready without the checks above.


## Latest UI change (2026-10-28)

- The custom Swap and Cross-Chain form controls have been replaced with LI.FI Widget, themed for PioSwap. This supplies the amount entry, token logos, route quotes, fee/route review and wallet adapter UI.
- The widget is configured with LI.FI SDK `apiKey` from `VITE_LIFI_API_KEY` when present. This must be a public/client key, not a private secret.
- `package-lock.json` was removed in this archive because `npm install --package-lock-only` could not resolve packages in the build environment. Run `npm install` locally to generate a correct lockfile before CI/deployment.
