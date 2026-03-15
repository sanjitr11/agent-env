export type AgentType = 'coding' | 'research' | 'marketing' | 'ops'

export const AGENT_LABELS: Record<AgentType, string> = {
  coding: 'Coding Agent',
  research: 'Research Agent',
  marketing: 'Marketing Agent',
  ops: 'Ops Agent',
}

export const AGENT_DESCRIPTIONS: Record<AgentType, string> = {
  coding: 'Implementation, debugging, refactoring, code review, deployments',
  research: 'Decisions, competitor analysis, library evaluation, tradeoffs',
  marketing: 'Copy, content, messaging, positioning, launches',
  ops: 'Planning, tooling, admin, integrations, everything else',
}

export const AGENT_COMMANDS: Record<AgentType, string> = {
  coding: '/coding',
  research: '/research',
  marketing: '/marketing',
  ops: '/ops',
}
