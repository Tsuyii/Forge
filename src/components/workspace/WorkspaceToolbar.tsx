import { Globe, FileText, GitBranch, Grid2x2, Mic, Bell, X, ChevronDown, Minus, Plus } from 'lucide-react'
import type { Workspace } from '../../types'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { cn } from '../../lib/utils'

interface WorkspaceToolbarProps {
  workspace: Workspace
  fontSizePx: number
  onFontSize: (px: number) => void
  activePanels: Set<string>
  onTogglePanel: (panel: string) => void
}

const TOOLBAR_BUTTONS = [
  { id: 'browser', icon: Globe, title: 'Browser' },
  { id: 'files', icon: FileText, title: 'File Preview' },
  { id: 'git', icon: GitBranch, title: 'Git Panel' },
  { id: 'tasks', icon: Grid2x2, title: 'Agent Tasks' },
  { id: 'voice', icon: Mic, title: 'SXvoice' },
]

export function WorkspaceToolbar({
  workspace,
  fontSizePx,
  onFontSize,
  activePanels,
  onTogglePanel,
}: WorkspaceToolbarProps) {
  const { closeWorkspace } = useWorkspaceStore()

  return (
    <div
      className="flex items-center gap-1 px-3 py-1.5 shrink-0"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      {/* Pane counter */}
      <span className="text-[11px] font-mono mr-1" style={{ color: 'var(--text-muted)' }}>
        {workspace.panes.length > 0
          ? `${workspace.panes.findIndex((p) => p.id === workspace.activePane) + 1}/${workspace.panes.length}`
          : '0/0'}
      </span>

      <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

      {/* Font size */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onFontSize(Math.max(9, fontSizePx - 1))}
          className="flex items-center justify-center w-5 h-5 rounded hover:bg-[var(--surface-hover)] transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <Minus size={10} />
        </button>
        <span className="text-[11px] font-mono w-6 text-center" style={{ color: 'var(--text-muted)' }}>
          {fontSizePx}
        </span>
        <button
          onClick={() => onFontSize(Math.min(24, fontSizePx + 1))}
          className="flex items-center justify-center w-5 h-5 rounded hover:bg-[var(--surface-hover)] transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <Plus size={10} />
        </button>
      </div>

      <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

      {/* Panel toggles */}
      {TOOLBAR_BUTTONS.map(({ id, icon: Icon, title }) => (
        <button
          key={id}
          onClick={() => onTogglePanel(id)}
          title={title}
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded transition-colors',
            activePanels.has(id) ? 'bg-[var(--surface-active)]' : 'hover:bg-[var(--surface-hover)]'
          )}
          style={{
            color: activePanels.has(id) ? 'var(--accent-bright)' : 'var(--text-muted)',
          }}
        >
          <Icon size={14} />
        </button>
      ))}

      <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

      {/* Bell */}
      <button
        className="flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--surface-hover)] transition-colors"
        style={{ color: 'var(--text-muted)' }}
        title="Sound notifications"
      >
        <Bell size={14} />
      </button>

      <div className="flex-1" />

      {/* Agent dropdown */}
      <button
        className="flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] transition-colors"
        style={{ background: 'var(--surface-active)', borderColor: 'var(--border)', color: 'var(--text)' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-active)')}
      >
        Agent
        <ChevronDown size={11} />
      </button>

      {/* Close workspace */}
      <button
        onClick={() => closeWorkspace(workspace.id)}
        className="flex items-center justify-center w-7 h-7 rounded transition-colors hover:bg-[var(--surface-hover)]"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--status-error)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '')}
        title="Close workspace"
      >
        <X size={14} />
      </button>
    </div>
  )
}
