import { useState } from 'react'
import { FolderOpen, Grid, Layers, Minus, Plus } from 'lucide-react'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { useWorkspaceStore } from '../../store/workspaceStore'
import type { AgentType, WorkspaceLayout } from '../../types'
import { AGENT_CONFIGS } from '../../types'
import { cn } from '../../lib/utils'

const AGENTS: AgentType[] = ['claude', 'codex', 'gemini', 'agy', 'custom', 'shell']

export function WorkspaceLauncher() {
  const { createWorkspace, workspaces } = useWorkspaceStore()

  const [path, setPath] = useState('')
  const [name, setName] = useState('')
  const [layout, setLayout] = useState<WorkspaceLayout>('grid')
  const [agentCounts, setAgentCounts] = useState<Partial<Record<AgentType, number>>>({ claude: 1 })
  const [customCommand, setCustomCommand] = useState('')

  const totalAgents = Object.values(agentCounts).reduce((a, b) => a + (b ?? 0), 0)

  const recentPaths = [...new Set(workspaces.map((w) => w.path))].slice(0, 5)

  async function browse() {
    const selected = await openDialog({ directory: true, multiple: false })
    if (typeof selected === 'string') setPath(selected)
  }

  function setCount(agent: AgentType, delta: number) {
    setAgentCounts((prev) => {
      const cur = prev[agent] ?? 0
      const next = Math.max(0, cur + delta)
      if (next === 0) {
        const { [agent]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [agent]: next }
    })
  }

  function handleOpen() {
    if (!path) return
    const entries = Object.entries(agentCounts) as [AgentType, number][]
    const primary = entries[0]
    if (!primary) return
    createWorkspace({
      name: name || path.split(/[\\/]/).pop() || 'workspace',
      path,
      agent: primary[0],
      count: totalAgents,
      layout,
    })
  }

  return (
    <div
      className="flex flex-col items-center justify-center flex-1 h-full overflow-y-auto py-8"
      style={{ background: 'var(--bg)' }}
    >
      <div className="w-full max-w-xl px-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>New Workspace</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Choose a directory and configure your agents
          </p>
        </div>

        {/* Layout cards */}
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { key: 'grid' as WorkspaceLayout, icon: Grid, title: 'Workspace', desc: 'Tabbed terminals in a grid', disabled: false },
              { key: 'canvas' as WorkspaceLayout, icon: Layers, title: 'Canvas', desc: 'Infinite surface (coming soon)', disabled: true },
            ] as { key: WorkspaceLayout; icon: typeof Grid; title: string; desc: string; disabled: boolean }[]
          ).map(({ key, icon: Icon, title, desc, disabled }) => (
            <button
              key={key}
              onClick={() => !disabled && setLayout(key)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border text-center transition-colors',
                disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                layout === key && !disabled ? 'border-[var(--accent)]' : 'border-[var(--border)]'
              )}
              style={{
                background: layout === key && !disabled ? 'var(--surface-active)' : 'var(--surface)',
              }}
            >
              <Icon size={20} style={{ color: layout === key && !disabled ? 'var(--accent-bright)' : 'var(--text-muted)' }} />
              <div>
                <div className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>{title}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Path picker */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Directory</label>
          <div className="flex gap-2">
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="C:\Users\you\project"
              className="flex-1 px-3 py-2 rounded text-[12px] outline-none border transition-colors"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
            <button
              onClick={browse}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-[11px] border transition-colors"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '')}
            >
              <FolderOpen size={13} />
              Browse
            </button>
          </div>

          {/* Recent paths */}
          {recentPaths.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {recentPaths.map((p) => (
                <button
                  key={p}
                  onClick={() => setPath(p)}
                  className="text-[10px] px-2 py-0.5 rounded-full border transition-colors"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-muted)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                >
                  {p.split(/[\\/]/).pop()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Workspace name */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
            Name <span style={{ color: 'var(--text-subtle)' }}>(optional)</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-project"
            className="w-full px-3 py-2 rounded text-[12px] outline-none border transition-colors"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* Agent selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Agents</label>
          <div className="space-y-1">
            {AGENTS.map((agentKey) => {
              const cfg = AGENT_CONFIGS[agentKey]
              const count = agentCounts[agentKey] ?? 0
              return (
                <div
                  key={agentKey}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded border transition-colors',
                    count > 0 ? 'border-[var(--accent)]' : 'border-[var(--border)]'
                  )}
                  style={{ background: count > 0 ? 'var(--surface-active)' : 'var(--surface)' }}
                >
                  <span className="text-[13px] w-4 text-center font-mono shrink-0" style={{ color: cfg.color }}>
                    {cfg.icon}
                  </span>
                  <span className="flex-1 text-[12px]" style={{ color: 'var(--text)' }}>{cfg.label}</span>

                  {agentKey === 'custom' && count > 0 && (
                    <input
                      value={customCommand}
                      onChange={(e) => setCustomCommand(e.target.value)}
                      placeholder="command..."
                      className="flex-1 px-2 py-0.5 rounded text-[11px] outline-none border"
                      style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    />
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCount(agentKey, -1)}
                      disabled={count === 0}
                      className="flex items-center justify-center w-5 h-5 rounded transition-colors disabled:opacity-30"
                      style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)' }}
                    >
                      <Minus size={10} />
                    </button>
                    <span className="w-5 text-center text-[11px] font-mono" style={{ color: 'var(--text)' }}>
                      {count}
                    </span>
                    <button
                      onClick={() => setCount(agentKey, 1)}
                      className="flex items-center justify-center w-5 h-5 rounded transition-colors"
                      style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick buttons */}
          <div className="flex gap-2">
            {(['1 each', 'Fill', 'Clear'] as const).map((label) => (
              <button
                key={label}
                onClick={() => {
                  if (label === 'Clear') setAgentCounts({})
                  else if (label === '1 each') setAgentCounts(Object.fromEntries(AGENTS.map((a) => [a, 1])))
                  else if (label === 'Fill') setAgentCounts({ claude: 4 })
                }}
                className="text-[10px] px-2.5 py-1 rounded border transition-colors"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Open button */}
        <button
          onClick={handleOpen}
          disabled={!path || totalAgents === 0}
          className="w-full py-2.5 rounded font-semibold text-[13px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = 'var(--accent-bright)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        >
          Open ({totalAgents})
        </button>
      </div>
    </div>
  )
}
