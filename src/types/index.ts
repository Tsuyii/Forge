export type AgentType = 'claude' | 'codex' | 'gemini' | 'agy' | 'custom' | 'shell'

export type WorkspaceLayout = 'grid' | 'canvas'

export type PaneStatus = 'idle' | 'working' | 'error' | 'connecting'

export type Theme =
  | 'graphite'
  | 'midnight'
  | 'navy'
  | 'paper'
  | 'orange'
  | 'red'
  | 'green'
  | 'purple'
  | 'ember'
  | 'twilight'

export interface Pane {
  id: string
  ptyId: string | null
  agent: AgentType
  customCommand?: string
  title: string
  status: PaneStatus
  workspaceId: string
}

export interface Workspace {
  id: string
  name: string
  path: string
  layout: WorkspaceLayout
  agent: AgentType
  panes: Pane[]
  createdAt: number
  activePane: string | null
  activeTabIndex: number
}

export interface AgentConfig {
  type: AgentType
  label: string
  command: string
  icon: string
  color: string
}

export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  claude: {
    type: 'claude',
    label: 'Claude Code',
    command: 'claude',
    icon: '◆',
    color: '#d4a853',
  },
  codex: {
    type: 'codex',
    label: 'Codex CLI',
    command: 'codex',
    icon: '⊕',
    color: '#4a9eff',
  },
  gemini: {
    type: 'gemini',
    label: 'Gemini CLI',
    command: 'gemini',
    icon: '✦',
    color: '#4fc3f7',
  },
  agy: {
    type: 'agy',
    label: 'Agy',
    command: 'agy',
    icon: '⊗',
    color: '#81c784',
  },
  custom: {
    type: 'custom',
    label: 'Custom',
    command: '',
    icon: '▷',
    color: '#b0b0b0',
  },
  shell: {
    type: 'shell',
    label: 'Shell',
    command: 'powershell',
    icon: '>_',
    color: '#888888',
  },
}
