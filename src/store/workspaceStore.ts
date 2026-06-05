import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Workspace, Pane, AgentType, WorkspaceLayout } from '../types'
import { generateId } from '../lib/utils'

interface WorkspaceState {
  workspaces: Workspace[]
  activeWorkspaceId: string | null

  createWorkspace: (opts: {
    name: string
    path: string
    agent: AgentType
    count: number
    layout: WorkspaceLayout
  }) => string
  closeWorkspace: (id: string) => void
  setActiveWorkspace: (id: string) => void

  addPane: (workspaceId: string, agent: AgentType, customCommand?: string) => string
  closePane: (workspaceId: string, paneId: string) => void
  setPtyId: (workspaceId: string, paneId: string, ptyId: string) => void
  setPaneStatus: (workspaceId: string, paneId: string, status: Pane['status']) => void
  setActivePane: (workspaceId: string, paneId: string | null) => void
  setActiveTabIndex: (workspaceId: string, index: number) => void
  renamePane: (workspaceId: string, paneId: string, title: string) => void
}

function makePane(workspaceId: string, agent: AgentType, customCommand?: string): Pane {
  return {
    id: generateId(),
    ptyId: null,
    agent,
    customCommand,
    title: agent === 'custom' ? (customCommand ?? 'custom') : agent,
    status: 'connecting',
    workspaceId,
  }
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, _get) => ({
      workspaces: [],
      activeWorkspaceId: null,

      createWorkspace: ({ name, path, agent, count, layout }) => {
        const id = generateId()
        const panes: Pane[] = Array.from({ length: count }, () =>
          makePane(id, agent)
        )
        const ws: Workspace = {
          id,
          name: name || path.split(/[\\/]/).pop() || 'workspace',
          path,
          layout,
          agent,
          panes,
          createdAt: Date.now(),
          activePane: panes[0]?.id ?? null,
          activeTabIndex: 0,
        }
        set((s) => ({
          workspaces: [...s.workspaces, ws],
          activeWorkspaceId: id,
        }))
        return id
      },

      closeWorkspace: (id) =>
        set((s) => {
          const remaining = s.workspaces.filter((w) => w.id !== id)
          const active =
            s.activeWorkspaceId === id
              ? (remaining[remaining.length - 1]?.id ?? null)
              : s.activeWorkspaceId
          return { workspaces: remaining, activeWorkspaceId: active }
        }),

      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

      addPane: (workspaceId, agent, customCommand) => {
        const pane = makePane(workspaceId, agent, customCommand)
        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id === workspaceId
              ? { ...w, panes: [...w.panes, pane], activePane: pane.id }
              : w
          ),
        }))
        return pane.id
      },

      closePane: (workspaceId, paneId) =>
        set((s) => ({
          workspaces: s.workspaces.map((w) => {
            if (w.id !== workspaceId) return w
            const panes = w.panes.filter((p) => p.id !== paneId)
            const activePane =
              w.activePane === paneId
                ? (panes[panes.length - 1]?.id ?? null)
                : w.activePane
            return { ...w, panes, activePane }
          }),
        })),

      setPtyId: (workspaceId, paneId, ptyId) =>
        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id !== workspaceId
              ? w
              : {
                  ...w,
                  panes: w.panes.map((p) =>
                    p.id === paneId ? { ...p, ptyId } : p
                  ),
                }
          ),
        })),

      setPaneStatus: (workspaceId, paneId, status) =>
        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id !== workspaceId
              ? w
              : {
                  ...w,
                  panes: w.panes.map((p) =>
                    p.id === paneId ? { ...p, status } : p
                  ),
                }
          ),
        })),

      setActivePane: (workspaceId, paneId) =>
        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id === workspaceId ? { ...w, activePane: paneId } : w
          ),
        })),

      setActiveTabIndex: (workspaceId, index) =>
        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id === workspaceId ? { ...w, activeTabIndex: index } : w
          ),
        })),

      renamePane: (workspaceId, paneId, title) =>
        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id !== workspaceId
              ? w
              : {
                  ...w,
                  panes: w.panes.map((p) =>
                    p.id === paneId ? { ...p, title } : p
                  ),
                }
          ),
        })),
    }),
    {
      name: 'forge-workspaces',
      partialize: (s) => ({
        workspaces: s.workspaces.map((w) => ({
          ...w,
          panes: w.panes.map((p) => ({ ...p, ptyId: null, status: 'connecting' as const }),
          ),
        })),
        activeWorkspaceId: s.activeWorkspaceId,
      }),
    }
  )
)
