import { Plus } from 'lucide-react'
import type { Workspace, AgentType } from '../../types'
import { AGENT_CONFIGS } from '../../types'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { cn } from '../../lib/utils'

interface TabBarProps {
  workspace: Workspace
}

export function TabBar({ workspace }: TabBarProps) {
  const { setActiveTabIndex, addPane } = useWorkspaceStore()

  const panesPerTab = Math.ceil(workspace.panes.length / Math.max(1, workspace.activeTabIndex + 1))
  const tabCount = Math.max(1, Math.ceil(workspace.panes.length / Math.max(panesPerTab, 1)))
  const primaryCfg = AGENT_CONFIGS[workspace.agent]

  return (
    <div
      className="flex items-center gap-0.5 px-2 py-1 shrink-0 overflow-x-auto"
      style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}
    >
      {/* Workspace indicator */}
      <div
        className="flex items-center gap-1.5 px-2 py-1 mr-1 rounded shrink-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
      >
        <span className="font-mono text-[11px]" style={{ color: primaryCfg.color }}>
          {primaryCfg.icon}
        </span>
        <span
          className="text-[11px] font-medium max-w-[120px] truncate"
          style={{ color: 'var(--text-muted)' }}
        >
          {workspace.name}
        </span>
      </div>

      <div className="w-px h-4 mx-0.5" style={{ background: 'var(--border)' }} />

      {/* Tab numbers */}
      {Array.from({ length: tabCount }, (_, i) => {
        const isActive = workspace.activeTabIndex === i
        return (
          <button
            key={i}
            onClick={() => setActiveTabIndex(workspace.id, i)}
            className={cn(
              'relative flex items-center justify-center w-7 h-6 rounded text-[11px] font-mono transition-all',
              isActive
                ? 'bg-[var(--surface-active)] text-[var(--text)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
            )}
          >
            {i + 1}
            {isActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-[2px] rounded-full"
                style={{ background: 'var(--accent-bright)' }}
              />
            )}
          </button>
        )
      })}

      {/* Add pane */}
      <button
        onClick={() => addPane(workspace.id, workspace.agent as AgentType)}
        className="flex items-center justify-center w-7 h-6 rounded transition-colors hover:bg-[var(--surface-hover)]"
        style={{ color: 'var(--text-subtle)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '')}
        title="Add pane"
      >
        <Plus size={11} />
      </button>
    </div>
  )
}
