# PioSwap

A premium, responsive multichain DEX interface starter built with React, TypeScript and Vite.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Create a production bundle with `npm run build`.

## What works in this build

- Responsive 13-section interface, sidebar and mobile navigation.
- Light/dark theme preference and watchlist persisted in local storage.
- Injected EVM wallet connection through `window.ethereum` (connects and shows the public address; it does not request a seed phrase).
- Live public crypto market list and token logos from CoinGecko's public API, refreshed every two minutes when the API is reachable. The public endpoint can rate-limit requests; the UI reports unavailable data rather than making up prices.
- Market search, watchlist filtering, 24-hour change, market cap and token explorer table.
- Swap amount entry, token selection, reverse pair and slippage UI. Swap quote and transaction submission remain disabled until a provider and PIO token configuration are verified.
- Cross-chain network selection and validation that source/destination differ. Route estimates and bridge execution are not integrated.
- Privacy toggle, theme settings and honest empty/error states for portfolio, activity, limit orders and Earn.
- Animated gold-particle ribbon and editorial Playfair Display / DM Sans / DM Mono typography.

## Important: not production-ready for real funds

This is a working UI/data prototype, **not a production DEX**. A wallet connection alone does not make a swap or bridge safe. Before mainnet trading, configure official PIO token addresses and chain IDs, a supported swap/bridge provider, server-side secrets where needed, quote validation, simulation/preflight, approval safety, transaction receipt tracking, portfolio indexing, error monitoring, automated tests and an independent security review. Never paste a seed phrase or private key into this app.

PIO is deliberately not assigned a price, logo, contract address, or tradability status without official details. Advanced Trading does not invent an order book or candlestick chart. Earn and limit orders remain unavailable until real protocols/execution services are integrated.

## Market-data attribution

Market information and token imagery are fetched from CoinGecko's public API. API access and availability are subject to CoinGecko's terms and rate limits. A public keyless endpoint is used for ease of local preview; for a deployed service, use a server-side proxy and a properly managed API key if required. Never place private API keys in a `VITE_*` environment variable.
