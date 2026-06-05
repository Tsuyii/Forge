export type ProviderType = 'claude' | 'codex' | 'gemini' | 'agy'

export interface UsageStats {
  sessionPct: number
  weeklyPct: number | null
  sessionResetsAt: number
  weeklyResetsAt: number | null
}

export interface Account {
  id: string
  provider: ProviderType
  label: string
  apiKey: string
  usage: UsageStats
  createdAt: number
  lastUsedAt: number | null
}

export interface ProviderAccounts {
  provider: ProviderType
  activeAccountId: string | null
  accounts: Account[]
}

export const PROVIDER_LABELS: Record<ProviderType, string> = {
  claude: 'Claude Code',
  codex: 'Codex CLI',
  gemini: 'Gemini CLI',
  agy: 'Agy',
}

export const PROVIDER_ENV_VARS: Record<ProviderType, string> = {
  claude: 'ANTHROPIC_API_KEY',
  codex: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
  agy: 'AGY_API_KEY',
}

export const PROVIDER_COLORS: Record<ProviderType, string> = {
  claude: '#d4a853',
  codex: '#4a9eff',
  gemini: '#4fc3f7',
  agy: '#81c784',
}

export const ALL_PROVIDERS: ProviderType[] = ['claude', 'codex', 'gemini', 'agy']

function defaultResetsAt(hoursFromNow: number): number {
  return Date.now() + hoursFromNow * 60 * 60 * 1000
}

export function makeDefaultUsage(): UsageStats {
  return {
    sessionPct: 100,
    weeklyPct: 100,
    sessionResetsAt: defaultResetsAt(5),
    weeklyResetsAt: defaultResetsAt(7 * 24),
  }
}
