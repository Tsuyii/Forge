import { Globe, FileText, GitBranch, Grid2x2, Mic, Bell, X, ChevronDown, Minus, Plus, LayoutGrid, Gauge } from 'lucide-react'
import type { Workspace } from '../../types'
import { AGENT_CONFIGS } from '../../types'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { cn } from '../../lib/utils'

interface WorkspaceToolbarProps {
  workspace: Workspace
  fontSizePx: number
  onFontSize: (px: number) => void
  activePanels: Set<string>
  onTogglePanel: (panel: string) => void
}

const PANEL_BUTTONS = [
  { id: 'browser', icon: Globe,      title: 'Browser'      },
  { id: 'files',   icon: FileText,   title: 'File Preview' },
  { id: 'git',     icon: GitBranch,  title: 'Git'          },
  { id: 'tasks',   icon: Grid2x2,    title: 'Agent Tasks'  },
  { id: 'voice',   icon: Mic,        title: 'Voice'        },
  { id: 'limits',  icon: Gauge,      title: 'Agent Limits (Ctrl+Shift+L)' },
]

export function WorkspaceToolbar({
  workspace,
  fontSizePx,
  onFontSize,
  activePanels,
  onTogglePanel,
}: WorkspaceToolbarProps) {
  const { closeWorkspace } = useWorkspaceStore()
  const primaryCfg = AGENT_CONFIGS[workspace.agent]
  const paneIndex = workspace.panes.findIndex((p) => p.id === workspace.activePane)
  const paneLabel = workspace.panes.length > 0
    ? `${paneIndex + 1} / ${workspace.panes.length}`
    : '–'

  return (
    <div
      className="flex items-center gap-0.5 px-2 py-1 shrink-0"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      {/* Pane counter */}
      <div
        className="flex items-center gap-1 px-2 py-1 rounded mr-0.5"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
      >
        <LayoutGrid size={11} style={{ color: 'var(--text-subtle)' }} />
        <span className="text-[11px] font-mono tabular" style={{ color: 'var(--text-muted)' }}>
          {paneLabel}
        </span>
      </div>

      <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

      {/* Font size */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onFontSize(Math.max(9, fontSizePx - 1))}
          className="flex items-center justify-center w-5 h-5 rounded transition-colors hover:bg-[var(--surface-hover)]"
          style={{ color: 'var(--text-muted)' }}
          title="Decrease font size"
        >
          <Minus size={9} />
        </button>
        <span
          className="text-[11px] font-mono w-7 text-center tabular"
          style={{ color: 'var(--text-muted)' }}
        >
          {fontSizePx}
        </span>
        <button
          onClick={() => onFontSize(Math.min(24, fontSizePx + 1))}
          className="flex items-center justify-center w-5 h-5 rounded transition-colors hover:bg-[var(--surface-hover)]"
          style={{ color: 'var(--text-muted)' }}
          title="Increase font size"
        >
          <Plus size={9} />
        </button>
      </div>

      <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

      {/* Panel toggles */}
      {PANEL_BUTTONS.map(({ id, icon: Icon, title }) => {
        const isActive = activePanels.has(id)
        return (
          <button
            key={id}
            onClick={() => onTogglePanel(id)}
            title={title}
            className={cn(
              'relative flex items-center justify-center w-7 h-7 rounded transition-all',
              isActive ? 'bg-[var(--surface-active)]' : 'hover:bg-[var(--surface-hover)]'
            )}
            style={{ color: isActive ? 'var(--cta)' : 'var(--text-muted)' }}
          >
            <Icon size={13} />
            {isActive && (
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-[2px] rounded-full"
                style={{ background: 'var(--cta)' }}
              />
            )}
          </button>
        )
      })}

      <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

      {/* Bell */}
      <button
        className="flex items-center justify-center w-7 h-7 rounded transition-colors hover:bg-[var(--surface-hover)]"
        style={{ color: 'var(--text-muted)' }}
        title="Sound notifications"
      >
        <Bell size={13} />
      </button>

      <div className="flex-1" />

      {/* Agent selector */}
      <button
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] transition-all"
        style={{
          background: 'var(--surface-active)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-active)')}
        title="Switch agent"
      >
        <span className="font-mono" style={{ color: primaryCfg.color }}>{primaryCfg.icon}</span>
        <span>{primaryCfg.label}</span>
        <ChevronDown size={10} style={{ color: 'var(--text-muted)' }} />
      </button>

      {/* Close workspace */}
      <button
        onClick={() => closeWorkspace(workspace.id)}
        className="flex items-center justify-center w-7 h-7 rounded transition-all hover:bg-[var(--surface-hover)] ml-1"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--status-error)'
          e.currentTarget.style.background = 'rgba(248,113,113,0.08)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = ''
          e.currentTarget.style.background = ''
        }}
        title="Close workspace"
      >
        <X size={13} />
      </button>
    </div>
  )
}
