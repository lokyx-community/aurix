import { useMemo } from 'react'
import { LiFiWidget, type WidgetConfig } from '@lifi/widget'
import { BitcoinProvider } from '@lifi/widget-provider-bitcoin'
import { EthereumProvider } from '@lifi/widget-provider-ethereum'
import { SolanaProvider } from '@lifi/widget-provider-solana'
import { StellarProvider } from '@lifi/widget-provider-stellar'
import { SuiProvider } from '@lifi/widget-provider-sui'
import { TronProvider } from '@lifi/widget-provider-tron'

type Appearance = 'dark' | 'light'
type Mode = 'swap' | 'bridge'

/**
 * Official LI.FI multi-ecosystem widget. Its providers own the token catalog,
 * wallet adapters, quote rendering, route review and transaction lifecycle.
 * API keys must be public/client keys because VITE_* values are browser-visible.
 */
export default function LifiTradeWidget({ appearance, mode, fromChainId, toChainId, fromToken, toToken, fromAmount }: { appearance: Appearance; mode: Mode; fromChainId?: number; toChainId?: number; fromToken?: string; toToken?: string; fromAmount?: string }) {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
  const apiKey = env?.VITE_LIFI_API_KEY?.trim()

  const config = useMemo(() => {
    const dark = {
      primary: { main: '#D8B45E', contrastText: '#211806' },
      secondary: { main: '#F3DFA1', contrastText: '#211806' },
      background: { default: '#131311', paper: '#1B1A17' },
      text: { primary: '#F4F0E6', secondary: '#ABA69B' },
      success: { main: '#68B58D' },
      error: { main: '#D98178' },
      warning: { main: '#D7A84A' },
    }
    const light = {
      primary: { main: '#B48729', contrastText: '#FFFFFF' },
      secondary: { main: '#D8B45E', contrastText: '#211806' },
      background: { default: '#F5F1E7', paper: '#FFFDFA' },
      text: { primary: '#29251D', secondary: '#777064' },
      success: { main: '#287D59' },
      error: { main: '#B84C42' },
      warning: { main: '#976A16' },
    }

    return {
      // Required by WidgetConfig in @lifi/widget 4.10.x. This is the app
      // identifier for LI.FI analytics/rate limits, not a secret key.
      integrator: 'PioSwap',
      appearance,
      providers: [
        EthereumProvider(),
        SolanaProvider(),
        TronProvider(),
        BitcoinProvider(),
        SuiProvider(),
        StellarProvider(),
      ],
      // Initial choices only; users can still change both networks and tokens.
      variant: 'compact',
      fromChain: fromChainId ?? 1,
      toChain: toChainId ?? (mode === 'bridge' ? 8453 : 1),
      ...(fromToken ? { fromToken } : {}),
      ...(toToken ? { toToken } : {}),
      ...(fromAmount ? { fromAmount, formUpdateKey: `${fromChainId ?? 1}-${toChainId ?? 1}-${fromToken ?? ''}-${toToken ?? ''}-${fromAmount}` } : {}),
      ...(apiKey ? { apiKey } : {}),
      theme: {
        colorSchemes: {
          dark: { palette: dark },
          light: { palette: light },
        },
        shape: { borderRadius: 18, borderRadiusSecondary: 14, borderRadiusTertiary: 24 },
        typography: { fontFamily: 'Inter, DM Sans, ui-sans-serif, system-ui, sans-serif' },
        container: {
          border: appearance === 'dark' ? '1px solid rgba(216,180,94,.24)' : '1px solid rgba(180,135,41,.25)',
          borderRadius: '20px',
          boxShadow: appearance === 'dark' ? '0 20px 60px rgba(0,0,0,.18)' : '0 20px 60px rgba(75,57,20,.07)',
        },
      },
    } as WidgetConfig
  }, [appearance, mode, apiKey, fromChainId, toChainId, fromToken, toToken, fromAmount])

  return (
    <div className={`pio-lifi-widget pio-lifi-widget-${mode}`}>
      <LiFiWidget integrator="PioSwap" config={config} />
      {!apiKey && (
        <div className="pio-widget-key-note" role="note">
          LI.FI is using its default public rate limits. Add a public client key in <code>.env.local</code> to use your configured quota, then restart Vite.
        </div>
      )}
    </div>
  )
}
