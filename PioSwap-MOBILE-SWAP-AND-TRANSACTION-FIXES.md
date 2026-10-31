# PioSwap mobile swap, wallet and transaction-status fixes

This source update preserves the existing PioSwap visual identity and Gemini chatbot integration.

## Included changes

- Mobile network and token selectors now render in a portal above the page layout, with their own scrollable lists and safe-area-aware bottom sheets.
- Swap panels use a single-column mobile layout and have extra bottom padding so the fixed navigation does not cover controls.
- MAX reads the selected EVM token balance from the chain RPC. For a native coin, it reserves a conservative gas buffer before filling the field. For ERC-20 tokens, it reads `balanceOf` for the connected wallet and uses the token's decimals from LI.FI's token list.
- The wallet menu offers address copy and a PioSwap disconnect action. Some wallet extensions do not support programmatic permission revocation; users may still need to remove the site from the wallet's connected-sites settings.
- Swap/bridge execution saves the source transaction hash immediately after the wallet returns it. Once a receipt arrives, the record is updated with status, block number, gas used and fee where the chain supplies those fields.
- Cross-chain records also keep the quoted destination amount/minimum, LI.FI route status/substatus, destination transaction hash, destination explorer link and LI.FI route explorer link when the status API returns them. The quoted amount is an estimate, not a promise of final output.
- ERC-20 approvals are stored separately from swaps. If an approval is needed, the app explains that the approval is not the swap; request a fresh quote and execute again after approval confirmation.
- The Activity page reads `pioswap-transactions` from this browser and shows swaps, cross-chain routes and approvals with explorer links.

## How to install

1. Keep a backup of your current project.
2. Extract this ZIP and use its source files as the project version.
3. Create `.env.local` from `.env.example`, then add your own Gemini API key. The archive intentionally does not contain `.env.local`.
4. Run `npm install`, then `npm run build`.
5. Push the updated source to GitHub and redeploy on Vercel.
6. In Vercel, set `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-3.5-flash-lite` for Production and Preview. Do not set `API_PORT` for Vercel serverless API routes.

## Checking the earlier 2 USDT attempt

Open PioSwap in the same browser/device and same deployed origin where the transaction was submitted. Open the Activity page and check the latest entry:

- **Token approval**: the wallet approved the USDT contract allowance; it did not swap the 2 USDT. After confirmation, request a fresh quote and execute the swap.
- **Submitted / pending**: the source transaction hash exists but has not yet been confirmed.
- **Source confirmed · destination pending**: the source-chain transaction succeeded, but the bridge/route provider has not confirmed the destination transfer yet. Do not submit a duplicate.
- **Destination confirmed**: the route provider reports the destination transfer completed.
- **Reverted on-chain / failed**: inspect the explorer link before taking further action.

Transaction history is kept in browser localStorage, not in a cloud database. It is available on the same browser/device where the wallet transaction was initiated. This app cannot prove the outcome of a past transaction without its hash and source chain.

## Validation note

The modified TypeScript files were syntax-transpiled successfully. A complete `tsc` / Vite build could not be verified in this working environment because the ZIP's `node_modules` tree is incomplete and dependency installation did not finish. Run `npm install` and `npm run build` in your project environment before deploying.
