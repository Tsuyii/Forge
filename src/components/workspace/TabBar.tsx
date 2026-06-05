import { Plus } from 'lucide-react'
import type { Workspace, AgentType } from '../../types'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { cn } from '../../lib/utils'

interface TabBarProps {
  workspace: Workspace
}

export function TabBar({ workspace }: TabBarProps) {
  const { setActiveTabIndex, addPane } = useWorkspaceStore()

  const panesPerTab = Math.ceil(workspace.panes.length / Math.max(1, workspace.activeTabIndex + 1))
  const tabCount = Math.max(1, Math.ceil(workspace.panes.length / Math.max(panesPerTab, 1)))

  return (
    <div
      className="flex items-center gap-0.5 px-2 py-1 shrink-0 overflow-x-auto"
      style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}
    >
      {Array.from({ length: tabCount }, (_, i) => (
        <button
          key={i}
          onClick={() => setActiveTabIndex(workspace.id, i)}
          className={cn(
            'flex items-center justify-center w-7 h-6 rounded text-[11px] font-mono transition-colors',
            workspace.activeTabIndex === i
              ? 'bg-[var(--surface-active)] text-[var(--text)]'
              : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
          )}
        >
          {i + 1}
        </button>
      ))}

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
