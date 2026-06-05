import { useState, useEffect } from 'react'
import { TitleBar } from './TitleBar'
import { Sidebar } from './Sidebar'
import { WorkspaceLauncher } from '../launcher/WorkspaceLauncher'
import { WorkspaceView } from '../workspace/WorkspaceView'
import { SettingsModal } from '../settings/SettingsModal'
import { useWorkspaceStore } from '../../store/workspaceStore'

export function AppLayout() {
  const { workspaces, activeWorkspaceId } = useWorkspaceStore()
  const [showSettings, setShowSettings] = useState(false)
  const [showLauncher, setShowLauncher] = useState(false)

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) ?? null
  const showHome = !activeWorkspace || showLauncher

  // Auto-dismiss launcher when a workspace becomes active
  useEffect(() => {
    if (activeWorkspace && showLauncher) setShowLauncher(false)
  }, [activeWorkspaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onNewWorkspace={() => setShowLauncher(true)}
          onSettings={() => setShowSettings(true)}
        />

        <main className="flex flex-1 overflow-hidden relative">
          {showHome ? (
            <WorkspaceLauncher />
          ) : (
            activeWorkspace && <WorkspaceView workspace={activeWorkspace} />
          )}

          {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        </main>
      </div>
    </div>
  )
}
