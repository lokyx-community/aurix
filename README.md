# PioSwap — Liquidity, Earn, Analytics and Staking foundations

This source package retains the existing PioSwap gold UI and navigation. It adds an understated particle-ribbon motion system, mobile layout improvements, a configurable ad placement, analytics sourced from public market data plus a browser-local execution log, a persistent local price-trigger workflow, a Uniswap V2-compatible liquidity transaction flow, an on-chain referrer-binding flow, and a staking frontend for the included staking contract.

**Important:** this is not a certified production exchange. The PIO chain/token addresses were not supplied with the source. The PIO liquidity and staking actions remain disabled until the real contracts, chain ID, token decimals and router are verified and configured. Referral fee payouts remain inactive until the fee distributor is connected to an actual fee-collection path. See `DEPLOYMENT-CHECKLIST.md`.

## Install and run

1. Extract into a new folder and keep a backup of your current project.
2. Copy `.env.example` to `.env.local` and populate only verified public contract/network values. Do not put wallet private keys or seed phrases in it.
3. In PowerShell, run:

```powershell
npm ci
npm run build
npm run dev
```

Use a LI.FI key in `VITE_LIFI_API_KEY` only if it is intended for public client use; `VITE_` variables are bundled into browser code. Use a server proxy for any private API key.

## What is currently implemented

- **Markets / Analytics:** public market feed with CoinGecko primary and CoinCap fallback. Analytics displays the tracked market's current 24-hour volume, movers, and transaction hashes saved locally in this browser. It is not global PioSwap volume.
- **Earn:** public DefiLlama yield discovery with a refresh/retry path and explicit API errors. This is a discovery list, not a deposit flow.
- **Limit Orders:** a saved browser price trigger that marks alerts as triggered using refreshed public prices. It does not reserve tokens or execute while the tab is closed. True automated limit execution needs a selected keeper/order protocol and verified integration.
- **Liquidity:** wallet-signed add/remove calls to a configured Uniswap V2-compatible router with exact approvals, amount bounds, LP-token verification requirement and receipt checking. No transaction can work until real addresses are configured.
- **Staking:** wallet-signed stake/withdraw/claim transactions using `contracts/src/PioStakingRewards.sol`; the owner must deploy and fund rewards before advertising rewards/APY.
- **Referral:** wallet can bind a referrer with the deployed distributor. The included distribution contract applies 50/30/10/5/3/2 to *collected protocol fees*, not liquidity principal. The actual swap fee collector must call the distributor before payouts are live.
- **Ads / motion:** configurable banner slot and reduced-motion-aware gold particle ribbon. A configured banner is not an ad network; campaign management, impressions and payments require an ad provider/backend.

## Contract sources and tests

See `contracts/`. Referral distribution tests are in `contracts/test/PioReferralFeeDistributor.t.sol`. Forge is required to run them. The current environment did not have a complete installed JavaScript dependency tree or Foundry, so the full Vite/TypeScript build and Solidity tests were not verified here. Run the commands in the checklist on your own machine/testnet before deployment.
