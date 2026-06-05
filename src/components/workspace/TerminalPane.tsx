import { useEffect, useRef, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import '@xterm/xterm/css/xterm.css'
import type { Pane } from '../../types'
import { AGENT_CONFIGS } from '../../types'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useAccountStore } from '../../store/accountStore'
import type { ProviderType } from '../../types/accounts'
import { PROVIDER_ENV_VARS } from '../../types/accounts'
import { Maximize2, X, Pencil } from 'lucide-react'
import { cn } from '../../lib/utils'

interface TerminalPaneProps {
  pane: Pane
  workspace: { id: string; path: string; name: string }
  isActive: boolean
  onActivate: () => void
  onClose: () => void
  fontSizePx: number
}

const STATUS_LABEL: Record<string, string> = {
  idle:       'idle',
  working:    'working…',
  error:      'error',
  connecting: 'connecting…',
}

export function TerminalPane({ pane, workspace, isActive, onActivate, onClose, fontSizePx }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef      = useRef<Terminal | null>(null)
  const fitRef       = useRef<FitAddon | null>(null)
  const unlistenRef  = useRef<UnlistenFn | null>(null)
  const { setPtyId, setPaneStatus } = useWorkspaceStore()
  const cfg = AGENT_CONFIGS[pane.agent]

  const getThemeColors = useCallback(() => {
    const s = getComputedStyle(document.documentElement)
    return {
      background:          s.getPropertyValue('--bg').trim()           || '#111111',
      foreground:          s.getPropertyValue('--text').trim()         || '#e0e0e0',
      cursor:              s.getPropertyValue('--accent-bright').trim() || '#c0c0c0',
      selectionBackground: 'rgba(255,255,255,0.15)',
      black:         '#1a1a1a',
      red:           '#f87171',
      green:         '#4ade80',
      yellow:        '#fbbf24',
      blue:          '#60a5fa',
      magenta:       '#c084fc',
      cyan:          '#34d399',
      white:         '#e0e0e0',
      brightBlack:   '#555555',
      brightRed:     '#f87171',
      brightGreen:   '#4ade80',
      brightYellow:  '#fbbf24',
      brightBlue:    '#93c5fd',
      brightMagenta: '#d8b4fe',
      brightCyan:    '#6ee7b7',
      brightWhite:   '#f0f0f0',
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      fontSize:         fontSizePx,
      fontFamily:       '"JetBrains Mono", "Fira Code", "Cascadia Code", ui-monospace, monospace',
      cursorBlink:      true,
      cursorStyle:      'block',
      scrollback:       5000,
      theme:            getThemeColors(),
      allowProposedApi: true,
    })

    const fit = new FitAddon()
    term.loadAddon(fit)
    term.loadAddon(new WebLinksAddon())
    term.open(containerRef.current)
    fit.fit()

    termRef.current = term
    fitRef.current  = fit

    async function startPty() {
      try {
        const command = pane.agent === 'custom'
          ? (pane.customCommand || 'powershell')
          : pane.agent === 'shell'
          ? 'powershell'
          : cfg.command

        const dims = term.rows && term.cols
          ? { cols: term.cols, rows: term.rows }
          : { cols: 80, rows: 24 }

        const providerAgents: ProviderType[] = ['claude', 'codex', 'gemini', 'agy']
        let envVars: Record<string, string> | null = null
        if (providerAgents.includes(pane.agent as ProviderType)) {
          const account = useAccountStore.getState().getActiveAccount(pane.agent as ProviderType)
          if (account?.apiKey) {
            envVars = { [PROVIDER_ENV_VARS[pane.agent as ProviderType]]: account.apiKey }
          }
        }

        const ptyId: string = await invoke('create_pty', {
          command,
          cwd:     workspace.path,
          cols:    dims.cols,
          rows:    dims.rows,
          envVars,
        })

        setPtyId(workspace.id, pane.id, ptyId)
        setPaneStatus(workspace.id, pane.id, 'idle')

        unlistenRef.current = await listen<string>(`pty-data-${ptyId}`, (event) => {
          term.write(event.payload)
          setPaneStatus(workspace.id, pane.id, 'working')
        })

        await listen<void>(`pty-exit-${ptyId}`, () => {
          term.write('\r\n\x1b[90m[process exited]\x1b[0m\r\n')
          setPaneStatus(workspace.id, pane.id, 'idle')
        })

        term.onData((data) => {
          invoke('write_pty', { ptyId, data }).catch(() => {})
        })

        term.onResize(({ cols, rows }) => {
          invoke('resize_pty', { ptyId, cols, rows }).catch(() => {})
        })
      } catch (err) {
        term.write(`\r\n\x1b[31m[Failed to start: ${err}]\x1b[0m\r\n`)
        setPaneStatus(workspace.id, pane.id, 'error')
      }
    }

    startPty()

    const ro = new ResizeObserver(() => fit.fit())
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      unlistenRef.current?.()
      if (pane.ptyId) invoke('close_pty', { ptyId: pane.ptyId }).catch(() => {})
      term.dispose()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.fontSize = fontSizePx
      fitRef.current?.fit()
    }
  }, [fontSizePx])

  const statusColor =
    pane.status === 'working'    ? 'var(--status-working)' :
    pane.status === 'error'      ? 'var(--status-error)'   :
    pane.status === 'connecting' ? 'var(--text-subtle)'    :
                                   'var(--status-idle)'

  const isWorking = pane.status === 'working'
  const isError = pane.status === 'error'

  const providerAgents: ProviderType[] = ['claude', 'codex', 'gemini', 'agy']
  const activeAccountLabel = useAccountStore((s) => {
    const p = s.providers[pane.agent as ProviderType]
    if (!p) return null
    return p.accounts.find((a) => a.id === p.activeAccountId)?.label ?? null
  })
  const activeAccountName = providerAgents.includes(pane.agent as ProviderType) ? activeAccountLabel : null

  return (
    <div
      onClick={onActivate}
      className="flex flex-col h-full rounded-lg overflow-hidden transition-all"
      style={{
        background:  'var(--bg-secondary)',
        border:      `1px solid ${isActive ? cfg.color : 'var(--border)'}`,
        borderLeft:  isActive ? `2px solid ${cfg.color}` : undefined,
        boxShadow:   isActive ? `0 2px 12px rgba(0,0,0,0.3)` : undefined,
        opacity:     isError ? 0.85 : 1,
      }}
    >
      {/* Pane header */}
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 shrink-0"
        style={{
          background:   isActive ? 'var(--surface-active)' : 'var(--surface)',
          borderBottom: `1px solid var(--border)`,
        }}
      >
        {/* Agent icon + status dot */}
        <div className="relative flex items-center shrink-0">
          <span className="font-mono text-[12px]" style={{ color: cfg.color }}>
            {cfg.icon}
          </span>
          <span
            className={cn('absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full', isWorking && 'animate-pulse-dot')}
            style={{ background: statusColor, border: '1px solid var(--surface)' }}
            aria-hidden="true"
          />
        </div>

        {/* Title */}
        <span className="flex-1 truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {pane.title}
          <span style={{ color: 'var(--text-subtle)' }}> — {workspace.name}</span>
        </span>

        {/* Controls */}
        <button
          className="flex items-center justify-center w-6 h-6 rounded transition-all hover:bg-[var(--surface-hover)]"
          style={{ color: 'var(--text-subtle)' }}
          title="Rename"
          aria-label="Rename pane"
        >
          <Pencil size={10} />
        </button>
        <button
          className="flex items-center justify-center w-6 h-6 rounded transition-all hover:bg-[var(--surface-hover)]"
          style={{ color: 'var(--text-subtle)' }}
          title="Expand"
          aria-label="Expand pane"
        >
          <Maximize2 size={10} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="flex items-center justify-center w-6 h-6 rounded transition-all"
          style={{ color: 'var(--text-subtle)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--status-error)'
            e.currentTarget.style.background = 'rgba(248,113,113,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = ''
            e.currentTarget.style.background = ''
          }}
          title="Close pane"
          aria-label="Close pane"
        >
          <X size={10} />
        </button>
      </div>

      {/* Terminal viewport */}
      <div ref={containerRef} className="flex-1 overflow-hidden allow-select" style={{ padding: '4px 0' }} />

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-3 py-1 shrink-0 text-[10px] font-mono"
        style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={cn('w-1.5 h-1.5 rounded-full', isWorking && 'animate-pulse-dot')}
              style={{ background: statusColor }}
            />
            <span style={{ color: isActive ? 'var(--text-muted)' : 'var(--text-subtle)' }}>
              {cfg.label}
            </span>
          </div>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="truncate max-w-[100px]" style={{ color: 'var(--text-subtle)' }}>
            {activeAccountName ?? workspace.path.split(/[\\/]/).pop()}
          </span>
        </div>
        <span
          className="px-1.5 py-0.5 rounded"
          style={{
            color:       isError ? 'var(--status-error)' : isWorking ? 'var(--status-working)' : 'var(--text-subtle)',
            background:  isError ? 'rgba(248,113,113,0.1)' : isWorking ? 'rgba(251,146,60,0.1)' : 'transparent',
          }}
        >
          {STATUS_LABEL[pane.status] ?? pane.status}
        </span>
      </div>
    </div>
  )
}
