import { TerminalPane } from './TerminalPane'
import type { Workspace } from '../../types'
import { useWorkspaceStore } from '../../store/workspaceStore'

interface PaneGridProps {
  workspace: Workspace
  fontSizePx: number
}

export function PaneGrid({ workspace, fontSizePx }: PaneGridProps) {
  const { setActivePane, closePane } = useWorkspaceStore()
  const panes = workspace.panes

  if (panes.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ color: 'var(--text-subtle)', fontSize: 12 }}
      >
        No panes — add one via Agent ▾
      </div>
    )
  }

  const cols = panes.length === 1 ? 1 : panes.length <= 4 ? 2 : panes.length <= 6 ? 3 : 4

  return (
    <div
      className="flex-1 overflow-hidden p-2"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: '6px',
        minHeight: 0,
      }}
    >
      {panes.map((pane) => (
        <TerminalPane
          key={pane.id}
          pane={pane}
          workspace={{ id: workspace.id, path: workspace.path, name: workspace.name }}
          isActive={workspace.activePane === pane.id}
          onActivate={() => setActivePane(workspace.id, pane.id)}
          onClose={() => closePane(workspace.id, pane.id)}
          fontSizePx={fontSizePx}
        />
      ))}
    </div>
  )
}
