export const AGENT_META = {
  coding:    { label: 'Coding Agent',    color: 'bg-bg-overlay text-agent-coding',    role: 'Implementation, bugs, refactoring, code review, and deploys.' },
  research:  { label: 'Research Agent',  color: 'bg-bg-overlay text-agent-research',  role: 'Decisions, competitor analysis, library evaluation, and tradeoffs.' },
  marketing: { label: 'Marketing Agent', color: 'bg-bg-overlay text-agent-marketing', role: 'Copy, content, messaging, positioning, pitch, and launches.' },
  ops:       { label: 'Ops Agent',       color: 'bg-bg-overlay text-agent-ops',       role: 'Planning, tooling, admin, integrations, and everything else.' },
  custom:    { label: 'Custom Agent',    color: 'bg-bg-overlay text-text-muted',      role: '' },
} as const
