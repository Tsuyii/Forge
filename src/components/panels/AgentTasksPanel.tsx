import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { X, Play, LayoutGrid } from 'lucide-react'
import type { Workspace, AgentType } from '../../types'
import { AGENT_CONFIGS } from '../../types'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { cn } from '../../lib/utils'

interface TaskHistoryItem {
  id: string
  task: string
  agent: AgentType
  timestamp: number
  status: 'sent' | 'error'
  error?: string
}

const AGENT_CHIPS: AgentType[] = ['claude', 'codex', 'gemini', 'agy', 'shell']

type PaneTarget = 'active' | 'new'

interface AgentTasksPanelProps {
  workspace: Workspace
  onClose: () => void
}

export function AgentTasksPanel({ workspace, onClose }: AgentTasksPanelProps) {
  const [task, setTask] = useState('')
  const [paneTarget, setPaneTarget] = useState<PaneTarget>('active')
  const [selectedAgent, setSelectedAgent] = useState<AgentType>(workspace.agent)
  const [history, setHistory] = useState<TaskHistoryItem[]>([])
  const [running, setRunning] = useState(false)

  const { addPane } = useWorkspaceStore()

  async function handleRun() {
    if (!task.trim()) return
    setRunning(true)

    const timestamp = Date.now()
    const id = `${timestamp}-${Math.random().toString(36).slice(2, 7)}`
    let ptyId: string | null = null

    try {
      if (paneTarget === 'new') {
        // Add a new pane and get its PTY id
        const newPaneId = addPane(workspace.id, selectedAgent)
        // The pane is added but PTY isn't started yet — we use pty_write via the PTY id
        // Wait briefly for the PTY to be connected via TerminalPane effect
        // We find the pane's ptyId from the store state after add
        const latestWorkspace = useWorkspaceStore.getState().workspaces.find(
          (w) => w.id === workspace.id
        )
        const newPane = latestWorkspace?.panes.find((p) => p.id === newPaneId)
        ptyId = newPane?.ptyId ?? null
      } else {
        // Use the active pane
        const activePane = workspace.panes.find((p) => p.id === workspace.activePane)
        ptyId = activePane?.ptyId ?? null
      }

      if (!ptyId) {
        // PTY not ready — still record as error
        setHistory((prev) => [
          { id, task, agent: selectedAgent, timestamp, status: 'error', error: 'PTY not ready' },
          ...prev,
        ])
        setRunning(false)
        return
      }

      await invoke('write_pty', { ptyId, data: task + '\n' })

      setHistory((prev) => [
        { id, task, agent: selectedAgent, timestamp, status: 'sent' },
        ...prev,
      ])
      setTask('')
    } catch (e) {
      setHistory((prev) => [
        { id, task, agent: selectedAgent, timestamp, status: 'error', error: String(e) },
        ...prev,
      ])
    } finally {
      setRunning(false)
    }
  }

  function formatTime(ms: number): string {
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      className="flex flex-col w-80 shrink-0 h-full overflow-hidden"
      style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)', height: 36 }}
      >
        <div className="flex items-center gap-2">
          <LayoutGrid size={13} style={{ color: 'var(--cta)' }} />
          <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--text)' }}>
            AGENT TASKS
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-[var(--surface-hover)] transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title="Close"
        >
          <X size={13} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 overflow-hidden p-3 gap-3">
        {/* Task input */}
        <textarea
          placeholder="Ask an agent to do a concrete task..."
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              handleRun()
            }
          }}
          className="w-full rounded text-[11px] p-2 resize-none outline-none"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            minHeight: 72,
            maxHeight: 120,
          }}
          rows={4}
        />

        {/* Pane target toggle */}
        <div
          className="flex rounded overflow-hidden text-[10px]"
          style={{ border: '1px solid var(--border)' }}
        >
          {(['active', 'new'] as PaneTarget[]).map((target) => (
            <button
              key={target}
              onClick={() => setPaneTarget(target)}
              className={cn(
                'flex-1 py-1.5 font-semibold tracking-wider uppercase transition-colors',
                paneTarget === target ? '' : 'hover:bg-[var(--surface-hover)]'
              )}
              style={{
                background: paneTarget === target ? 'var(--surface-active)' : 'transparent',
                color: paneTarget === target ? 'var(--cta)' : 'var(--text-muted)',
                borderRight: target === 'active' ? '1px solid var(--border)' : 'none',
              }}
            >
              {target === 'active' ? 'Active pane' : 'New pane'}
            </button>
          ))}
        </div>

        {/* Agent selector chips */}
        <div className="flex flex-wrap gap-1.5">
          {AGENT_CHIPS.map((agent) => {
            const cfg = AGENT_CONFIGS[agent]
            const isSelected = selectedAgent === agent
            return (
              <button
                key={agent}
                onClick={() => setSelectedAgent(agent)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors',
                )}
                style={{
                  background: isSelected ? cfg.color + '22' : 'var(--bg)',
                  border: `1px solid ${isSelected ? cfg.color : 'var(--border)'}`,
                  color: isSelected ? cfg.color : 'var(--text-muted)',
                }}
              >
                <span className="font-mono">{cfg.icon}</span>
                <span>{cfg.label}</span>
              </button>
            )
          })}
        </div>

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={running || !task.trim()}
          className="flex items-center justify-center gap-2 w-full py-2 rounded text-[11px] font-semibold transition-colors"
          style={{
            background: running || !task.trim() ? 'var(--surface-active)' : 'var(--cta)',
            color: running || !task.trim() ? 'var(--text-muted)' : 'var(--bg)',
            opacity: running || !task.trim() ? 0.6 : 1,
          }}
        >
          <Play size={11} />
          {running ? 'Running…' : 'Run task'}
          {!running && (
            <span className="text-[9px] opacity-60 ml-1">Ctrl+Enter</span>
          )}
        </button>

        {/* History */}
        <div className="flex flex-col flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          <p
            className="text-[10px] font-semibold tracking-wider uppercase mb-2 shrink-0"
            style={{ color: 'var(--text-subtle)' }}
          >
            HISTORY
          </p>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2">
            {history.length === 0 ? (
              <p className="text-[11px] text-center py-4" style={{ color: 'var(--text-subtle)' }}>
                No agent tasks yet.
              </p>
            ) : (
              history.map((item) => {
                const cfg = AGENT_CONFIGS[item.agent]
                return (
                  <div
                    key={item.id}
                    className="rounded p-2 flex flex-col gap-1"
                    style={{
                      background: 'var(--bg)',
                      border: `1px solid ${item.status === 'error' ? 'var(--status-error)' : 'var(--border)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-[10px] font-mono font-semibold"
                        style={{ color: cfg.color }}
                      >
                        {cfg.icon} {cfg.label}
                      </span>
                      <span className="text-[9px]" style={{ color: 'var(--text-subtle)' }}>
                        {formatTime(item.timestamp)}
                      </span>
                    </div>
                    <p
                      className="text-[11px] break-all"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {item.task}
                    </p>
                    {item.error && (
                      <p className="text-[10px]" style={{ color: 'var(--status-error)' }}>
                        {item.error}
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
