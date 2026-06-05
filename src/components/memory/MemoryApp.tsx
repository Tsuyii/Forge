import { useState, useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { RefreshCw, X, Plus, Trash2, Save, Brain } from 'lucide-react'
import { useMemoryStore } from '../../store/memoryStore'
import { MemoryGraph } from './MemoryGraph'
import type { MemoryNote } from '../../types/memory'
import { cn } from '../../lib/utils'

type View = 'notes' | 'graph'

function formatDate(ms: number) {
  return new Date(ms).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function groupByWorkspace(notes: MemoryNote[]) {
  const map = new Map<string, MemoryNote[]>()
  for (const note of notes) {
    const key = note.workspaceName || 'Unknown'
    const arr = map.get(key) ?? []
    arr.push(note)
    map.set(key, arr)
  }
  return map
}

export function MemoryApp() {
  const { notes, autoSave, setAutoSave, loadNotes, addNote, updateNote, deleteNote } =
    useMemoryStore()

  const [view, setView] = useState<View>('notes')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [search, setSearch] = useState('')

  // Load on mount
  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  // Auto-select first note
  useEffect(() => {
    if (!selectedId && notes.length > 0) {
      setSelectedId(notes[0].id)
    }
  }, [notes, selectedId])

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null

  // Enter edit mode — populate fields
  function enterEdit() {
    if (!selectedNote) return
    setEditContent(selectedNote.content)
    setEditTitle(selectedNote.title)
    setEditMode(true)
  }

  function saveEdit() {
    if (!selectedId) return
    updateNote(selectedId, { title: editTitle, content: editContent })
    setEditMode(false)
  }

  function cancelEdit() {
    setEditMode(false)
  }

  async function handleRefresh() {
    await loadNotes()
  }

  async function handleClose() {
    const win = getCurrentWindow()
    await win.close()
  }

  function handleSaveSession() {
    // Create a demo note with current timestamp since we can't access workspaceStore
    // (memory window is a separate window)
    const title = `Session — ${new Date().toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })}`
    addNote({
      title,
      content: `# ${title}\n\nManually saved session.\n`,
      workspaceId: 'manual',
      workspaceName: 'Manual',
      workspacePath: '',
      agents: [],
      tags: ['Session'],
    })
  }

  function handleNewNote() {
    addNote({
      title: 'New Note',
      content: '# New Note\n\nStart writing here.\n',
      workspaceId: 'manual',
      workspaceName: 'Manual',
      workspacePath: '',
      agents: [],
      tags: ['Note'],
    })
  }

  function handleDelete(id: string) {
    deleteNote(id)
    if (selectedId === id) {
      const remaining = notes.filter((n) => n.id !== id)
      setSelectedId(remaining[0]?.id ?? null)
    }
  }

  const filteredGroups = (() => {
    const all = search
      ? notes.filter(
          (n) =>
            n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.content.toLowerCase().includes(search.toLowerCase()) ||
            n.workspaceName.toLowerCase().includes(search.toLowerCase())
        )
      : notes
    return groupByWorkspace(all)
  })()

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 shrink-0"
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
        }}
        data-tauri-drag-region
      >
        <Brain size={16} style={{ color: 'var(--cta)' }} />
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
            Memory
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
            Agent vault · what we were working on
          </span>
        </div>

        <div className="flex items-center gap-1 ml-4">
          {(['notes', 'graph'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-3 py-1 rounded text-[11px] capitalize transition-all',
                view === v
                  ? 'bg-[var(--surface-active)] text-[var(--cta)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
              )}
            >
              {v === 'notes' ? 'Notes' : 'Graph'}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Auto-save */}
        <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px]"
          style={{ color: 'var(--text-muted)' }}>
          <input
            type="checkbox"
            checked={autoSave}
            onChange={(e) => setAutoSave(e.target.checked)}
            className="w-3 h-3 accent-[var(--cta)]"
          />
          Auto-save
        </label>

        <button
          onClick={handleSaveSession}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] transition-all"
          style={{
            background: 'var(--surface-active)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-active)')}
          title="Save current session as note"
        >
          <Save size={11} />
          Save session
        </button>

        <button
          onClick={handleRefresh}
          className="flex items-center justify-center w-7 h-7 rounded transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title="Refresh notes from disk"
        >
          <RefreshCw size={13} />
        </button>

        <button
          onClick={handleClose}
          className="flex items-center justify-center w-7 h-7 rounded transition-all"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--status-error)'
            e.currentTarget.style.background = 'rgba(248,113,113,0.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)'
            e.currentTarget.style.background = 'transparent'
          }}
          title="Close memory window"
        >
          <X size={13} />
        </button>
      </div>

      {/* Body */}
      {view === 'graph' ? (
        <div className="flex-1 overflow-hidden">
          <MemoryGraph notes={notes} />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div
            className="flex flex-col shrink-0 overflow-hidden"
            style={{
              width: 256,
              borderRight: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
            }}
          >
            {/* Search + new note */}
            <div className="flex items-center gap-1 px-2 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search memory..."
                className="flex-1 bg-transparent text-[11px] outline-none placeholder-[var(--text-subtle)]"
                style={{ color: 'var(--text)' }}
              />
              <button
                onClick={handleNewNote}
                className="flex items-center justify-center w-6 h-6 rounded transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                title="New note"
              >
                <Plus size={12} />
              </button>
            </div>

            {/* Grouped list */}
            <div className="flex-1 overflow-y-auto">
              {filteredGroups.size === 0 ? (
                <div
                  className="px-4 py-6 text-center text-[11px]"
                  style={{ color: 'var(--text-subtle)' }}
                >
                  No notes yet
                </div>
              ) : (
                Array.from(filteredGroups.entries()).map(([wsName, wsNotes]) => (
                  <div key={wsName}>
                    {/* Workspace group header */}
                    <div
                      className="px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase"
                      style={{ color: 'var(--text-subtle)', background: 'var(--bg-secondary)' }}
                    >
                      {wsName}
                    </div>
                    {wsNotes.map((note) => (
                      <button
                        key={note.id}
                        onClick={() => {
                          setSelectedId(note.id)
                          setEditMode(false)
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 transition-all',
                          selectedId === note.id
                            ? 'bg-[var(--surface-active)]'
                            : 'hover:bg-[var(--surface-hover)]'
                        )}
                      >
                        <div className="flex items-start gap-1">
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-[11px] font-medium truncate"
                              style={{ color: selectedId === note.id ? 'var(--cta)' : 'var(--text)' }}
                            >
                              {note.tags.includes('Session') ? '📋 ' : '📝 '}{note.title}
                            </div>
                            <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                              {formatDate(note.savedAt)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {selectedNote ? (
              <>
                {/* Note header */}
                <div
                  className="flex items-center gap-2 px-4 py-2 shrink-0"
                  style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
                >
                  {editMode ? (
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 bg-transparent text-[13px] font-semibold outline-none"
                      style={{ color: 'var(--text)' }}
                    />
                  ) : (
                    <span className="flex-1 text-[13px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                      {selectedNote.title}
                    </span>
                  )}

                  {/* Mode toggle */}
                  {!editMode ? (
                    <button
                      onClick={enterEdit}
                      className="px-2.5 py-1 rounded text-[11px] transition-all"
                      style={{
                        background: 'var(--surface-active)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-active)')}
                    >
                      Edit
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={saveEdit}
                        className="px-2.5 py-1 rounded text-[11px] transition-all"
                        style={{
                          background: 'var(--cta)',
                          color: 'var(--cta-text)',
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-2.5 py-1 rounded text-[11px] transition-all"
                        style={{
                          background: 'var(--surface-active)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleDelete(selectedNote.id)}
                    className="flex items-center justify-center w-7 h-7 rounded transition-all"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--status-error)'
                      e.currentTarget.style.background = 'rgba(248,113,113,0.08)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)'
                      e.currentTarget.style.background = 'transparent'
                    }}
                    title="Delete note"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Metadata */}
                {!editMode && (
                  <div
                    className="flex flex-wrap items-center gap-3 px-4 py-2 shrink-0 text-[10px]"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      color: 'var(--text-subtle)',
                      background: 'var(--bg-secondary)',
                    }}
                  >
                    <span>
                      <span style={{ color: 'var(--text-muted)' }}>Workspace:</span>{' '}
                      {selectedNote.workspaceName || '—'}
                    </span>
                    {selectedNote.workspacePath && (
                      <span className="truncate max-w-[200px]" title={selectedNote.workspacePath}>
                        <span style={{ color: 'var(--text-muted)' }}>Path:</span>{' '}
                        {selectedNote.workspacePath}
                      </span>
                    )}
                    <span>
                      <span style={{ color: 'var(--text-muted)' }}>Saved:</span>{' '}
                      {formatDate(selectedNote.savedAt)}
                    </span>
                    {selectedNote.agents.length > 0 && (
                      <span>
                        <span style={{ color: 'var(--text-muted)' }}>Agents:</span>{' '}
                        {selectedNote.agents.join(', ')}
                      </span>
                    )}
                    {selectedNote.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        {selectedNote.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded text-[9px]"
                            style={{
                              background: 'var(--surface-active)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  {editMode ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-full p-4 bg-transparent text-[12px] font-mono outline-none resize-none allow-select"
                      style={{ color: 'var(--text)', lineHeight: 1.7 }}
                      spellCheck={false}
                    />
                  ) : (
                    <div
                      className="p-4 text-[12px] allow-select whitespace-pre-wrap"
                      style={{ color: 'var(--text)', lineHeight: 1.7, fontFamily: 'var(--font-mono)' }}
                    >
                      {selectedNote.content || (
                        <span style={{ color: 'var(--text-subtle)' }}>No content</span>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div
                className="flex flex-col items-center justify-center flex-1 gap-3"
                style={{ color: 'var(--text-subtle)' }}
              >
                <Brain size={36} style={{ color: 'var(--border)' }} />
                <p className="text-[12px]">Select a note or save a session</p>
                <button
                  onClick={handleNewNote}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] transition-all mt-2"
                  style={{
                    background: 'var(--surface-active)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-active)')}
                >
                  <Plus size={11} />
                  New note
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
