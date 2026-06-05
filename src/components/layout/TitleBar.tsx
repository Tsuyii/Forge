import type { CSSProperties } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { Minus, Square, X } from 'lucide-react'

export function TitleBar() {
  const win = getCurrentWindow()

  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between h-9 px-3 shrink-0 select-none"
      style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}
    >
      {/* Left: logo + name */}
      <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
        <span className="text-sm" style={{ color: 'var(--accent-bright)' }}>⬡</span>
        <span style={{ color: 'var(--text)' }}>Forge</span>
        <span className="text-[10px] tracking-widest" style={{ color: 'var(--text-subtle)' }}>AGENT DEV ENV</span>
      </div>

      {/* Center: perf metrics */}
      <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: 'var(--text-subtle)' }}>
        <span>CPU –%</span>
        <span>GPU –%</span>
        <span>LAT –ms</span>
      </div>

      {/* Right: window controls */}
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as CSSProperties}>
        <button
          onClick={() => win.minimize()}
          className="flex items-center justify-center w-8 h-7 rounded transition-colors duration-100"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '')}
        >
          <Minus size={12} />
        </button>
        <button
          onClick={() => win.toggleMaximize()}
          className="flex items-center justify-center w-8 h-7 rounded transition-colors duration-100"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '')}
        >
          <Square size={11} />
        </button>
        <button
          onClick={() => win.close()}
          className="flex items-center justify-center w-8 h-7 rounded transition-colors duration-100"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#c0392b'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '' }}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )
}
