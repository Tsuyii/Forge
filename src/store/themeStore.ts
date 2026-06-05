import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme } from '../types'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'graphite',
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },
    }),
    { name: 'forge-theme' }
  )
)

export function initTheme() {
  const stored = localStorage.getItem('forge-theme')
  if (stored) {
    try {
      const { state } = JSON.parse(stored)
      if (state?.theme) {
        document.documentElement.setAttribute('data-theme', state.theme)
      }
    } catch {
      document.documentElement.setAttribute('data-theme', 'graphite')
    }
  } else {
    document.documentElement.setAttribute('data-theme', 'graphite')
  }
}
