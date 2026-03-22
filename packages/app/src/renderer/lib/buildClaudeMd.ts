import { AGENT_META } from './agentMeta'
import type { Project, Agent } from './types'

export function agentSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function agentCwd(localPath: string, agentName: string): string {
  return `${localPath}/.agentenv/${agentSlug(agentName)}`
}

export function buildClaudeMd(p: Project, ag: Agent): string {
  const stageLabels: Record<string, string> = {
    idea: 'Pre-product / exploring the problem space',
    mvp: 'Building the first version',
    early: 'Have users, iterating toward PMF',
    revenue: 'Revenue exists, scaling what works',
    scaling: 'Scaling teams, infra, and GTM',
  }
  const stageTone: Record<string, string> = {
    idea: 'Validate before building. Speed of learning > speed of shipping.',
    mvp: 'Ship to learn. Speed > polish. Every decision is reversible.',
    early: 'Listen to users. Fix what breaks PMF. Ignore everything else.',
    revenue: "Double down on what works. Kill what doesn't.",
    scaling: "Systematize. Hire for leverage. Protect what's working.",
  }

  const priorityItems = p.priorities
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)

  const priorities = priorityItems.map((s, i) => `${i + 1}. ${s}`).join('\n')
  const prioritiesInline = priorityItems.join(', ')

  const agentRole = AGENT_META[ag.type].role
  const instructionsSection = ag.instructions ? `\n${ag.instructions}` : ''

  return `# ${p.startup_name} — ${ag.name}

## Role
${agentRole}${instructionsSection}

**Session start protocol:** When you begin a new conversation, before
the user types anything, introduce yourself with:
"${ag.name} ready. Working on ${p.startup_name} — ${p.pitch.split('\n')[0]}. Current priorities: ${prioritiesInline}. What are we building today?"

This makes it immediately clear to the founder that their startup
context loaded correctly.

**Before ending your session, always append a one-line summary to the
Session Log at the bottom of this file using the Write tool.**

## Startup Context

### What We're Building
${p.pitch}

### Stage
${stageLabels[p.stage]} — ${stageTone[p.stage]}

### Tech Stack
${p.stack}

### Ideal Customer
${p.icp}

### Current Priorities
${priorities}
${p.bottleneck ? `\n### Biggest Bottleneck\n${p.bottleneck}` : ''}

## Session Log
*(append: \`YYYY-MM-DD: [one-line summary of what was done]\`)*
*(A post-session hook also writes here automatically as a fallback.)*

---
*Synced from Dispatch on ${new Date().toISOString().slice(0, 10)}.*
`
}
