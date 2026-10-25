# PioSwap production readiness gate

## Current state

This repository is a responsive frontend preview. It is **not safe to deploy as a live exchange** and intentionally does not submit swaps or bridges.

## Required before enabling mainnet execution

- [ ] Select chain(s), official PIO contract/mint address, token decimals, canonical token list and trusted RPC/data providers.
- [ ] Integrate a maintained swap/bridge provider under a typed adapter; document supported chains and assets.
- [ ] Validate quote expiry, chain ID, wallet account, token addresses, recipient, calldata/instructions, spender/targets, value, minimum output and fee totals before wallet handoff.
- [ ] Add transaction simulation/preflight where supported and block if critical conditions cannot be established.
- [ ] Require renewed confirmation when a quote expires or materially changes.
- [ ] Implement approvals with least-privilege defaults and explicit approval review.
- [ ] Track transaction receipts from chain data; never infer success from a wallet popup or provider response alone.
- [ ] For cross-chain, track source confirmation and destination settlement independently, with provider-specific recovery guidance.
- [ ] Replace all illustrative market values with source-attributed, timestamped provider data or remove them.
- [ ] Add portfolio indexing and price freshness/partial-data behavior; never treat missing data as zero.
- [ ] Configure secure server-side secrets if a provider key must not be public. Never put secrets in `VITE_*` variables.
- [ ] Add automated unit/integration/e2e tests, dependency scanning, lockfile review, CSP/security headers, error monitoring and incident/status documentation.
- [ ] Complete independent security review and test only on testnets/forks before any mainnet launch.

## Release rule

Do not enable real transaction submission until all relevant checks above are implemented and tested for each supported chain/provider. A green frontend build alone does not establish exchange safety.


## Referral program release gate

- [ ] Specify the exact fee pool; do not allocate percentages of gross swap value or silently include network gas.
- [ ] Define missing referral levels, wallet binding, self-referrals, sybil resistance, eligibility, rounding and payout thresholds.
- [ ] Add auditable accounting, payout/recovery behavior, monitoring and dispute handling.
- [ ] Review and test referral contracts independently before any real fee distribution.

## Additional current implementation notes
- Portfolio queries native coin balances over public RPC endpoints for Ethereum, Arbitrum, Base, Optimism, Polygon, and BNB Chain. RPC availability can vary, and this is not a complete portfolio indexer; ERC-20 and Solana token balances are not included.
- USD estimates use the current market feed when a matching native asset price is available. Unpriced balances are explicitly identified; total value can therefore be partial.
- Public RPC endpoints are best-effort and may rate-limit. Production deployment should use monitored, reliable RPC infrastructure and chain-specific tests.
- This does not enable swaps, bridging, orders, or referral payouts. Do not enable real-money execution without the safety and audit gates above.


## Cross-chain implementation decision

For a real SOL-to-ETH swap, use a cross-chain aggregator with both Solana and EVM providers. LI.FI documents Solana-to-EVM swaps and bridges; see https://li.fi/knowledge-hub/li-fi-expands-to-solana and https://github.com/lifinance/sdk. The application must discover supported chains/tokens from the provider at runtime, request a quote for the connected source wallet, display route and itemized fees, validate quote expiry and transaction targets, execute through the correct wallet provider, and poll source/destination status. Do not treat selecting Solana and Ethereum as proof that a route exists.

Current source changes improve network selection and asset identity presentation only. They do not enable cross-chain execution or create token contracts/addresses. Solana execution needs a Solana wallet/provider and must not be sent through an EVM wallet. Enable only routes returned by the configured provider and test them on supported testnets/forks before mainnet.

## Expanded network and token discovery (UI update)

The network selector now includes 16 selectable EVM/Solana networks and three additional networks marked coming soon. The swap token picker requests the selected network's token catalogue from LI.FI at runtime and displays provider-listed assets with token metadata. This is discovery only: a selectable network or listed token does not imply a route is currently available or that swap execution has been enabled. The interface must keep execution disabled until live quote validation, wallet/provider integration, transaction review and status tracking are implemented and tested.
