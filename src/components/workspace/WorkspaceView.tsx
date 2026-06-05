import { useState, useEffect } from 'react'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { TabBar } from './TabBar'
import { WorkspaceToolbar } from './WorkspaceToolbar'
import { PaneGrid } from './PaneGrid'
import { AgentLimitsPanel } from '../limits/AgentLimitsPanel'
import type { Workspace } from '../../types'

interface WorkspaceViewProps {
  workspace: Workspace
}

async function openMemoryWindow() {
  try {
    const existing = await WebviewWindow.getByLabel('memory')
    if (existing) {
      await existing.setFocus()
      return
    }
    new WebviewWindow('memory', {
      url: '/#/memory',
      title: 'Memory',
      width: 900,
      height: 650,
      resizable: true,
      decorations: true,
    })
  } catch (err) {
    console.error('[WorkspaceView] Failed to open memory window:', err)
  }
}

export function WorkspaceView({ workspace }: WorkspaceViewProps) {
  const [fontSizePx, setFontSizePx] = useState(13)
  const [activePanels, setActivePanels] = useState<Set<string>>(new Set())

  function togglePanel(panel: string) {
    if (panel === 'memory') {
      openMemoryWindow()
      return
    }
    setActivePanels((prev) => {
      const next = new Set(prev)
      if (next.has(panel)) next.delete(panel)
      else next.add(panel)
      return next
    })
  }

  // Ctrl+Shift+L → limits panel
  // Ctrl+Shift+Y → memory window
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault()
        togglePanel('limits')
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'Y') {
        e.preventDefault()
        openMemoryWindow()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const showLimits = activePanels.has('limits')

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
        {showLimits && (
          <AgentLimitsPanel onClose={() => togglePanel('limits')} />
        )}
      </div>
    </div>
  )
}
