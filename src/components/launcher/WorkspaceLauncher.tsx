import { useState } from 'react'
import { FolderOpen, Grid, Layers, Minus, Plus, Zap, ChevronRight, Clock, Terminal, Cpu, GitBranch } from 'lucide-react'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { useWorkspaceStore } from '../../store/workspaceStore'
import type { AgentType, WorkspaceLayout } from '../../types'
import { AGENT_CONFIGS } from '../../types'
import { cn } from '../../lib/utils'

const AGENTS: AgentType[] = ['claude', 'codex', 'gemini', 'agy', 'custom', 'shell']

const LAYOUTS = [
  { key: 'grid'   as WorkspaceLayout, icon: Grid,   title: 'Grid',   desc: 'Tabbed pane grid', disabled: false },
  { key: 'canvas' as WorkspaceLayout, icon: Layers, title: 'Canvas', desc: 'Coming in v2',      disabled: true  },
]

const HERO_AGENTS: AgentType[] = ['claude', 'codex', 'gemini', 'agy']

const FEATURES = [
  { icon: Terminal, label: 'PTY-backed terminals',  desc: 'Real shell, native speed'     },
  { icon: Cpu,      label: 'Parallel agent grid',   desc: 'Run agents side-by-side'     },
  { icon: GitBranch,label: 'Workspace isolation',   desc: 'Separate context per project' },
]

