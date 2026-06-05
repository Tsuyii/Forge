import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateId } from '../lib/utils'
import type { Account, ProviderAccounts, ProviderType, UsageStats } from '../types/accounts'
import { ALL_PROVIDERS, makeDefaultUsage } from '../types/accounts'

interface AccountState {
  providers: Record<ProviderType, ProviderAccounts>

  addAccount: (provider: ProviderType, label: string, apiKey: string) => string
  removeAccount: (provider: ProviderType, accountId: string) => void
  switchAccount: (provider: ProviderType, accountId: string) => void
  updateUsage: (provider: ProviderType, accountId: string, usage: Partial<UsageStats>) => void
  updateApiKey: (provider: ProviderType, accountId: string, apiKey: string) => void
  updateLabel: (provider: ProviderType, accountId: string, label: string) => void
  getActiveAccount: (provider: ProviderType) => Account | null
  getAccountsByProvider: (provider: ProviderType) => Account[]
}

function makeInitialProviders(): Record<ProviderType, ProviderAccounts> {
  return ALL_PROVIDERS.reduce(
    (acc, p) => {
      acc[p] = { provider: p, activeAccountId: null, accounts: [] }
      return acc
    },
    {} as Record<ProviderType, ProviderAccounts>
  )
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      providers: makeInitialProviders(),

      addAccount: (provider, label, apiKey) => {
        const id = generateId()
        const account: Account = {
          id,
          provider,
          label: label || `Account ${get().providers[provider].accounts.length + 1}`,
          apiKey,
          usage: makeDefaultUsage(),
          createdAt: Date.now(),
          lastUsedAt: null,
        }
        set((s) => {
          const p = s.providers[provider]
          const isFirst = p.accounts.length === 0
          return {
            providers: {
              ...s.providers,
              [provider]: {
                ...p,
                accounts: [...p.accounts, account],
                activeAccountId: isFirst ? id : p.activeAccountId,
              },
            },
          }
        })
        return id
      },

      removeAccount: (provider, accountId) =>
        set((s) => {
          const p = s.providers[provider]
          const accounts = p.accounts.filter((a) => a.id !== accountId)
          const activeAccountId =
            p.activeAccountId === accountId
              ? (accounts[0]?.id ?? null)
              : p.activeAccountId
          return {
            providers: {
              ...s.providers,
              [provider]: { ...p, accounts, activeAccountId },
            },
          }
        }),

      switchAccount: (provider, accountId) =>
        set((s) => ({
          providers: {
            ...s.providers,
            [provider]: {
              ...s.providers[provider],
              activeAccountId: accountId,
            },
          },
        })),

      updateUsage: (provider, accountId, usage) =>
        set((s) => ({
          providers: {
            ...s.providers,
            [provider]: {
              ...s.providers[provider],
              accounts: s.providers[provider].accounts.map((a) =>
                a.id === accountId ? { ...a, usage: { ...a.usage, ...usage } } : a
              ),
            },
          },
        })),

      updateApiKey: (provider, accountId, apiKey) =>
        set((s) => ({
          providers: {
            ...s.providers,
            [provider]: {
              ...s.providers[provider],
              accounts: s.providers[provider].accounts.map((a) =>
                a.id === accountId ? { ...a, apiKey } : a
              ),
            },
          },
        })),

      updateLabel: (provider, accountId, label) =>
        set((s) => ({
          providers: {
            ...s.providers,
            [provider]: {
              ...s.providers[provider],
              accounts: s.providers[provider].accounts.map((a) =>
                a.id === accountId ? { ...a, label } : a
              ),
            },
          },
        })),

      getActiveAccount: (provider) => {
        const p = get().providers[provider]
        if (!p.activeAccountId) return null
        return p.accounts.find((a) => a.id === p.activeAccountId) ?? null
      },

      getAccountsByProvider: (provider) => get().providers[provider].accounts,
    }),
    {
      name: 'forge-accounts',
      partialize: (s) => ({ providers: s.providers }),
    }
  )
)
