# PioSwap PIO Liquidity + Advanced Trading Mobile Update

## Included
- Added `Liquidity` page to the Trade navigation.
- Added PIO / USDC and PIO / ETH pool selector UI.
- Uses the supplied PioSwap coin SVG at `/pio-coin-logo.svg` in the PIO asset and pool display.
- Added additional mobile CSS to force Advanced Trading panels and quote cards to a single-column, full-width layout.

## Important: PIO liquidity is not live yet
The supplied project does not identify the official PIO token contract address, chain ID, decimals, or deployed AMM pool/router. The page intentionally does not accept deposits or claim a live pool/APR. Add-liquidity and remove-liquidity transactions can only be implemented after those chain/token/provider details are verified and a pool is deployed.

## Advanced Trading status
The mobile layout patch addresses panel/quote overflow and stacking. Actual trade execution still depends on the existing LI.FI provider and supported tokens. Limit orders are not provided by LI.FI and remain unavailable without a separate order execution provider.

## Run
`npm install`
`npm run dev`

Build verification was not completed in this environment because dependency installation timed out.
