import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'
import type { MemoryNote } from '../types/memory'
import { generateId } from '../lib/utils'

interface MemoryState {
  notes: MemoryNote[]
  autoSave: boolean
  addNote: (note: Omit<MemoryNote, 'id' | 'savedAt'>) => void
  updateNote: (id: string, changes: Partial<MemoryNote>) => void
  deleteNote: (id: string) => void
  setAutoSave: (v: boolean) => void
  loadNotes: () => Promise<void>
  saveNotes: () => Promise<void>
}

export const useMemoryStore = create<MemoryState>()((set, get) => ({
  notes: [],
  autoSave: true,

  addNote: (note) => {
    const newNote: MemoryNote = {
      ...note,
      id: generateId(),
      savedAt: Date.now(),
    }
    set((s) => ({ notes: [...s.notes, newNote] }))
    // Use next tick to ensure state has updated before saving
    setTimeout(() => get().saveNotes(), 0)
  },

  updateNote: (id, changes) => {
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, ...changes } : n)),
    }))
    setTimeout(() => get().saveNotes(), 0)
  },

  deleteNote: (id) => {
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }))
    setTimeout(() => get().saveNotes(), 0)
  },

  setAutoSave: (v) => set({ autoSave: v }),

  loadNotes: async () => {
    try {
      const json = await invoke<string>('load_memory', {})
      const notes: MemoryNote[] = JSON.parse(json)
      set({ notes: Array.isArray(notes) ? notes : [] })
    } catch (err) {
      console.error('[MemoryStore] loadNotes failed:', err)
      set({ notes: [] })
    }
  },

  saveNotes: async () => {
    try {
      const json = JSON.stringify(get().notes)
      await invoke('save_memory', { json })
    } catch (err) {
      console.error('[MemoryStore] saveNotes failed:', err)
    }
  },
}))
