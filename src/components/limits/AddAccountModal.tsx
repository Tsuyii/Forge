import { useState } from 'react'
import { X, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import { useAccountStore } from '../../store/accountStore'
import type { ProviderType } from '../../types/accounts'
import { PROVIDER_LABELS, ALL_PROVIDERS } from '../../types/accounts'
import { cn } from '../../lib/utils'

interface AddAccountModalProps {
  defaultProvider?: ProviderType
  onClose: () => void
}

export function AddAccountModal({ defaultProvider = 'claude', onClose }: AddAccountModalProps) {
  const { addAccount } = useAccountStore()

  const [provider, setProvider] = useState<ProviderType>(defaultProvider)
  const [label, setLabel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    if (!apiKey.trim()) {
      setError('API key is required')
      return
    }
    addAccount(provider, label.trim(), apiKey.trim())
    setSaved(true)
    setTimeout(onClose, 600)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter' && e.ctrlKey) handleSave()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onKeyDown={handleKeyDown}
    >
      <div
        className="relative w-[420px] rounded-lg shadow-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
            Add Account
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-[var(--surface-hover)] transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-3">
          {/* Provider */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Provider
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_PROVIDERS.map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={cn(
                    'px-3 py-2 rounded text-[12px] text-left transition-colors',
                    provider === p
                      ? 'bg-[var(--surface-active)] ring-1 ring-[var(--accent)]'
                      : 'hover:bg-[var(--surface-hover)]'
                  )}
                  style={{ color: provider === p ? 'var(--text)' : 'var(--text-muted)' }}
                >
                  {PROVIDER_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Label <span style={{ color: 'var(--text-subtle)' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`Account ${useAccountStore.getState().providers[provider].accounts.length + 1}`}
              className="w-full px-3 py-2 rounded text-[12px] outline-none transition-colors"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* API Key */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setError(null) }}
                placeholder="sk-..."
                autoFocus
                className="w-full px-3 py-2 pr-9 rounded text-[12px] font-mono outline-none transition-colors"
                style={{
                  background: 'var(--bg)',
                  border: `1px solid ${error ? 'var(--status-error)' : 'var(--border)'}`,
                  color: 'var(--text)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = error ? 'var(--status-error)' : 'var(--accent)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = error ? 'var(--status-error)' : 'var(--border)')}
              />
              <button
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded transition-colors hover:bg-[var(--surface-hover)]"
                style={{ color: 'var(--text-subtle)' }}
                tabIndex={-1}
              >
                {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--status-error)' }}>
                <AlertCircle size={11} />
                {error}
              </div>
            )}
          </div>

          <p className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
            Keys are stored locally. OS Keychain integration coming in Phase 6.
          </p>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-4 py-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-[12px] transition-colors hover:bg-[var(--surface-hover)]"
            style={{ color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saved}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] transition-colors',
              saved ? 'opacity-70' : 'hover:opacity-90'
            )}
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            {saved ? <><Check size={12} /> Saved</> : 'Save Account'}
          </button>
        </div>
      </div>
    </div>
  )
}
