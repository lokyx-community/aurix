# PioSwap

A premium, responsive multichain DEX frontend built with React, TypeScript and Vite. The Swap and Cross-Chain screens embed the official LI.FI Widget using EVM, Solana, Tron, Bitcoin, Sui and Stellar providers, with PioSwap-themed quote UX, token logos and wallet flows. Other pages retain the existing market, portfolio, activity and CoW limit-order tools.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

For a production bundle:

```bash
npm run build
npm run preview
```

## Enabled integration paths

- **Wallet:** the top application bar retains its injected EIP-1193 EVM wallet status. Swap and Cross-Chain use LI.FI Widget wallet providers for EVM, Solana, Tron, Bitcoin, Sui and Stellar; wallet availability depends on the selected ecosystem and browser extensions.
- **Markets:** CoinGecko public market prices, subject to endpoint availability and rate limits.
- **Token discovery:** LI.FI token catalogue per supported EVM chain, with token address and decimals retained for route requests.
- **Swap:** the LI.FI Widget owns quote retrieval, token selection, route review and transaction lifecycle for supported ecosystems. Routes and execution availability vary by chain, token, wallet, amount, liquidity and provider support.
- **Cross-chain:** the LI.FI Widget handles supported bridge/swap routes and provider-specific wallets across the configured ecosystems. Always distinguish source-chain confirmation from destination settlement and verify status in the widget/explorer.
- **Portfolio:** reads native balances and a limited list of common ERC-20 tokens on Ethereum, Arbitrum, Base, Optimism, Polygon and BNB Chain using public RPC endpoints. Prices are indicative. This is not a complete portfolio indexer, and RPC or token-list failures produce partial results.
- **Activity:** records transactions PioSwap submits from this browser and shows confirmation/bridge statuses and explorer links. It does not index all historic activity for the connected wallet.
- **Limit orders:** obtains verified quotes from CoW Protocol and supports EIP-712 signed sell limit orders, exact-amount VaultRelayer approval, order list/status and best-effort off-chain cancellation on Ethereum, Gnosis, Arbitrum, Base, Polygon, BNB Chain, Avalanche and Linea. Orders may remain open or expire without filling. Cancellation is not atomic and can race a settlement.
- **Advanced Trading:** live decentralized-exchange pool price, liquidity, volume and recent buy/sell activity via DexScreener. This is not a centralized order book; no bid/ask levels or candlesticks are fabricated.
- **Theme and watchlist:** stored locally in the browser; refined gold identity, coin artwork and tactile controls are preserved.

## Swap and cross-chain UI

The Swap and Cross-Chain pages use the official LI.FI Widget with EVM, Solana, Tron, Bitcoin, Sui and Stellar providers. This replaces the old custom token/amount controls with LI.FI's own token catalogue, official token logos, live route selection, route/fee presentation and provider-specific wallet handling. The cross-chain page starts with Ethereum to Base selected; users can change both networks and assets. A route is available only when LI.FI supports the selected path, amount and assets and the selected ecosystem wallet is compatible. TON is not included among the configured LI.FI providers.

The widget gets its LI.FI SDK API key through `sdkConfig` from `VITE_LIFI_API_KEY`. Since Vite variables are bundled for the browser, use only a public/client key. If no key is set, the widget uses LI.FI's default public rate limits.

## Environment and API keys

`.env.example` lists `VITE_LIFI_API_KEY` as optional. Vite exposes variables prefixed with `VITE_` in client-side bundles. Set it only to a public/client credential approved for browser use. Never put private keys, seed phrases, server-only API secrets, or custody credentials in `.env.local` or any `VITE_*` variable. CoW and DexScreener endpoints are called from the browser; public services can change, rate-limit or block requests.

## Critical safety notes

**This project is not yet independently reviewed or safe to advertise as a production exchange.** Current integrations enable real wallet transactions on supported EVM networks when a provider returns executable data, and users may spend real funds if they confirm in their wallet. Before mainnet rollout, the release must receive a complete security review, API and chain behavior testing, wallet/RPC edge-case tests, transaction simulation/preflight where available, robust monitoring, stronger token validation, reliable RPC/indexing services, security headers/CSP, and incident/recovery procedures. Review every wallet confirmation carefully.

PIO is intentionally excluded from the tradable token picker because its authoritative chain, contract address, decimals and official references have not been supplied and verified. Do not infer the PIO contract from the coin artwork or symbol. Referral allocations are UI-only and do not create, collect, account for or pay fees. Earn, order-book candles, and a centralized exchange order book are not implemented.

## Verification status

The source code was updated to wire these integration paths, but it was not possible to complete a local production build in this environment because the uploaded `node_modules` dependency folders were incomplete and package installation could not be completed. Run `npm ci` and `npm run build` on a machine with registry access, then test each supported network with test funds or a fork before using real funds.

LI.FI chain-ID validation fix (2026-10-28)
- LI.FI /quote responses commonly expose fromChainId and toChainId inside action; root-level chain IDs are optional.
- src/integrations.ts validates the action IDs (and any root-level IDs if supplied), then normalizes root IDs for downstream transaction handling.
- If a true mismatch remains, the error shows requested and returned chain IDs to aid diagnosis.

API key reminder
- Add the key in the project root, next to package.json, in .env.local as VITE_LIFI_API_KEY=your_public_client_key.
- Restart the Vite server after editing .env.local (stop it with Ctrl+C, then run npm run dev).
- VITE_ variables are bundled into client-side code; use only a key intended for browser/client use. Never paste private or server-only secrets into VITE_ variables.


UI refresh (2026-10-28)
- Replaced the custom Swap and Cross-Chain forms with LI.FI Widget, with EVM, Solana, Tron, Bitcoin, Sui and Stellar providers.
- Applied PioSwap champagne-gold and graphite widget theme for dark/light mode.
- API key is passed through LI.FI `sdkConfig.apiKey` when `VITE_LIFI_API_KEY` is configured.
- The project needs `npm install` to create a fresh lockfile for the added dependencies; the older package-lock was intentionally removed to avoid an invalid lockfile.
