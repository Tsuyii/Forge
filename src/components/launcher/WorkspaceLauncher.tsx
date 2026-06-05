import { useState } from 'react'
import { Clock, FolderOpen, Grid, Layers, Minus, Plus, Zap } from 'lucide-react'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { useWorkspaceStore } from '../../store/workspaceStore'
import type { AgentType, WorkspaceLayout } from '../../types'
import { AGENT_CONFIGS } from '../../types'
import { cn } from '../../lib/utils'

const AGENTS: AgentType[] = ['claude', 'codex', 'gemini', 'agy', 'custom', 'shell']

const LAYOUTS = [
  { key: 'grid' as WorkspaceLayout, icon: Grid, title: 'Workspace', desc: 'Tabbed pane grid', disabled: false },
  { key: 'canvas' as WorkspaceLayout, icon: Layers, title: 'Canvas', desc: 'Coming in v2', disabled: true },
]

export function WorkspaceLauncher() {
  const { createWorkspace, workspaces } = useWorkspaceStore()

  const [path, setPath] = useState('')
  const [name, setName] = useState('')
  const [layout, setLayout] = useState<WorkspaceLayout>('grid')
  const [agentCounts, setAgentCounts] = useState<Partial<Record<AgentType, number>>>({ claude: 1 })
  const [customCommand, setCustomCommand] = useState('')

  const totalAgents = Object.values(agentCounts).reduce((a, b) => a + (b ?? 0), 0)
  const recentPaths = [...new Set(workspaces.map((w) => w.path))].slice(0, 6)
  const activeAgents = (Object.entries(agentCounts) as [AgentType, number][]).filter(([, c]) => c > 0)
  const canLaunch = !!path && totalAgents > 0

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
    if (!canLaunch) return
    createWorkspace({
      name: name || path.split(/[\\/]/).pop() || 'workspace',
      path,
      agentCounts,
      layout,
      customCommand: customCommand || undefined,
    })
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden animate-fadeIn" style={{ background: 'var(--bg)' }}>

      {/* ── Left brand panel ─────────────────────────── */}
      <div
        className="w-[268px] shrink-0 flex flex-col border-r"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--surface-active)', border: '1px solid var(--border)' }}
            >
              <span style={{ color: 'var(--accent-bright)', fontSize: 20, lineHeight: 1 }}>⬡</span>
            </div>
            <div>
              <div className="text-[15px] font-bold leading-tight tracking-tight" style={{ color: 'var(--text)' }}>
                Forge
              </div>
              <div className="text-[9px] tracking-[0.18em] uppercase font-medium mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                Agent Dev Environment
              </div>
            </div>
          </div>
        </div>

        {/* Live config preview */}
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="text-[9px] font-semibold tracking-widest uppercase mb-2.5" style={{ color: 'var(--text-subtle)' }}>
            Configuration
          </div>
          {activeAgents.length > 0 ? (
            <div className="space-y-1.5">
              {activeAgents.map(([agent, count]) => {
                const cfg = AGENT_CONFIGS[agent]
                return (
                  <div
                    key={agent}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <span className="font-mono text-[13px] shrink-0 w-4 text-center" style={{ color: cfg.color }}>
                      {cfg.icon}
                    </span>
                    <span className="flex-1 text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {cfg.label}
                    </span>
                    <span
                      className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md tabular"
                      style={{ background: 'var(--surface-active)', color: 'var(--text)' }}
                    >
                      ×{count}
                    </span>
                  </div>
                )
              })}
              <div className="text-[10px] px-1 mt-1" style={{ color: 'var(--text-subtle)' }}>
                {totalAgents} pane{totalAgents !== 1 ? 's' : ''} total
              </div>
            </div>
          ) : (
            <div className="text-[11px] py-2" style={{ color: 'var(--text-subtle)' }}>
              No agents configured yet
            </div>
          )}
        </div>

        {/* Recent workspaces */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="text-[9px] font-semibold tracking-widest uppercase mb-2.5" style={{ color: 'var(--text-subtle)' }}>
            Recent
          </div>
          {recentPaths.length > 0 ? (
            <div className="space-y-0.5">
              {recentPaths.map((p) => {
                const folderName = p.split(/[\\/]/).pop() ?? p
                const parentDir = p.split(/[\\/]/).slice(-2, -1)[0] ?? ''
                return (
                  <button
                    key={p}
                    onClick={() => setPath(p)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--surface-hover)'
                      e.currentTarget.style.color = 'var(--text)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = ''
                      e.currentTarget.style.color = ''
                    }}
                  >
                    <Clock size={11} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] truncate font-medium">{folderName}</div>
                      {parentDir && (
                        <div className="text-[9px] truncate mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                          ···/{parentDir}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="text-[11px] py-3 text-center" style={{ color: 'var(--text-subtle)' }}>
              No recent workspaces
            </div>
          )}
        </div>

        {/* Version badge */}
        <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <span
            className="text-[9px] font-mono tracking-wide px-2 py-1 rounded"
            style={{ background: 'var(--surface)', color: 'var(--text-subtle)', border: '1px solid var(--border)' }}
          >
            v0.1.0-alpha
          </span>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[420px] px-8 py-8 mx-auto">

          {/* Header */}
          <div className="mb-7 animate-fadeInUp" style={{ animationDelay: '0ms' }}>
            <h1 className="text-[15px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
              New Workspace
            </h1>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Configure your multi-agent environment
            </p>
          </div>

          {/* Layout */}
          <div className="mb-5 animate-fadeInUp" style={{ animationDelay: '40ms' }}>
            <div className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--text-subtle)' }}>
              Layout
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LAYOUTS.map(({ key, icon: Icon, title, desc, disabled }) => (
                <button
                  key={key}
                  onClick={() => !disabled && setLayout(key)}
                  disabled={disabled}
                  className={cn(
                    'flex items-center gap-3 p-3.5 rounded-lg border text-left transition-all',
                    disabled ? 'cursor-not-allowed' : 'cursor-pointer'
                  )}
                  style={{
                    background: layout === key && !disabled ? 'var(--surface-active)' : 'var(--surface)',
                    borderColor: layout === key && !disabled ? 'var(--accent)' : 'var(--border)',
                    opacity: disabled ? 0.38 : 1,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: layout === key && !disabled ? 'var(--surface-hover)' : 'var(--bg-secondary)' }}
                  >
                    <Icon
                      size={14}
                      style={{ color: layout === key && !disabled ? 'var(--accent-bright)' : 'var(--text-muted)' }}
                    />
                  </div>
                  <div>
                    <div className="text-[11px] font-medium leading-tight" style={{ color: 'var(--text)' }}>{title}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Directory */}
          <div className="mb-5 animate-fadeInUp" style={{ animationDelay: '80ms' }}>
            <div className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--text-subtle)' }}>
              Directory
            </div>
            <div className="flex gap-2">
              <input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="C:\Users\you\project"
                className="flex-1 px-3 py-2 rounded-lg text-[12px] font-mono outline-none border transition-all"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
              <button
                onClick={browse}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] border transition-all shrink-0"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-hover)'
                  e.currentTarget.style.color = 'var(--text)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = ''
                  e.currentTarget.style.color = ''
                }}
              >
                <FolderOpen size={13} />
                Browse
              </button>
            </div>
          </div>

          {/* Name */}
          <div className="mb-5 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text-subtle)' }}>
                Name
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>— optional</div>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-project"
              className="w-full px-3 py-2 rounded-lg text-[12px] outline-none border transition-all"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Agents */}
          <div className="mb-7 animate-fadeInUp" style={{ animationDelay: '120ms' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text-subtle)' }}>
                Agents
              </div>
              <div className="flex gap-1">
                {(['1 each', 'Fill', 'Clear'] as const).map((label) => (
                  <button
                    key={label}
                    onClick={() => {
                      if (label === 'Clear') setAgentCounts({})
                      else if (label === '1 each') setAgentCounts(Object.fromEntries(AGENTS.map((a) => [a, 1])))
                      else setAgentCounts({ claude: 4 })
                    }}
                    className="text-[9px] px-2 py-1 rounded border transition-all font-mono uppercase tracking-wide"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-subtle)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--surface-hover)'
                      e.currentTarget.style.color = 'var(--text)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = ''
                      e.currentTarget.style.color = ''
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              {AGENTS.map((agentKey) => {
                const cfg = AGENT_CONFIGS[agentKey]
                const count = agentCounts[agentKey] ?? 0
                return (
                  <div
                    key={agentKey}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all"
                    style={{
                      background: count > 0 ? 'var(--surface-active)' : 'var(--surface)',
                      borderColor: count > 0 ? 'var(--accent)' : 'var(--border)',
                      borderLeftColor: count > 0 ? cfg.color : undefined,
                      borderLeftWidth: count > 0 ? '2px' : undefined,
                    }}
                  >
                    <span className="font-mono text-[13px] w-5 text-center shrink-0" style={{ color: cfg.color }}>
                      {cfg.icon}
                    </span>
                    <span
                      className="flex-1 text-[12px]"
                      style={{ color: count > 0 ? 'var(--text)' : 'var(--text-muted)' }}
                    >
                      {cfg.label}
                    </span>

                    {agentKey === 'custom' && count > 0 && (
                      <input
                        value={customCommand}
                        onChange={(e) => setCustomCommand(e.target.value)}
                        placeholder="command..."
                        className="flex-1 px-2 py-0.5 rounded text-[11px] outline-none border"
                        style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
                      />
                    )}

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setCount(agentKey, -1)}
                        disabled={count === 0}
                        className="flex items-center justify-center w-5 h-5 rounded transition-all disabled:opacity-25 hover:bg-[var(--surface-hover)]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Minus size={10} />
                      </button>
                      <span
                        className="w-6 text-center text-[12px] font-mono font-bold tabular"
                        style={{ color: count > 0 ? 'var(--text)' : 'var(--text-subtle)' }}
                      >
                        {count}
                      </span>
                      <button
                        onClick={() => setCount(agentKey, 1)}
                        className="flex items-center justify-center w-5 h-5 rounded transition-all hover:bg-[var(--surface-hover)]"
                        style={{ color: 'var(--text-muted)' }}
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
          </div>

          {/* Launch */}
          <div className="animate-fadeInUp" style={{ animationDelay: '160ms' }}>
            <button
              onClick={handleOpen}
              disabled={!canLaunch}
              className="w-full py-3 rounded-lg font-semibold text-[13px] transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}
              onMouseEnter={(e) => { if (canLaunch) e.currentTarget.style.background = 'var(--accent-bright)' }}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
            >
              <Zap size={14} />
              Launch Workspace
              {totalAgents > 0 && (
                <span
                  className="ml-1 px-2 py-0.5 rounded text-[10px] font-mono tabular"
                  style={{ background: 'rgba(0,0,0,0.22)', color: 'inherit' }}
                >
                  {totalAgents} agent{totalAgents !== 1 ? 's' : ''}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
