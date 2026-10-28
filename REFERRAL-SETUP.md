# PioSwap Referral Registry Setup (no fees/rewards enabled)

This release implements referral link creation and one-time on-chain referral binding. It does **not** collect platform fees, calculate earnings, or pay rewards. Those remain intentionally disabled until PioSwap adds fee collection.

## Contract

`src/contracts/PioReferralRegistry.sol`

- `register()` registers a wallet as an eligible referrer.
- `bindReferrer(address)` binds a wallet to a registered referrer exactly once.
- `referrerOf(wallet)` reads the bound referrer.
- `referralCount(wallet)` reads the number of direct referrals.
- `ReferrerBound` events make attribution publicly auditable.
- Self-referrals and rebinding are rejected.

## Deploy (EVM testnet first)

1. Open Remix IDE (https://remix.ethereum.org/).
2. Create a file named `PioReferralRegistry.sol` and paste the contract source.
3. Compile with Solidity `0.8.24` or newer in the `0.8.x` range.
4. In Deploy & Run, select Injected Provider and connect a wallet on the desired EVM testnet.
5. Deploy `PioReferralRegistry`. Keep the deployment transaction hash and contract address.
6. Set the contract address in `.env.local`:

   ```env
   VITE_REFERRAL_REGISTRY_ADDRESS=0x...
   VITE_REFERRAL_RPC_URL=https://...public-rpc...
   ```

7. Restart Vite (`npm run dev`). For Vercel, add the same `VITE_` values to Project Settings → Environment Variables and redeploy.
8. The wallet that shares links must click **Register wallet** first. A recipient opens `/?ref=0x...`, connects their wallet, then clicks **Bind referrer on-chain**. Binding is irreversible for that wallet on this registry.

## Production cautions

- Test the contract on a testnet and verify the exact chain before using mainnet.
- The UI must be built with the intended registry address. Vite `VITE_` variables are embedded at build time.
- This is an attribution registry only. It has no fee or reward logic and cannot distribute money.
- Do not promise a reward balance or payout based on referral count.
- A future fee/reward contract should be separately reviewed/audited, and must only split fees that PioSwap actually collects.
