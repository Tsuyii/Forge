import { useState } from 'react'
import { TabBar } from './TabBar'
import { WorkspaceToolbar } from './WorkspaceToolbar'
import { PaneGrid } from './PaneGrid'
import type { Workspace } from '../../types'

interface WorkspaceViewProps {
  workspace: Workspace
}

export function WorkspaceView({ workspace }: WorkspaceViewProps) {
  const [fontSizePx, setFontSizePx] = useState(13)
  const [activePanels, setActivePanels] = useState<Set<string>>(new Set())

  function togglePanel(panel: string) {
    setActivePanels((prev) => {
      const next = new Set(prev)
      if (next.has(panel)) next.delete(panel)
      else next.add(panel)
      return next
    })
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      <TabBar workspace={workspace} />
      <WorkspaceToolbar
        workspace={workspace}
        fontSizePx={fontSizePx}
        onFontSize={setFontSizePx}
        activePanels={activePanels}
        onTogglePanel={togglePanel}
      />
      <PaneGrid workspace={workspace} fontSizePx={fontSizePx} />
    </div>
  )
}
