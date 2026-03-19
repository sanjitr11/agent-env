export const AGENT_META = {
  coding:    { label: 'Coding Agent',    color: 'bg-blue-950 text-blue-400',     role: 'Implementation, bugs, refactoring, code review, and deploys.' },
  research:  { label: 'Research Agent',  color: 'bg-violet-950 text-violet-400', role: 'Decisions, competitor analysis, library evaluation, and tradeoffs.' },
  marketing: { label: 'Marketing Agent', color: 'bg-rose-950 text-rose-400',     role: 'Copy, content, messaging, positioning, pitch, and launches.' },
  ops:       { label: 'Ops Agent',       color: 'bg-amber-950 text-amber-400',   role: 'Planning, tooling, admin, integrations, and everything else.' },
  custom:    { label: 'Custom Agent',    color: 'bg-surface-overlay text-ink-2', role: '' },
} as const
