import { useState } from 'react'
import { RefreshCw, X, Plus, Check } from 'lucide-react'
import { useAccountStore } from '../../store/accountStore'
import type { Account, ProviderType } from '../../types/accounts'
import { ALL_PROVIDERS, PROVIDER_LABELS, PROVIDER_COLORS } from '../../types/accounts'
import { AddAccountModal } from './AddAccountModal'
import { cn } from '../../lib/utils'

interface AgentLimitsPanelProps {
  onClose: () => void
}

function formatTimeRemaining(ms: number): string {
  const diff = ms - Date.now()
  if (diff <= 0) return 'now'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ${hours % 24}h`
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function UsageBar({ pct, label }: { pct: number; label: string }) {
  const color =
    pct > 30 ? 'var(--status-idle)' :
    pct > 10 ? 'var(--status-working)' :
               'var(--status-error)'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-subtle)' }}>{label}</span>
        <span className="text-[10px] font-mono tabular font-medium" style={{ color }}>{pct}%</span>
      </div>
      <div
        className="h-[3px] rounded-full overflow-hidden"
        style={{ background: 'var(--surface-active)' }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${pct}% remaining`}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(2, pct)}%`, background: color }}
        />
      </div>
    </div>
  )
}

interface AccountCardProps {
  account: Account
  isActive: boolean
  provider: ProviderType
  onSwitch: () => void
  onRemove: () => void
}

function AccountCard({ account, isActive, provider, onSwitch, onRemove }: AccountCardProps) {
  const [switched, setSwitched] = useState(false)
  const color = PROVIDER_COLORS[provider]

  function handleSwitch() {
    if (isActive) return
    setSwitched(true)
    onSwitch()
    setTimeout(() => setSwitched(false), 1500)
  }

  return (
    <div
      className="rounded p-3 flex flex-col gap-2"
      style={{
        background: 'var(--bg)',
        border: `1px solid ${isActive ? color : 'var(--border)'}`,
        opacity: 1,
      }}
    >
      {/* Account header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: isActive ? color : 'var(--text-subtle)' }}
          />
          <span className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>
            {account.label}
          </span>
          {isActive && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
              style={{ background: color + '22', color }}
            >
              active
            </span>
          )}
        </div>
        <button
          onClick={onRemove}
          className="flex items-center justify-center w-5 h-5 rounded opacity-40 hover:opacity-100 transition-opacity hover:bg-[var(--surface-hover)]"
          style={{ color: 'var(--text-muted)' }}
          title="Remove account"
        >
          <X size={10} />
        </button>
      </div>

      {/* Usage bars */}
      <div className="flex flex-col gap-2 pl-4">
        <div>
          <UsageBar pct={account.usage.sessionPct} label="Session" />
          <div className="text-[9px] mt-0.5 text-right" style={{ color: 'var(--text-subtle)' }}>
            Resets {formatTimeRemaining(account.usage.sessionResetsAt)}
          </div>
        </div>

        {account.usage.weeklyPct !== null ? (
          <div>
            <UsageBar pct={account.usage.weeklyPct} label="Weekly" />
            {account.usage.weeklyResetsAt && (
              <div className="text-[9px] mt-0.5 text-right" style={{ color: 'var(--text-subtle)' }}>
                Resets {formatTimeRemaining(account.usage.weeklyResetsAt)}
              </div>
            )}
          </div>
        ) : (
          <div className="text-[10px] text-right" style={{ color: 'var(--text-subtle)' }}>
            Weekly N/A
          </div>
        )}
      </div>

      {/* Switch button */}
      {!isActive && (
        <div className="flex justify-end mt-1">
          <button
            onClick={handleSwitch}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] transition-colors',
              switched ? 'opacity-70' : 'hover:opacity-90'
            )}
            style={{ background: color + '22', color, border: `1px solid ${color}44` }}
          >
            {switched ? <><Check size={11} /> Switched</> : 'Switch'}
          </button>
        </div>
      )}
    </div>
  )
}

interface ProviderSectionProps {
  provider: ProviderType
  onAddAccount: (p: ProviderType) => void
}

function ProviderSection({ provider, onAddAccount }: ProviderSectionProps) {
  const { providers, switchAccount, removeAccount } = useAccountStore()
  const { accounts, activeAccountId } = providers[provider]
  const color = PROVIDER_COLORS[provider]

  return (
    <div className="flex flex-col gap-2">
      {/* Provider header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
            {PROVIDER_LABELS[provider]}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
            {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
          </span>
        </div>
      </div>

      {/* Account cards */}
      {accounts.length === 0 ? (
        <div
          className="text-[11px] py-3 text-center rounded"
          style={{ color: 'var(--text-subtle)', border: '1px dashed var(--border)' }}
        >
          No accounts — add one to track usage
        </div>
      ) : (
        accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            isActive={account.id === activeAccountId}
            provider={provider}
            onSwitch={() => switchAccount(provider, account.id)}
            onRemove={() => removeAccount(provider, account.id)}
          />
        ))
      )}

      {/* Add account */}
      <button
        onClick={() => onAddAccount(provider)}
        className="flex items-center gap-1.5 px-3 py-2 rounded text-[11px] transition-colors hover:bg-[var(--surface-hover)]"
        style={{ color: 'var(--text-muted)', border: '1px dashed var(--border)' }}
      >
        <Plus size={11} />
        Add account
      </button>
    </div>
  )
}

export function AgentLimitsPanel({ onClose }: AgentLimitsPanelProps) {
  const [addingProvider, setAddingProvider] = useState<ProviderType | null>(null)

  return (
    <>
      <div
        className="flex flex-col w-72 shrink-0 h-full overflow-hidden"
        style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2.5 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span className="text-[12px] font-semibold tracking-wide" style={{ color: 'var(--text)' }}>
            AGENT LIMITS
          </span>
          <div className="flex items-center gap-1">
            <button
              className="flex items-center justify-center w-6 h-6 rounded hover:bg-[var(--surface-hover)] transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="Refresh usage"
            >
              <RefreshCw size={12} />
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-6 h-6 rounded hover:bg-[var(--surface-hover)] transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="Close"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Provider sections */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
          {ALL_PROVIDERS.map((provider, i) => (
            <div key={provider}>
              <ProviderSection provider={provider} onAddAccount={setAddingProvider} />
              {i < ALL_PROVIDERS.length - 1 && (
                <div className="mt-4" style={{ borderBottom: '1px solid var(--border)' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {addingProvider && (
        <AddAccountModal
          defaultProvider={addingProvider}
          onClose={() => setAddingProvider(null)}
        />
      )}
    </>
  )
}
