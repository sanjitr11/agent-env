/**
 * Per-agent scope definitions for Context-RAII.
 *
 * A scope defines what resources an agent session holds and what cleanup
 * actions run when the session ends. This maps to Context-RAII's resource
 * scope model.
 *
 * TODO: Replace stub types with Context-RAII's actual Scope interface once
 *       the library is linked.
 */

import { AgentType } from '../agents/base.js'

export interface ScopeDefinition {
  name: string
  agentType: AgentType
  /** Resources this scope holds (will be passed to Context-RAII) */
  resources: string[]
  /** Max session duration in seconds before auto-expiry */
  ttlSeconds: number
  /** Whether this scope's state persists across process restarts */
  persistent: boolean
}

export const AGENT_SCOPES: Record<AgentType, ScopeDefinition> = {
  coding: {
    name: 'coding-agent-scope',
    agentType: 'coding',
    resources: ['codebase-read', 'codebase-write', 'test-runner', 'git'],
    ttlSeconds: 60 * 60 * 4, // 4 hours
    persistent: true,
  },
  research: {
    name: 'research-agent-scope',
    agentType: 'research',
    resources: ['web-search', 'web-fetch', 'research-memory-write'],
    ttlSeconds: 60 * 60 * 2, // 2 hours
    persistent: true,
  },
  marketing: {
    name: 'marketing-agent-scope',
    agentType: 'marketing',
    resources: ['marketing-memory-write', 'web-search'],
    ttlSeconds: 60 * 60 * 2,
    persistent: true,
  },
  ops: {
    name: 'ops-agent-scope',
    agentType: 'ops',
    resources: ['web-search', 'bash-restricted'],
    ttlSeconds: 60 * 60 * 1,
    persistent: false,
  },
}
