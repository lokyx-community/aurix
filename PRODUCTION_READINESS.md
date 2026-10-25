# Aurix production readiness gate

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
