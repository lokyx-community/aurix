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

## PioSwap AI chatbot

The site includes a floating **PioSwap AI** assistant that can answer product questions about swap, cross-chain routes, advanced trading, limit orders, liquidity pools, the referral fee split, staking, Earn, markets/analytics, portfolio, token explorer, supported wallets, and the sponsored banner. It is grounded in a PioSwap-specific system prompt and can handle follow-up questions using recent chat context.

### Configure the AI

1. Create an OpenAI API key in your OpenAI platform account.
2. Add `OPENAI_API_KEY` to your local `.env.local` file (copied from `.env.example`). Keep it server-only; do not use a `VITE_` prefix or paste it into frontend code.
3. Add the same `OPENAI_API_KEY` in Vercel → Project → Settings → Environment Variables for the Production, Preview, and Development environments you use.
4. Optionally set `PIOSWAP_CHAT_MODEL` to a model available to your API account. The default is `gpt-4o-mini`.
5. Redeploy the Vercel project so the serverless `/api/chat` route receives the environment variables.
6. Open the site and use the **Ask PioSwap AI** launcher. Try the suggested questions and ask follow-ups.

The chat API is served from `api/chat.ts` and calls OpenAI from the server. The browser never receives the OpenAI API key. If the key is missing, the chat shows a setup error instead of pretending to answer.

### Important boundaries

PioSwap AI is a product guide, not a wallet operator. It does not read the visitor's wallet, account, private data, live balances, order state, or transaction status. It cannot sign transactions, submit orders, claim rewards, or perform financial actions. It does not invent live market values, contract addresses, APYs, or completed payouts. Users must never share seed phrases or private keys.

For production, configure API billing/usage limits and add rate limiting and monitoring to `/api/chat` to protect against abuse and unexpected API spend.


## Gemini AI chatbot

For local chatbot development, copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` from Google AI Studio. The API key is read only by the server; do not put it in frontend variables or commit `.env.local`. Set `GEMINI_MODEL` to a model available to your API key. Free-tier availability, quotas, and terms are determined by Google and may change.
