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

export function TerminalPane({ pane, workspace, isActive, onActivate, onClose, fontSizePx }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const unlistenRef = useRef<UnlistenFn | null>(null)
  const { setPtyId, setPaneStatus } = useWorkspaceStore()

  const cfg = AGENT_CONFIGS[pane.agent]

  const getThemeColors = useCallback(() => {
    const s = getComputedStyle(document.documentElement)
    return {
      background: s.getPropertyValue('--bg').trim() || '#111111',
      foreground: s.getPropertyValue('--text').trim() || '#e0e0e0',
      cursor: s.getPropertyValue('--accent-bright').trim() || '#c0c0c0',
      selectionBackground: 'rgba(255,255,255,0.15)',
      black: '#1a1a1a',
      red: '#f87171',
      green: '#4ade80',
      yellow: '#fbbf24',
      blue: '#60a5fa',
      magenta: '#c084fc',
      cyan: '#34d399',
      white: '#e0e0e0',
      brightBlack: '#555555',
      brightRed: '#f87171',
      brightGreen: '#4ade80',
      brightYellow: '#fbbf24',
      brightBlue: '#93c5fd',
      brightMagenta: '#d8b4fe',
      brightCyan: '#6ee7b7',
      brightWhite: '#f0f0f0',
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      fontSize: fontSizePx,
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", ui-monospace, monospace',
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 5000,
      theme: getThemeColors(),
      allowProposedApi: true,
    })

    const fit = new FitAddon()
    term.loadAddon(fit)
    term.loadAddon(new WebLinksAddon())
    term.open(containerRef.current)
    fit.fit()

    termRef.current = term
    fitRef.current = fit

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

        const ptyId: string = await invoke('create_pty', {
          command,
          cwd: workspace.path,
          cols: dims.cols,
          rows: dims.rows,
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

  // Sync font size changes
  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.fontSize = fontSizePx
      fitRef.current?.fit()
    }
  }, [fontSizePx])

  const statusColor =
    pane.status === 'working'
      ? 'var(--status-working)'
      : pane.status === 'error'
      ? 'var(--status-error)'
      : pane.status === 'connecting'
      ? 'var(--text-subtle)'
      : 'var(--status-idle)'

  return (
    <div
      onClick={onActivate}
      className={cn(
        'flex flex-col h-full rounded overflow-hidden transition-shadow',
        isActive ? 'ring-1 ring-[var(--accent)]' : ''
      )}
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
    >
      {/* Pane tab bar */}
      <div
        className="flex items-center gap-1.5 px-2 py-1 shrink-0"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-[11px] font-mono shrink-0" style={{ color: cfg.color }}>
          {cfg.icon}
        </span>
        <span className="flex-1 truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {pane.title} | {workspace.name}
        </span>

        <button
          className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-5 h-5 rounded transition-all hover:bg-[var(--surface-hover)]"
          style={{ color: 'var(--text-subtle)' }}
          title="Rename"
        >
          <Pencil size={9} />
        </button>
        <button
          className="flex items-center justify-center w-5 h-5 rounded transition-all hover:bg-[var(--surface-hover)]"
          style={{ color: 'var(--text-subtle)' }}
          title="Expand"
        >
          <Maximize2 size={9} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="flex items-center justify-center w-5 h-5 rounded transition-all hover:bg-[var(--surface-hover)]"
          style={{ color: 'var(--text-subtle)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--status-error)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          title="Close"
        >
          <X size={9} />
        </button>
      </div>

      {/* Terminal viewport */}
      <div ref={containerRef} className="flex-1 overflow-hidden allow-select" style={{ padding: '4px 0' }} />

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-3 py-0.5 shrink-0 text-[10px] font-mono"
        style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: statusColor }}
          />
          <span style={{ color: 'var(--text-muted)' }}>{cfg.label}</span>
        </div>
        <span style={{ color: 'var(--text-subtle)' }}>
          {pane.status === 'connecting' ? 'connecting…' : pane.status}
        </span>
      </div>
    </div>
  )
}
