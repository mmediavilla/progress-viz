export type TurnRow = {
  startedAt: number
  tools: number
  lastTool: string
  endedAt: number | null
  isAborted: boolean
}

export type AgentRow = {
  id: string
  type: string
  description: string
  startedAt: number
  tools: number
  lastTool: string
  endedAt: number | null
  isFailed: boolean
  output?: string
}

declare module 'claude-code' {
  interface PluginState {
    'progress-viz': { turn: TurnRow | null; agents: AgentRow[]; openId: string | null }
  }
}
