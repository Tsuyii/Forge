import { useState, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { X, Plus, ExternalLink, ArrowRight, Globe } from 'lucide-react'
import type { Workspace } from '../../types'
import { cn } from '../../lib/utils'

interface BrowserTab {
  id: string
  url: string
  title: string
}

const MAX_TABS = 5

function generateId(): string {
  return Math.random().toString(36).slice(2, 9)
}

function makeTab(url: string): BrowserTab {
  return { id: generateId(), url, title: urlToTitle(url) }
}

function urlToTitle(url: string): string {
  try {
    return new URL(url).hostname || url
  } catch {
    return url || 'New Tab'
  }
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^localhost/i.test(trimmed) || trimmed.startsWith('127.')) return `http://${trimmed}`
  return `https://${trimmed}`
}

interface BrowserPanelProps {
  workspace: Workspace
  onClose: () => void
}

export function BrowserPanel({ workspace: _workspace, onClose }: BrowserPanelProps) {
  const [tabs, setTabs] = useState<BrowserTab[]>([makeTab('https://localhost:3000')])
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0].id)
  const [urlInput, setUrlInput] = useState('https://localhost:3000')
  const [iframeError, setIframeError] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]

  function navigate(rawUrl: string) {
    const url = normalizeUrl(rawUrl)
    if (!url) return
    setIframeError(false)
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, url, title: urlToTitle(url) } : t
      )
    )
    setUrlInput(url)
  }

  function addTab() {
    if (tabs.length >= MAX_TABS) return
    const tab = makeTab('')
    setTabs((prev) => [...prev, tab])
    setActiveTabId(tab.id)
    setUrlInput('')
    setIframeError(false)
  }

  function closeTab(id: string) {
    if (tabs.length === 1) {
      onClose()
      return
    }
    const idx = tabs.findIndex((t) => t.id === id)
    const remaining = tabs.filter((t) => t.id !== id)
    setTabs(remaining)
    if (activeTabId === id) {
      const newActive = remaining[Math.max(0, idx - 1)]
      setActiveTabId(newActive.id)
      setUrlInput(newActive.url)
    }
    setIframeError(false)
  }

  function handleSwitchTab(tab: BrowserTab) {
    setActiveTabId(tab.id)
    setUrlInput(tab.url)
    setIframeError(false)
  }

  async function openExternal() {
    if (!activeTab.url) return
    try {
      await invoke('open_url', { url: activeTab.url })
    } catch {
      // Fallback: try window.open
      window.open(activeTab.url, '_blank')
    }
  }

  function handleIframeError() {
    setIframeError(true)
  }

  return (
    <div
      className="flex flex-col w-96 shrink-0 h-full overflow-hidden"
      style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
    >
      {/* Tab bar */}
      <div
        className="flex items-center shrink-0 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--border)', height: 36, minHeight: 36 }}
      >
        <div className="flex items-center flex-1 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 text-[10px] cursor-pointer shrink-0 max-w-[120px] group transition-colors',
                tab.id === activeTabId ? '' : 'hover:bg-[var(--surface-hover)]'
              )}
              style={{
                background: tab.id === activeTabId ? 'var(--surface-active)' : 'transparent',
                color: tab.id === activeTabId ? 'var(--text)' : 'var(--text-muted)',
                borderRight: '1px solid var(--border)',
              }}
              onClick={() => handleSwitchTab(tab)}
            >
              <Globe size={9} className="shrink-0" />
              <span className="truncate">{tab.title || 'New Tab'}</span>
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                className="flex items-center justify-center w-3.5 h-3.5 rounded transition-colors opacity-0 group-hover:opacity-100 hover:bg-[var(--surface-hover)] shrink-0"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={8} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-0.5 px-1 shrink-0">
          {tabs.length < MAX_TABS && (
            <button
              onClick={addTab}
              className="flex items-center justify-center w-6 h-6 rounded hover:bg-[var(--surface-hover)] transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="New tab"
            >
              <Plus size={11} />
            </button>
          )}
          <button
            onClick={onClose}
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-[var(--surface-hover)] transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title="Close browser panel"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* URL bar */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <input
          type="text"
          className="flex-1 px-2 py-1 rounded text-[11px] outline-none font-mono"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') navigate(urlInput)
          }}
          placeholder="https://localhost:3000"
        />
        <button
          onClick={() => navigate(urlInput)}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--surface-hover)] transition-colors"
          style={{ color: 'var(--cta)' }}
          title="Go"
        >
          <ArrowRight size={13} />
        </button>
        <button
          onClick={openExternal}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--surface-hover)] transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title="Open in external browser"
        >
          <ExternalLink size={12} />
        </button>
      </div>

      {/* Webview area */}
      <div className="flex-1 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
        {!activeTab.url ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Globe size={32} style={{ color: 'var(--text-subtle)' }} />
            <p className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>
              Enter a URL to browse
            </p>
          </div>
        ) : iframeError ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-4 text-center">
            <Globe size={28} style={{ color: 'var(--text-subtle)' }} />
            <p className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>
              Unable to load in panel
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              This page may block embedding (X-Frame-Options or CSP).
            </p>
            <button
              onClick={openExternal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium transition-colors mt-1"
              style={{
                background: 'var(--surface-active)',
                border: '1px solid var(--border)',
                color: 'var(--cta)',
              }}
            >
              <ExternalLink size={12} />
              Open in external browser
            </button>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            key={activeTab.id + activeTab.url}
            src={activeTab.url}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onError={handleIframeError}
            title={`Browser: ${activeTab.title}`}
          />
        )}
      </div>
    </div>
  )
}
