import { useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { X, ChevronRight, ChevronDown, FileText, Folder, FolderOpen, Save, RefreshCw } from 'lucide-react'
import type { Workspace } from '../../types'
import { cn } from '../../lib/utils'

interface DirEntry {
  name: string
  path: string
  is_dir: boolean
  children?: DirEntry[]
}

interface FilesTabType {
  id: 'files' | 'workspace'
  label: string
}

const TABS: FilesTabType[] = [
  { id: 'files', label: 'FILES' },
  { id: 'workspace', label: 'WORKSPACE' },
]

interface FileNodeProps {
  entry: DirEntry
  depth: number
  selectedPath: string | null
  expandedPaths: Set<string>
  filter: string
  onSelect: (entry: DirEntry) => void
  onToggleExpand: (path: string) => void
}

function matchesFilter(entry: DirEntry, filter: string): boolean {
  if (!filter) return true
  const lower = filter.toLowerCase()
  if (entry.name.toLowerCase().includes(lower)) return true
  if (entry.is_dir && entry.children) {
    return entry.children.some((c) => matchesFilter(c, filter))
  }
  return false
}

function FileNode({ entry, depth, selectedPath, expandedPaths, filter, onSelect, onToggleExpand }: FileNodeProps) {
  if (!matchesFilter(entry, filter)) return null

  const isExpanded = expandedPaths.has(entry.path)
  const isSelected = selectedPath === entry.path
  const paddingLeft = 8 + depth * 14

  return (
    <div>
      <button
        className={cn(
          'flex items-center gap-1.5 w-full text-left py-0.5 pr-2 rounded text-[11px] transition-colors',
          isSelected
            ? 'bg-[var(--surface-active)]'
            : 'hover:bg-[var(--surface-hover)]'
        )}
        style={{ paddingLeft, color: isSelected ? 'var(--cta)' : 'var(--text)' }}
        onClick={() => {
          if (entry.is_dir) {
            onToggleExpand(entry.path)
          } else {
            onSelect(entry)
          }
        }}
      >
        {entry.is_dir ? (
          <>
            <span style={{ color: 'var(--text-muted)' }}>
              {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            </span>
            {isExpanded
              ? <FolderOpen size={12} style={{ color: 'var(--cta)', flexShrink: 0 }} />
              : <Folder size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            }
          </>
        ) : (
          <>
            <span className="w-[10px]" />
            <FileText size={11} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
          </>
        )}
        <span className="truncate">{entry.name}</span>
      </button>

      {entry.is_dir && isExpanded && entry.children && (
        <div>
          {entry.children.map((child) => (
            <FileNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              expandedPaths={expandedPaths}
              filter={filter}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
            />
          ))}
          {entry.children.length === 0 && (
            <div
              className="text-[10px] py-0.5"
              style={{ paddingLeft: paddingLeft + 22, color: 'var(--text-subtle)' }}
            >
              empty
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface FilesPanelProps {
  workspace: Workspace
  onClose: () => void
}

export function FilesPanel({ workspace, onClose }: FilesPanelProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'workspace'>('files')
  const [entries, setEntries] = useState<DirEntry[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const loadDir = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await invoke<DirEntry[]>('read_dir', { path: workspace.path })
      setEntries(result)
      setLoaded(true)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [workspace.path])

  // Auto-load on first render
  if (!loaded && !loading && !error) {
    loadDir()
  }

  async function handleSelect(entry: DirEntry) {
    setSelectedPath(entry.path)
    setFileContent('')
    try {
      const content = await invoke<string>('read_file_content', { path: entry.path })
      setFileContent(content)
    } catch (e) {
      setFileContent(`// Error reading file: ${e}`)
    }
  }

  function toggleExpand(path: string) {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  async function handleSave() {
    if (!selectedPath) return
    setSaving(true)
    try {
      await invoke('write_file_content', { path: selectedPath, content: fileContent })
      setSaveMsg('Saved')
      setTimeout(() => setSaveMsg(null), 2000)
    } catch (e) {
      setSaveMsg(`Error: ${e}`)
      setTimeout(() => setSaveMsg(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const selectedEntry = selectedPath
    ? findEntry(entries, selectedPath)
    : null

  return (
    <div
      className="flex flex-col w-80 shrink-0 h-full overflow-hidden"
      style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ borderBottom: '1px solid var(--border)', height: 36 }}
      >
        <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--text)' }}>
          FILE PREVIEW
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={loadDir}
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
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-1.5 text-[10px] font-semibold tracking-wider transition-colors',
              activeTab === tab.id
                ? 'border-b-2'
                : 'hover:bg-[var(--surface-hover)]'
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

      {activeTab === 'workspace' ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>Coming soon</p>
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Filter input */}
          <div className="px-2 py-2 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <input
              type="text"
              placeholder="Filter files..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-2 py-1 rounded text-[11px] outline-none"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>

          {/* File tree */}
          <div className="flex-1 overflow-y-auto p-1" style={{ minHeight: 0, maxHeight: '50%' }}>
            {loading && (
              <p className="text-[11px] text-center py-4" style={{ color: 'var(--text-muted)' }}>
                Loading…
              </p>
            )}
            {error && (
              <p className="text-[11px] text-center py-4" style={{ color: 'var(--status-error)' }}>
                {error}
              </p>
            )}
            {!loading && !error && entries.map((entry) => (
              <FileNode
                key={entry.path}
                entry={entry}
                depth={0}
                selectedPath={selectedPath}
                expandedPaths={expandedPaths}
                filter={filter}
                onSelect={handleSelect}
                onToggleExpand={toggleExpand}
              />
            ))}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)' }} />

          {/* File editor */}
          <div className="flex flex-col flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            {selectedEntry ? (
              <>
                <div
                  className="flex items-center justify-between px-2 py-1 shrink-0 text-[10px]"
                  style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  <span className="truncate font-mono">{selectedEntry.name}</span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {saveMsg && (
                      <span style={{ color: saveMsg.startsWith('Error') ? 'var(--status-error)' : 'var(--status-idle)' }}>
                        {saveMsg}
                      </span>
                    )}
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors hover:bg-[var(--surface-hover)]"
                      style={{ color: 'var(--cta)', border: '1px solid var(--border)' }}
                    >
                      <Save size={10} />
                      Save
                    </button>
                  </div>
                </div>
                <textarea
                  className="flex-1 w-full font-mono text-[11px] p-2 resize-none outline-none"
                  style={{
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    minHeight: 0,
                  }}
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  spellCheck={false}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>
                  Select a file from the workspace.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function findEntry(entries: DirEntry[], path: string): DirEntry | null {
  for (const entry of entries) {
    if (entry.path === path) return entry
    if (entry.children) {
      const found = findEntry(entry.children, path)
      if (found) return found
    }
  }
  return null
}
