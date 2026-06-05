import { useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { X, RefreshCw, GitCommit, GitBranch } from 'lucide-react'
import type { Workspace } from '../../types'
import { cn } from '../../lib/utils'

interface CommandOutput {
  stdout: string
  stderr: string
  exit_code: number
}

type GitTab = 'changes' | 'files' | 'history'

interface GitTabDef {
  id: GitTab
  label: string
}

const GIT_TABS: GitTabDef[] = [
  { id: 'changes', label: 'Changes' },
  { id: 'files', label: 'Files' },
  { id: 'history', label: 'History' },
]

const GIT_COMMANDS: Record<GitTab, string[]> = {
  changes: ['status', '--short'],
  files: ['ls-files'],
  history: ['log', '--oneline', '-20'],
}

function StatusLine({ line }: { line: string }) {
  const code = line.slice(0, 2)
  const rest = line.slice(3)

  let color = 'var(--text)'
  if (code.includes('M')) color = '#f97316' // orange — modified
  else if (code.includes('A')) color = '#22c55e' // green — added
  else if (code.includes('D')) color = '#ef4444' // red — deleted
  else if (code.includes('?')) color = 'var(--text-muted)' // untracked

  return (
    <div className="flex items-start gap-2 py-0.5 font-mono text-[11px]">
      <span className="shrink-0 w-4" style={{ color }}>{code}</span>
      <span className="break-all" style={{ color: 'var(--text)' }}>{rest}</span>
    </div>
  )
}

function HistoryLine({ line }: { line: string }) {
  const spaceIdx = line.indexOf(' ')
  const hash = line.slice(0, spaceIdx)
  const message = line.slice(spaceIdx + 1)
  return (
    <div className="flex items-start gap-2 py-0.5 font-mono text-[11px]">
      <span className="shrink-0" style={{ color: 'var(--cta)' }}>{hash}</span>
      <span className="break-all" style={{ color: 'var(--text)' }}>{message}</span>
    </div>
  )
}

interface GitPanelProps {
  workspace: Workspace
  onClose: () => void
}

export function GitPanel({ workspace, onClose }: GitPanelProps) {
  const [activeTab, setActiveTab] = useState<GitTab>('changes')
  const [outputs, setOutputs] = useState<Partial<Record<GitTab, string>>>({})
  const [errors, setErrors] = useState<Partial<Record<GitTab, string>>>({})
  const [loading, setLoading] = useState(false)
  const [notGit, setNotGit] = useState(false)

  const fetchTab = useCallback(async (tab: GitTab) => {
    setLoading(true)
    setNotGit(false)
    try {
      const result = await invoke<CommandOutput>('run_shell_command', {
        cmd: 'git',
        args: GIT_COMMANDS[tab],
        cwd: workspace.path,
      })
      if (result.exit_code !== 0 && result.stderr.includes('not a git repository')) {
        setNotGit(true)
      } else {
        setOutputs((prev) => ({ ...prev, [tab]: result.stdout || result.stderr }))
        setErrors((prev) => ({ ...prev, [tab]: undefined }))
      }
    } catch (e) {
      setErrors((prev) => ({ ...prev, [tab]: String(e) }))
    } finally {
      setLoading(false)
    }
  }, [workspace.path])

  // Auto-load active tab on first render
  const hasLoaded = outputs[activeTab] !== undefined || errors[activeTab] !== undefined || notGit
  if (!hasLoaded && !loading) {
    fetchTab(activeTab)
  }

  function handleTabChange(tab: GitTab) {
    setActiveTab(tab)
    // Fetch if not yet loaded
    if (outputs[tab] === undefined && errors[tab] === undefined) {
      fetchTab(tab)
    }
  }

  const currentOutput = outputs[activeTab] ?? ''
  const currentError = errors[activeTab]
  const lines = currentOutput.split('\n').filter(Boolean)

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
          <GitBranch size={13} style={{ color: 'var(--cta)' }} />
          <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--text)' }}>
            GIT
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => fetchTab(activeTab)}
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-[var(--surface-hover)] transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title="Refresh"
          >
            <RefreshCw size={11} />
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-[var(--surface-hover)] transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title="Close"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {GIT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'px-3 py-1.5 text-[10px] font-semibold tracking-wider transition-colors',
              activeTab === tab.id ? 'border-b-2' : 'hover:bg-[var(--surface-hover)]'
            )}
            style={{
              color: activeTab === tab.id ? 'var(--cta)' : 'var(--text-muted)',
              borderBottomColor: activeTab === tab.id ? 'var(--cta)' : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading && (
          <p className="text-[11px] text-center py-4" style={{ color: 'var(--text-muted)' }}>
            Loading…
          </p>
        )}

        {!loading && notGit && (
          <div
            className="flex flex-col items-center gap-2 py-8 text-center"
          >
            <GitBranch size={24} style={{ color: 'var(--text-subtle)' }} />
            <p className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>
              Not a git repository
            </p>
          </div>
        )}

        {!loading && !notGit && currentError && (
          <p className="text-[11px] font-mono break-all" style={{ color: 'var(--status-error)' }}>
            {currentError}
          </p>
        )}

        {!loading && !notGit && !currentError && (
          <>
            {lines.length === 0 ? (
              <p className="text-[11px] text-center py-4" style={{ color: 'var(--text-subtle)' }}>
                {activeTab === 'changes' ? 'Working tree clean' : 'No output'}
              </p>
            ) : (
              <div>
                {activeTab === 'changes' && lines.map((line, i) => (
                  <StatusLine key={i} line={line} />
                ))}
                {activeTab === 'history' && lines.map((line, i) => (
                  <div key={i} className="flex items-start gap-2 py-0.5">
                    <GitCommit size={10} className="mt-0.5 shrink-0" style={{ color: 'var(--cta)' }} />
                    <HistoryLine line={line} />
                  </div>
                ))}
                {activeTab === 'files' && lines.map((line, i) => (
                  <div key={i} className="py-0.5 font-mono text-[11px]" style={{ color: 'var(--text)' }}>
                    {line}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
