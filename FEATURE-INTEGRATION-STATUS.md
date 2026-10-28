# PioSwap feature implementation status — 2026-10-28

## Data and presentation
- Public market feed uses CoinGecko with CoinCap as a fallback when the primary endpoint is rate-limited or unavailable.
- Analytics shows current market feed summaries plus wallet execution records held in this browser. It is not backend-indexed platform-wide analytics.
- Earn calls DefiLlama's public yield API, uses explicit API/error/empty states and a retry path. It is discovery only; it does not make deposits.
- Particle ribbon motion is canvas-based, gold-toned and reduced-motion-aware. Ad banner placement is configurable by public VITE variables; no ad network or billing is connected.

## Trading / limit orders
- Existing provider-based swap and bridge routes remain subject to route availability, wallet support and user confirmation.
- Advanced Trading market swaps use the LI.FI quote/execution path on Ethereum. The Limit Orders page stores local price triggers and monitors live reference prices while the browser tab remains open. It does not place an unattended limit order or reserve tokens.
- True unattended limit orders need a selected provider/keeper protocol, chain-specific order contracts, order expiry, slippage, cancellation/refund semantics and audited execution handling.

## Liquidity
- The Liquidity page calls `addLiquidity`/`removeLiquidity` on a configured Uniswap V2-compatible router. Add flow checks balances, requests exact approvals, uses 0.5% min-amount bounds and waits for a receipt. Remove flow requires a verified LP-token address and positive user-supplied minimum outputs.
- No PIO chain/token/router information was provided. Until the values in `.env.example` are populated with verified addresses for the same chain, this page remains disabled.

## Staking
- `contracts/src/PioStakingRewards.sol` is a single-token staking contract with separately funded rewards, stake/withdraw/claim calls and an owner-managed reward schedule. Frontend actions use wallet-signed transactions only after contract/token/chain configuration.
- This source has not received an independent security audit. Test and review before mainnet. Fund rewards and confirm reward-token inventory and economics before advertising APY.

## Referral fee distribution
- `contracts/src/PioReferralFeeDistributor.sol` implements 50% treasury / 30% LP provider / 10% direct referrer / 5% level 2 / 3% level 3 / 2% level 4 for fees that have already been collected. Missing referral-level shares fall back to treasury. The contract does not split the user's liquidity principal.
- Frontend can bind a referrer on-chain when the distributor and chain are configured. Real payouts are NOT live until the real fee collection path invokes `distributeFee`, passes a correct token amount and LP-provider identity, and is independently tested. Current LI.FI execution does not automatically call this contract.

## Build validation
- Static TypeScript/TSX transpile checks passed for the project's TS/TSX files in this workspace.
- `npm run build` could not be completed because the dependency install in this workspace is incomplete (`npm ci` timed out, leaving missing type packages). Run `npm ci` and `npm run build` in a clean local folder before deploying.
- Foundry (`forge`) was unavailable in this workspace; Solidity tests were not run.
