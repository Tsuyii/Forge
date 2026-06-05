import { useState } from 'react'
import { X, Palette, Cpu, Volume2, Bell, Sliders } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import type { Theme } from '../../types'
import { cn } from '../../lib/utils'

const THEMES: { key: Theme; swatch: string; label: string }[] = [
  { key: 'graphite', swatch: '#3a3a3a',  label: 'Graphite' },
  { key: 'midnight', swatch: '#111111',  label: 'Midnight' },
  { key: 'navy',     swatch: '#1e3a6e',  label: 'Navy'     },
  { key: 'paper',    swatch: '#f5f5f5',  label: 'Paper'    },
  { key: 'orange',   swatch: '#c87941',  label: 'Orange'   },
  { key: 'red',      swatch: '#c84141',  label: 'Red'      },
  { key: 'green',    swatch: '#41c854',  label: 'Green'    },
  { key: 'purple',   swatch: '#9b41c8',  label: 'Purple'   },
  { key: 'ember',    swatch: '#a08060',  label: 'Ember'    },
  { key: 'twilight', swatch: '#c841d4',  label: 'Twilight' },
]

const TABS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'agents',     label: 'Agents',     icon: Cpu     },
  { id: 'voice',      label: 'Voice',      icon: Volume2 },
  { id: 'notifications', label: 'Alerts',  icon: Bell    },
  { id: 'general',    label: 'General',    icon: Sliders },
] as const

type TabId = (typeof TABS)[number]['id']

interface SettingsModalProps {
  onClose: () => void
}

function ToggleRow({ label, description, checked = false }: { label: string; description?: string; checked?: boolean }) {
  const [on, setOn] = useState(checked)
  return (
    <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
      <div>
        <div className="text-[12px]" style={{ color: 'var(--text)' }}>{label}</div>
        {description && (
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-subtle)' }}>{description}</div>
        )}
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        className="relative w-8 h-4.5 rounded-full transition-colors shrink-0"
        style={{
          background: on ? 'var(--accent)' : 'var(--surface-active)',
          border:     '1px solid var(--border)',
          height:     '18px',
          width:      '32px',
        }}
      >
        <span
          className="absolute top-0.5 rounded-full transition-all"
          style={{
            width:      '14px',
            height:     '14px',
            background: on ? 'var(--bg)' : 'var(--text-muted)',
            left:       on ? 'calc(100% - 16px)' : '2px',
          }}
        />
      </button>
    </div>
  )
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { theme, setTheme } = useThemeStore()
  const [activeTab, setActiveTab] = useState<TabId>('appearance')

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center animate-fadeIn"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <div
        className="flex rounded-xl overflow-hidden shadow-2xl animate-fadeInUp"
        style={{
          background: 'var(--surface)',
          border:     '1px solid var(--border)',
          width:      '660px',
          height:     '460px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left nav */}
        <div
          className="w-44 shrink-0 flex flex-col border-r"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <div className="px-4 pt-4 pb-3">
            <div
              className="text-[10px] font-bold tracking-widest uppercase"
              style={{ color: 'var(--text-subtle)' }}
            >
              Settings
            </div>
          </div>

          <nav className="flex-1 px-2">
            {TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] transition-all mb-0.5',
                    isActive ? 'bg-[var(--surface-active)]' : 'hover:bg-[var(--surface-hover)]'
                  )}
                  style={{
                    color: isActive ? 'var(--text)' : 'var(--text-muted)',
                    borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                    paddingLeft: isActive ? '10px' : '12px',
                  }}
                >
                  <Icon size={13} style={{ color: isActive ? 'var(--accent-bright)' : 'var(--text-muted)' }} />
                  {label}
                </button>
              )
            })}
          </nav>

          {/* Version */}
          <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="text-[9px] font-mono" style={{ color: 'var(--text-subtle)' }}>
              Forge v0.1.0-alpha
            </span>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
              {TABS.find((t) => t.id === activeTab)?.label}
            </h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-6 h-6 rounded-md transition-colors hover:bg-[var(--surface-hover)]"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={13} />
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                {/* Theme */}
                <div>
                  <div className="text-[11px] font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
                    Theme
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {THEMES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setTheme(t.key)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all',
                          theme === t.key && 'ring-1 ring-[var(--accent)]'
                        )}
                        style={{
                          background:  theme === t.key ? 'var(--surface-active)' : 'var(--surface-hover)',
                          borderColor: theme === t.key ? 'var(--accent)' : 'var(--border)',
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-full border-2"
                          style={{
                            background:   t.swatch,
                            borderColor:  theme === t.key ? 'var(--text)' : 'var(--border)',
                          }}
                        />
                        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                          {t.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font */}
                <div>
                  <div className="text-[11px] font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
                    Terminal Font
                  </div>
                  <div className="flex gap-2">
                    {['JetBrains Mono', 'Fira Code', 'Cascadia Code'].map((font) => (
                      <button
                        key={font}
                        className="flex-1 py-2 px-3 rounded-lg border text-[11px] font-mono transition-all"
                        style={{
                          background:  font === 'JetBrains Mono' ? 'var(--surface-active)' : 'var(--surface)',
                          borderColor: font === 'JetBrains Mono' ? 'var(--accent)' : 'var(--border)',
                          color:       font === 'JetBrains Mono' ? 'var(--text)' : 'var(--text-muted)',
                        }}
                      >
                        {font}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div>
                  <div className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                    Display
                  </div>
                  <ToggleRow label="Cursor blink" checked={true} />
                  <ToggleRow label="Ligatures" description="Render font ligatures in terminal" checked={true} />
                  <ToggleRow label="GPU acceleration" description="Use WebGL renderer" checked={false} />
                </div>
              </div>
            )}

            {activeTab === 'agents' && (
              <div className="space-y-4">
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Configure per-agent environment variables and startup behavior.
                </div>
                <ToggleRow label="Auto-restart on crash" checked={false} />
                <ToggleRow label="Stream output in real-time" checked={true} />
                <ToggleRow label="Show agent memory usage" description="Displays RAM in pane status bar" checked={false} />
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="space-y-4">
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Voice input and playback settings. Requires microphone permission.
                </div>
                <ToggleRow label="Enable voice input" checked={false} />
                <ToggleRow label="Push-to-talk mode" description="Hold a key to record" checked={false} />
                <ToggleRow label="TTS readback" description="Read agent responses aloud" checked={false} />
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <ToggleRow label="Desktop notifications" description="System tray alerts when agents finish" checked={true} />
                <ToggleRow label="Sound on completion" checked={false} />
                <ToggleRow label="Flash taskbar on error" checked={true} />
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-4">
                <ToggleRow label="Start on login" checked={false} />
                <ToggleRow label="Restore workspaces on start" checked={true} />
                <ToggleRow label="Hardware acceleration" checked={true} />
                <ToggleRow label="Send crash reports" description="Anonymous diagnostics" checked={false} />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
