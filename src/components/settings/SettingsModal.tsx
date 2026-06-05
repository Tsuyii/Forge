import { X } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import type { Theme } from '../../types'

const TABS = ['Appearance', 'Skills', 'Voice', 'Notifications', 'General'] as const

const THEMES: { key: Theme; color: string; label: string }[] = [
  { key: 'graphite', color: '#3a3a3a', label: 'Graphite' },
  { key: 'midnight', color: '#000000', label: 'Midnight' },
  { key: 'navy', color: '#0a0f1e', label: 'Navy' },
  { key: 'paper', color: '#fafafa', label: 'Paper' },
  { key: 'orange', color: '#c87941', label: 'Orange' },
  { key: 'red', color: '#c84141', label: 'Red' },
  { key: 'green', color: '#41c854', label: 'Green' },
  { key: 'purple', color: '#9b41c8', label: 'Purple' },
  { key: 'ember', color: '#a08060', label: 'Ember' },
  { key: 'twilight', color: '#c841d4', label: 'Twilight' },
]

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { theme, setTheme } = useThemeStore()

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="flex rounded-xl overflow-hidden shadow-2xl w-[640px] h-[440px]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left nav */}
        <div className="w-44 shrink-0 border-r py-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
          <div className="px-4 pb-3 text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text-subtle)' }}>
            Settings
          </div>
          {TABS.map((tab) => (
            <button
              key={tab}
              className="w-full text-left px-4 py-2 text-[12px] transition-colors"
              style={{ color: tab === 'Appearance' ? 'var(--text)' : 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Appearance</h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-6 h-6 rounded transition-colors hover:bg-[var(--surface-hover)]"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={13} />
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <div className="text-[11px] font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Theme</div>
              <div className="grid grid-cols-5 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTheme(t.key)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-colors"
                    style={{
                      background: theme === t.key ? 'var(--surface-active)' : 'var(--surface-hover)',
                      borderColor: theme === t.key ? 'var(--accent)' : 'var(--border)',
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{ background: t.color, borderColor: 'var(--border)' }}
                    />
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
