import { Plus, Settings, X } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useThemeStore } from '../../store/themeStore'
import type { Theme } from '../../types'
import { cn } from '../../lib/utils'

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

interface SidebarProps {
  onNewWorkspace: () => void
  onSettings: () => void
}

export function Sidebar({ onNewWorkspace, onSettings }: SidebarProps) {
  const { workspaces, activeWorkspaceId, setActiveWorkspace, closeWorkspace } = useWorkspaceStore()
  const { theme, setTheme } = useThemeStore()

  return (
    <div
      className="flex flex-col w-[200px] shrink-0 h-full"
      style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-subtle)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <span style={{ color: 'var(--accent-bright)', fontSize: 18 }}>⬡</span>
        <div>
          <div className="text-[11px] font-bold leading-none" style={{ color: 'var(--text)' }}>Forge</div>
          <div className="text-[9px] tracking-widest mt-0.5" style={{ color: 'var(--text-subtle)' }}>AGENT DEV ENV</div>
        </div>
      </div>

      {/* Workspaces section */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="flex items-center justify-between px-3 pb-1">
          <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text-subtle)' }}>
            Workspaces
          </span>
          <button
            onClick={onNewWorkspace}
            className="flex items-center justify-center w-5 h-5 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
            title="New workspace"
          >
            <Plus size={12} />
          </button>
        </div>

        {workspaces.length === 0 && (
          <div className="px-3 py-2 text-[11px]" style={{ color: 'var(--text-subtle)' }}>
            No workspaces open
          </div>
        )}

        {workspaces.map((ws) => (
          <button
            key={ws.id}
            onClick={() => setActiveWorkspace(ws.id)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors group',
              activeWorkspaceId === ws.id ? 'bg-[var(--surface-active)]' : 'hover:bg-[var(--surface-hover)]'
            )}
          >
            {/* Status dot */}
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                background: ws.panes.some((p) => p.status === 'working')
                  ? 'var(--status-working)'
                  : 'var(--status-idle)',
              }}
            />
            <span
              className="flex-1 truncate text-[11px]"
              style={{ color: activeWorkspaceId === ws.id ? 'var(--text)' : 'var(--text-muted)' }}
            >
              {ws.name}
            </span>
            <span
              className="text-[9px] px-1 rounded shrink-0"
              style={{ background: 'var(--surface-active)', color: 'var(--text-subtle)' }}
            >
              {ws.panes.length}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); closeWorkspace(ws.id) }}
              className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-4 h-4 rounded transition-all"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '')}
            >
              <X size={10} />
            </button>
          </button>
        ))}
      </div>

      {/* Bottom: Settings + Theme swatches */}
      <div className="border-t p-3 space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <button
          onClick={onSettings}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-[11px] transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '' }}
        >
          <Settings size={13} />
          Settings
        </button>

        <div>
          <div className="text-[9px] font-semibold tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-subtle)' }}>
            Theme
          </div>
          <div className="flex flex-wrap gap-1">
            {THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                title={t.label}
                className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                style={{
                  background: t.color,
                  border: theme === t.key ? '2px solid var(--text)' : '2px solid var(--border)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