export function WorkspaceLauncher() {
  const { createWorkspace, workspaces } = useWorkspaceStore()

  const [path, setPath]                   = useState('')
  const [name, setName]                   = useState('')
  const [layout, setLayout]               = useState<WorkspaceLayout>('grid')
  const [agentCounts, setAgentCounts]     = useState<Partial<Record<AgentType, number>>>({ claude: 1 })
  const [customCommand, setCustomCommand] = useState('')

  const totalAgents = Object.values(agentCounts).reduce((a, b) => a + (b ?? 0), 0)
  const recentPaths = [...new Set(workspaces.map((w) => w.path))].slice(0, 4)
  const canLaunch   = !!path && totalAgents > 0

  async function browse() {
    const selected = await openDialog({ directory: true, multiple: false })
    if (typeof selected === 'string') setPath(selected)
  }

  function setCount(agent: AgentType, delta: number) {
    setAgentCounts((prev) => {
      const cur  = prev[agent] ?? 0
      const next = Math.max(0, cur + delta)
      if (next === 0) { const { [agent]: _, ...rest } = prev; return rest }
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

      {/* ══════════════════════════════════════════════════════
          LEFT — Hero / Brand Panel
          ══════════════════════════════════════════════════════ */}
      <div className="forge-hero-panel">
        {/* Dot grid texture */}
        <div className="absolute inset-0 forge-dot-grid pointer-events-none" style={{ opacity: 0.035 }} />

        {/* Atmospheric glows */}
        <div
          className="absolute -top-28 -right-28 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--cta) 14%, transparent) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--cta) 6%, transparent) 0%, transparent 70%)' }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col flex-1 px-8 pt-9 pb-7">

          {/* ── Logo + brand ── */}
          <div className="mb-9 animate-fadeInUp" style={{ animationDelay: '0ms' }}>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 animate-glow-pulse"
              style={{
                background: 'linear-gradient(135deg, color-mix(in srgb, var(--cta) 18%, transparent) 0%, color-mix(in srgb, var(--cta) 5%, transparent) 100%)',
                border: '1px solid color-mix(in srgb, var(--cta) 28%, transparent)',
              }}
            >
              <span style={{ color: 'var(--cta)', fontSize: 22, lineHeight: 1 }}>⬡</span>
            </div>

            <div
              className="font-bold leading-none mb-2"
              style={{ color: 'var(--text)', fontSize: 40, letterSpacing: '-0.05em' }}
            >
              Forge
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)', maxWidth: '190px' }}>
              Multi-agent development<br />environment
            </p>
          </div>

          {/* ── Supported agents ── */}
          <div className="mb-7 animate-fadeInUp" style={{ animationDelay: '60ms' }}>
            <div className="text-[9px] font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--text-subtle)' }}>
              Agents
            </div>
            <div className="space-y-2">
              {HERO_AGENTS.map((key) => {
                const cfg = AGENT_CONFIGS[key]
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-mono text-[12px] shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${cfg.color} 12%, transparent)`,
                        border:     `1px solid color-mix(in srgb, ${cfg.color} 22%, transparent)`,
                        color:      cfg.color,
                      }}
                    >
                      {cfg.icon}
                    </div>
                    <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Features ── */}
          <div className="mb-7 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
            <div className="text-[9px] font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--text-subtle)' }}>
              Capabilities
            </div>
            <div className="space-y-3">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <Icon size={11} style={{ color: 'var(--text-subtle)' }} />
                  </div>
                  <div>
                    <div className="text-[11px] font-medium leading-tight" style={{ color: 'var(--text-muted)' }}>{label}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-subtle)' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1" />

          {/* ── Version ── */}
          <div className="animate-fadeInUp" style={{ animationDelay: '140ms' }}>
            <div className="flex items-center gap-2.5">
              <span
                className="text-[10px] px-2 py-1 rounded-md font-mono"
                style={{ color: 'var(--text-subtle)', background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                v0.1 alpha
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--status-idle)' }}
              />
              <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>Phase 1</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT — Configuration Form
          ══════════════════════════════════════════════════════ */}
      <div className="flex flex-1 h-full overflow-y-auto">
        <div className="w-full max-w-[480px] mx-auto px-10 py-10">

          {/* ── Section header ── */}
          <div className="mb-7 animate-fadeInUp" style={{ animationDelay: '0ms' }}>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--cta)' }}
              />
              <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: 'var(--cta)' }}>
                New Workspace
              </span>
            </div>
            <h2
              className="font-bold leading-tight"
              style={{ color: 'var(--text)', fontSize: 22, letterSpacing: '-0.03em' }}
            >
              Configure your environment
            </h2>
            <p className="text-[12px] mt-1.5" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Pick a directory, choose your agents, and launch.
            </p>
          </div>

          {/* ── Recent paths ── */}
          {recentPaths.length > 0 && (
            <div className="mb-6 animate-fadeInUp" style={{ animationDelay: '20ms' }}>
              <div className="text-[9px] font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--text-subtle)' }}>
                Recent
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentPaths.map((p) => {
                  const folderName = p.split(/[\\/]/).pop() ?? p
                  return (
                    <button
                      key={p}
                      onClick={() => setPath(p)}
                      className="forge-pill"
                      data-active={path === p}
                    >
                      <Clock size={10} />
                      <span className="font-mono">{folderName}</span>
                      <ChevronRight size={9} style={{ opacity: 0.5 }} />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Layout picker ── */}
          <div className="mb-6 animate-fadeInUp" style={{ animationDelay: '40ms' }}>
            <label
              className="block text-[9px] font-semibold tracking-widest uppercase mb-2.5"
              style={{ color: 'var(--text-subtle)' }}
            >
              Layout
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LAYOUTS.map(({ key, icon: Icon, title, desc, disabled }) => {
                const active = layout === key && !disabled
                return (
                  <button
                    key={key}
                    onClick={() => !disabled && setLayout(key)}
                    disabled={disabled}
                    className={cn('forge-card flex items-center gap-3 p-3.5 rounded-xl text-left', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
                    data-active={active}
                    style={{ opacity: disabled ? 0.35 : 1 }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: active ? 'color-mix(in srgb, var(--cta) 15%, transparent)' : 'var(--bg-secondary)',
                        border: `1px solid ${active ? 'color-mix(in srgb, var(--cta) 30%, transparent)' : 'var(--border)'}`,
                      }}
                    >
                      <Icon size={13} style={{ color: active ? 'var(--cta)' : 'var(--text-muted)' }} />
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold" style={{ color: active ? 'var(--text)' : 'var(--text-muted)' }}>{title}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>{desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Directory ── */}
          <div className="mb-5 animate-fadeInUp" style={{ animationDelay: '60ms' }}>
            <label
              className="block text-[9px] font-semibold tracking-widest uppercase mb-2"
              style={{ color: 'var(--text-subtle)' }}
            >
              Directory
            </label>
            <div className="flex gap-2">
              <input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="C:\Users\you\project"
                className="forge-input flex-1"
                data-filled={!!path || undefined}
              />
              <button onClick={browse} className="forge-btn-secondary">
                <FolderOpen size={13} />
                Browse
              </button>
            </div>
          </div>

          {/* ── Name ── */}
          <div className="mb-6 animate-fadeInUp" style={{ animationDelay: '80ms' }}>
            <div className="flex items-baseline gap-2 mb-2">
              <label className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text-subtle)' }}>
                Name
              </label>
              <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>optional</span>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-project"
              className="forge-input w-full"
            />
          </div>

          {/* ── Agents ── */}
          <div className="mb-7 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text-subtle)' }}>
                Agents
              </label>
              <div className="flex gap-1">
                {(['1 each', 'Fill', 'Clear'] as const).map((label) => (
                  <button
                    key={label}
                    onClick={() => {
                      if (label === 'Clear')       setAgentCounts({})
                      else if (label === '1 each') setAgentCounts(Object.fromEntries(AGENTS.map((a) => [a, 1])))
                      else                         setAgentCounts({ claude: 4 })
                    }}
                    className="forge-btn-ghost text-[9px] px-2.5 py-1 font-mono uppercase tracking-wide"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              {AGENTS.map((agentKey) => {
                const cfg        = AGENT_CONFIGS[agentKey]
                const count      = agentCounts[agentKey] ?? 0
                const isSelected = count > 0
                return (
                  <div
                    key={agentKey}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all"
                    style={{
                      background:  isSelected ? `color-mix(in srgb, ${cfg.color} 7%, transparent)` : 'var(--surface)',
                      border:      `1px solid ${isSelected ? `color-mix(in srgb, ${cfg.color} 28%, transparent)` : 'var(--border)'}`,
                      borderLeft:  isSelected ? `2px solid color-mix(in srgb, ${cfg.color} 70%, transparent)` : '2px solid transparent',
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-mono text-[12px]"
                      style={{
                        background: isSelected ? `color-mix(in srgb, ${cfg.color} 15%, transparent)` : 'var(--bg-secondary)',
                        color:      isSelected ? cfg.color : 'var(--text-subtle)',
                        border:     `1px solid ${isSelected ? `color-mix(in srgb, ${cfg.color} 28%, transparent)` : 'var(--border)'}`,
                      }}
                    >
                      {cfg.icon}
                    </div>

                    <span
                      className="flex-1 text-[12px] font-medium"
                      style={{ color: isSelected ? 'var(--text)' : 'var(--text-muted)' }}
                    >
                      {cfg.label}
                    </span>

                    {agentKey === 'custom' && isSelected && (
                      <input
                        value={customCommand}
                        onChange={(e) => setCustomCommand(e.target.value)}
                        placeholder="command..."
                        className="forge-input"
                        style={{ width: 120, padding: '4px 10px', fontSize: 11 }}
                      />
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setCount(agentKey, -1)}
                        disabled={count === 0}
                        className="forge-counter-btn"
                      >
                        <Minus size={10} />
                      </button>
                      <span
                        className="w-5 text-center text-[12px] font-mono font-bold tabular"
                        style={{ color: isSelected ? 'var(--text)' : 'var(--text-subtle)' }}
                      >
                        {count}
                      </span>
                      <button
                        onClick={() => setCount(agentKey, 1)}
                        className={cn('forge-counter-btn', isSelected && 'forge-counter-btn--active')}
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Launch CTA ── */}
          <div className="animate-fadeInUp" style={{ animationDelay: '140ms' }}>
            <button
              onClick={handleOpen}
              disabled={!canLaunch}
              className={cn(
                'w-full py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2',
                canLaunch ? 'forge-btn-cta' : 'forge-btn-disabled',
              )}
            >
              <Zap size={15} />
              Launch Workspace
              {totalAgents > 0 && (
                <span
                  className="ml-1 px-2 py-0.5 rounded-lg text-[10px] font-mono tabular"
                  style={{ background: 'rgba(0,0,0,0.2)', color: 'inherit' }}
                >
                  {totalAgents} agent{totalAgents !== 1 ? 's' : ''}
                </span>
              )}
            </button>

            {!canLaunch && (
              <p className="text-center text-[11px] mt-2.5" style={{ color: 'var(--text-subtle)' }}>
                {!path ? 'Select a directory to continue' : 'Add at least one agent to continue'}
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
