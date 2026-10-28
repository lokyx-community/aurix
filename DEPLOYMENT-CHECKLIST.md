# PioSwap feature activation checklist

This build includes working client flows for LP transactions against a configured Uniswap V2-compatible router, token staking against the included staking contract, on-chain referral binding against the included distributor contract, locally persisted limit-price alerts, market-data analytics, a configurable sponsor banner, and reduced-motion-aware gold particle motion.

**It is not safe to call it production-ready yet.** No PIO chain/token/router/staking addresses were present in the project at the time these changes were made. Keep those transactions disabled until the addresses, bytecode, chain, token decimals, and contract ownership are verified on a block explorer and independently tested.

## 1. PIO identity and chain

Before enabling any on-chain feature, record and verify:

- Exact chain name and numeric chain ID (mainnet/testnet).
- Official PIO ERC-20 contract address, token decimals, verified source, and official project reference.
- The paired USDC or WETH contract for that same chain.
- The AMM type and its official router address. This code uses a Uniswap V2-compatible `addLiquidity` / `removeLiquidity` router; do not set an arbitrary router address.
- Whether the pool already exists, initial price/liquidity seed plan, and who controls its treasury keys.

Never copy contract addresses from an unverified token search. Use official project docs and the explorer.

## 2. Liquidity provider actions

The Liquidity page uses the configured V2-compatible router. Adding liquidity checks wallet balances, grants an exact-amount approval only when needed, adds 0.5% minimum-amount protection, and waits for the transaction receipt. Removing liquidity requires a configured LP token address and positive user-supplied minimum outputs; obtain those minima from a fresh pool quote before signing.

Configure `VITE_PIO_TOKEN_ADDRESS`, `VITE_LP_CHAIN_ID`, `VITE_LP_ROUTER_ADDRESS`, `VITE_USDC_TOKEN_ADDRESS`, `VITE_USDC_DECIMALS`, `VITE_WETH_TOKEN_ADDRESS`, `VITE_WETH_DECIMALS`, `VITE_PIO_USDC_LP_TOKEN_ADDRESS`, `VITE_PIO_WETH_LP_TOKEN_ADDRESS`, `VITE_PIO_DECIMALS` and `VITE_LP_TOKEN_DECIMALS` in `.env.local`. Empty/default values leave transactions disabled. Restart Vite after editing environment variables.

## 3. Referral fee distribution (important accounting rule)

The published split is **50% platform treasury / 30% liquidity-provider reward allocation / 10% direct LP referrer / 5% level 2 / 3% level 3 / 2% level 4**. These percentages apply to an *eligible fee already collected by the protocol*, not to a user's PIO/USDC deposit, LP token, or liquidity principal. Missing upstream referrals are assigned to the platform treasury. The contract emits an event with the exact integer token amounts actually sent.

Deploy `contracts/src/PioReferralFeeDistributor.sol`; verify source and initialize its treasury; set the real fee-collecting router/service as `feeCollector`; then configure `VITE_PIO_REFERRAL_DISTRIBUTOR_ADDRESS` and `VITE_REFERRAL_CHAIN_ID`. `bindReferrer` can then be bound on-chain from the Referral Program page.

**A crucial integration is still required:** current LI.FI routes do not automatically pass PioSwap's fee proceeds through this contract. Do not activate payouts or advertise them as live until your actual swap execution/fee collection path has been audited to collect the correct fee, approve the distributor, call `distributeFee(token, amount, lpProvider)` and handle the LP-provider identity correctly. If your selected swap provider doesn't expose this extension, the contract alone will not distribute fees from those trades.

## 4. Staking

Deploy `contracts/src/PioStakingRewards.sol` with the actual staking token, reward token and owner address. Transfer reward tokens to the owner account that will fund the schedule, approve the staking contract for that token, and call `fundRewards(amount)` before users are told rewards are active. Set `VITE_STAKING_CHAIN_ID`, `VITE_PIO_STAKING_CONTRACT_ADDRESS`, `VITE_STAKING_TOKEN_ADDRESS`, `VITE_STAKING_TOKEN_SYMBOL`, `VITE_STAKING_TOKEN_DECIMALS` and `VITE_STAKING_REWARD_DECIMALS`. If rewards use a different token than staking, configure `VITE_STAKING_REWARD_TOKEN_ADDRESS` in the deployment records too; the frontend reads the earned amount from the staking contract and displays it using `VITE_STAKING_REWARD_DECIMALS`.

Before mainnet use, test stake, partial/full withdrawal, claim, no reward inventory, mid-period funding, zero supply, multiple stakers, and token transfer edge cases. Obtain an independent contract security review. The included contract is a starting point, not an audit certificate.

## 5. Limit orders

The Limit Orders page currently provides a persistent price-trigger/watch mode using the public CoinGecko market feed. It can mark an alert triggered and stores it in this browser. It does **not** reserve tokens, submit a swap, or execute unattended after the tab closes.

True unattended limit execution requires selecting an order/keeper provider (or deploying a keeper/escrow protocol), defining expiry, slippage, cancellation/refund and token-approval behavior, and integrating its verified API/contract. No private server key should be exposed in Vite variables.

## 6. Analytics and Earn

- Analytics shows the currently loaded public market feed (tracked volume, live asset count and market leaders) and local transaction hashes saved after wallet execution. This is not the protocol's global trading volume.
- Production analytics needs a server/indexer and a database that indexes verified on-chain events. Browser localStorage is per browser and can be cleared.
- Earn calls the public DefiLlama yield API and now accepts a broader set of pools with reported TVL above $100,000 rather than only stablecoin pools. This is discovery only; no earn deposit transactions are implied.

## 7. Ads

Set `VITE_AD_BANNER_TITLE`, `VITE_AD_BANNER_COPY`, `VITE_AD_BANNER_URL` and optionally `VITE_AD_BANNER_IMAGE_URL` to publish a sponsor banner. These values are public, so only use a public creative URL and advertiser landing page. A self-serve ad network, impressions, click measurement, campaign management and payment settlement are not included; the banner is an ad-placement slot.

## 8. Build / release

1. Copy `.env.example` to `.env.local`, then fill only verified deployment values.
2. Run `npm ci`, `npm run build`, and `npm run preview` locally.
3. Test wallet connect/disconnect and chain switching on a testnet first; use tiny test amounts.
4. Test mobile widths at 360, 390, 768 and desktop; respect reduced-motion OS preferences.
5. Verify every linked explorer hash and the distributor/staking event logs.
6. Add real backend telemetry only after privacy, retention, and data integrity requirements are established.

The current LI.FI integration reads `VITE_LIFI_API_KEY` in the browser bundle. Use only a key explicitly intended for public client use; otherwise build a server-side proxy that reads `LIFI_API_KEY` server-side and do not set the private key as a `VITE_` variable. No wallet seed phrase or private key belongs in `.env.local`, Vercel variables with a `VITE_` prefix, or this source repository.
