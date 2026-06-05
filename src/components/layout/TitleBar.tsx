import type { CSSProperties } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { Minus, Square, X } from 'lucide-react'

const METRICS = [
  { key: 'CPU', value: '–%' },
  { key: 'MEM', value: '–%' },
  { key: 'LAT', value: '–ms' },
]

export function TitleBar() {
  const win = getCurrentWindow()

  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between h-9 px-3 shrink-0 select-none"
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Left: branding */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--surface-active) 0%, var(--surface-hover) 100%)',
            border: '1px solid var(--border)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          <span style={{ color: 'var(--cta)', fontSize: 11, lineHeight: 1 }}>⬡</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="text-[12px] font-bold tracking-tight"
            style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}
          >
            Forge
          </span>
          <span
            className="text-[8px] tracking-[0.16em] uppercase px-1.5 py-0.5 rounded"
            style={{
              color: 'var(--text-subtle)',
              background: 'var(--surface)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            alpha
          </span>
        </div>
      </div>

      {/* Center: perf metrics */}
      <div className="flex items-center gap-1">
        {METRICS.map(({ key, value }) => (
          <div
            key={key}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span className="text-[9px] font-mono tracking-wide" style={{ color: 'var(--text-subtle)' }}>
              {key}
            </span>
            <span className="text-[9px] font-mono tabular" style={{ color: 'var(--text-muted)' }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Right: window controls */}
      <div
        className="flex items-center"
        style={{ WebkitAppRegion: 'no-drag' } as CSSProperties}
      >
        {[
          {
            icon: <Minus size={11} />,
            action: () => win.minimize(),
            hoverStyle: { background: 'var(--surface-hover)' },
          },
          {
            icon: <Square size={10} />,
            action: () => win.toggleMaximize(),
            hoverStyle: { background: 'var(--surface-hover)' },
          },
          {
            icon: <X size={11} />,
            action: () => win.close(),
            hoverStyle: { background: '#c0392b', color: '#fff' },
          },
        ].map(({ icon, action, hoverStyle }, i) => (
          <button
            key={i}
            onClick={action}
            className="flex items-center justify-center w-8 h-7 rounded transition-all duration-100"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = ''
              e.currentTarget.style.color = ''
            }}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  )
}
