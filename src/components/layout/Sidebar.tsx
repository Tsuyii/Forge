import { Plus, Settings, X } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useThemeStore } from '../../store/themeStore'
import type { Theme } from '../../types'
import { AGENT_CONFIGS } from '../../types'
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

interface SidebarProps {
  onNewWorkspace: () => void
  onSettings: () => void
}

export function Sidebar({ onNewWorkspace, onSettings }: SidebarProps) {
  const { workspaces, activeWorkspaceId, setActiveWorkspace, closeWorkspace } = useWorkspaceStore()
  const { theme, setTheme } = useThemeStore()

  return (
    <div
      className="flex flex-col w-[196px] shrink-0 h-full"
      style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-subtle)' }}
    >
      {/* Logo + new workspace */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--surface-active)', border: '1px solid var(--border)' }}
        >
          <span style={{ color: 'var(--accent-bright)', fontSize: 14, lineHeight: 1 }}>⬡</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-bold leading-tight tracking-tight" style={{ color: 'var(--text)' }}>
            Forge
          </div>
          <div className="text-[8px] tracking-[0.18em] uppercase font-medium" style={{ color: 'var(--text-subtle)' }}>
            Agent Dev
          </div>
        </div>
        <button
          onClick={onNewWorkspace}
          className="flex items-center justify-center w-6 h-6 rounded-md transition-all shrink-0"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-hover)'
            e.currentTarget.style.color = 'var(--text)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = ''
            e.currentTarget.style.color = ''
          }}
          title="New workspace"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Workspaces list */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 pb-1.5">
          <span
            className="text-[9px] font-semibold tracking-widest uppercase"
            style={{ color: 'var(--text-subtle)' }}
          >
            Workspaces
          </span>
        </div>

        {workspaces.length === 0 && (
          <div className="px-3 py-3 text-center">
            <div className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>
              No workspaces
            </div>
            <button
              onClick={onNewWorkspace}
              className="text-[10px] mt-1.5 transition-colors"
              style={{ color: 'var(--accent)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-bright)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '')}
            >
              Create one →
            </button>
          </div>
        )}

        {workspaces.map((ws) => {
          const primaryCfg = AGENT_CONFIGS[ws.agent]
          const isActive = activeWorkspaceId === ws.id
          const isWorking = ws.panes.some((p) => p.status === 'working')

          return (
            <button
              key={ws.id}
              onClick={() => setActiveWorkspace(ws.id)}
              className="w-full flex items-center gap-2 py-2 text-left transition-all group relative"
              style={{
                paddingLeft: isActive ? '10px' : '12px',
                paddingRight: '8px',
                background: isActive ? 'var(--surface-active)' : '',
                borderLeft: isActive
                  ? `2px solid ${primaryCfg.color}`
                  : '2px solid transparent',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--surface-hover)' }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = '' }}
            >
              {/* Agent icon */}
              <span
                className="font-mono text-[12px] shrink-0 w-4 text-center"
                style={{ color: primaryCfg.color }}
              >
                {primaryCfg.icon}
              </span>

              {/* Name + pane count */}
              <div className="flex-1 min-w-0">
                <div
                  className="truncate text-[11px] font-medium"
                  style={{ color: isActive ? 'var(--text)' : 'var(--text-muted)' }}
                >
                  {ws.name}
                </div>
                <div className="text-[9px] font-mono tabular" style={{ color: 'var(--text-subtle)' }}>
                  {ws.panes.length} pane{ws.panes.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Status dot */}
              <span
                className={cn('w-1.5 h-1.5 rounded-full shrink-0', isWorking && 'animate-pulse-dot')}
                style={{ background: isWorking ? 'var(--status-working)' : 'var(--status-idle)' }}
              />

              {/* Close on hover */}
              <button
                onClick={(e) => { e.stopPropagation(); closeWorkspace(ws.id) }}
                className="absolute right-1.5 opacity-0 group-hover:opacity-100 flex items-center justify-center w-4 h-4 rounded transition-all"
                style={{ color: 'var(--text-subtle)', background: 'var(--surface-active)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--status-error)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                title="Close"
              >
                <X size={9} />
              </button>
            </button>
          )
        })}
      </div>

      {/* Footer: settings + theme */}
      <div className="border-t p-3 space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <button
          onClick={onSettings}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-[11px] transition-all"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-hover)'
            e.currentTarget.style.color = 'var(--text)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = ''
            e.currentTarget.style.color = ''
          }}
        >
          <Settings size={12} />
          Settings
        </button>

        <div>
          <div
            className="text-[9px] font-semibold tracking-widest uppercase mb-2"
            style={{ color: 'var(--text-subtle)' }}
          >
            Theme
          </div>
          <div className="flex flex-wrap gap-1.5">
            {THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                title={t.label}
                className="relative w-[18px] h-[18px] rounded-full transition-all hover:scale-110"
                style={{
                  background: t.swatch,
                  boxShadow:
                    theme === t.key
                      ? `0 0 0 2px var(--bg-secondary), 0 0 0 3.5px var(--text)`
                      : `0 0 0 1px var(--border)`,
                }}
              >
                {theme === t.key && (
                  <span
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      fontSize: '7px',
                      color: t.key === 'paper' ? '#111' : '#fff',
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
