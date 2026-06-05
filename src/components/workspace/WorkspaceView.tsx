import { useState, useEffect } from 'react'
import { TabBar } from './TabBar'
import { WorkspaceToolbar } from './WorkspaceToolbar'
import { PaneGrid } from './PaneGrid'
import { AgentLimitsPanel } from '../limits/AgentLimitsPanel'
import { FilesPanel } from '../panels/FilesPanel'
import { GitPanel } from '../panels/GitPanel'
import { AgentTasksPanel } from '../panels/AgentTasksPanel'
import { BrowserPanel } from '../panels/BrowserPanel'
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

  // Ctrl+Shift+L shortcut to toggle limits panel
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault()
        togglePanel('limits')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

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
      <div className="flex flex-1 overflow-hidden">
        <PaneGrid workspace={workspace} fontSizePx={fontSizePx} />
        {activePanels.has('files') && (
          <FilesPanel workspace={workspace} onClose={() => togglePanel('files')} />
        )}
        {activePanels.has('git') && (
          <GitPanel workspace={workspace} onClose={() => togglePanel('git')} />
        )}
        {activePanels.has('tasks') && (
          <AgentTasksPanel workspace={workspace} onClose={() => togglePanel('tasks')} />
        )}
        {activePanels.has('browser') && (
          <BrowserPanel workspace={workspace} onClose={() => togglePanel('browser')} />
        )}
        {activePanels.has('limits') && (
          <AgentLimitsPanel onClose={() => togglePanel('limits')} />
        )}
      </div>
    </div>
  )
}
