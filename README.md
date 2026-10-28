# PioSwap — Original UI restored with live route review

This version restores the original PioSwap navigation, page structure, original custom Swap / Cross-Chain forms, gold theme, and coin brand. No full-screen widget replaces the original Swap or Cross-Chain page. The only major UI enhancement is the route-quote review card: estimated receive, minimum receive, route provider, fees, price impact when supplied, estimated time, quote freshness, and wallet execution status.

## Install

1. Keep a backup of your current folder.
2. Extract this project into a new folder.
3. Copy your existing `.env.local` beside `package.json`. Never commit or share the real key.
4. In PowerShell run:

```powershell
npm install
npm run build
npm run dev
```

Use a LI.FI public/client API key only; `VITE_` variables are visible to browser code.

## Routing behaviour

- EVM source chains use the original PioSwap form and the LI.FI quote API; the user reviews quote details and confirms in the connected EVM wallet.
- EVM-source bridges to a supported non-EVM destination require the destination receive address.
- If the source chain is non-EVM (e.g. Solana, Bitcoin, Sui, TRON or Stellar), the existing PioSwap page opens LI.FI's themed multi-wallet panel within the same page for ecosystem-specific signing.
- TON is marked coming soon because it is not included among the configured LI.FI wallet providers here.
- PIO is not tradable until its canonical chain, official token contract and decimals are verified.

The widget fallback is embedded inside the original custom page and appears only after requesting a route from a non-EVM source chain. The token/network selectors and amount entry remain visible while choosing a route. TON remains marked coming soon because it is not among the configured LI.FI wallet-provider packages.

This is not an audit or production certification. Confirm that `npm run build` succeeds and test transaction flows with small amounts before using real funds.
