export type Meter = { kind: string; percent: number; resetsAt?: string }
export type Meters = {
  context: (Meter & { tokens?: number; window: number }) | null
  limits: Meter[]
  costUsd?: number
}
export type Look = { theme: string; skin: string }

declare module 'claude-code' {
  interface PluginState {
    'limits-band': {
      meters: Shaped<Meters | null>
      soundOn: boolean
      isHidden: boolean
      look: Look
    }
  }
}
