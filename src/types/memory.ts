export interface MemoryNote {
  id: string
  title: string
  content: string       // markdown text
  workspaceId: string
  workspaceName: string
  workspacePath: string
  agents: string[]      // agent types active in that session
  savedAt: number       // unix timestamp ms
  tags: string[]        // user tags, default ['Session']
}
