/**
 * Context-RAII integration layer — session lifecycle management.
 *
 * Stub implementation using node:sqlite directly.
 * TODO: Replace with context-raii library calls once it's published.
 */

import { randomUUID } from 'crypto'
import { DB } from '../state/db.js'
import { AgentType } from '../agents/base.js'

export interface AgentSession {
  id: string
  agentType: AgentType
  startedAt: string
  task: string | null
  status: 'active' | 'completed' | 'aborted'
}

export function startSession(store: DB, agentType: AgentType, task?: string): AgentSession {
  const session: AgentSession = {
    id: randomUUID(),
    agentType,
    startedAt: new Date().toISOString(),
    task: task ?? null,
    status: 'active',
  }

  store.db
    .prepare(`
      INSERT INTO agent_sessions (id, agent_type, started_at, task, status)
      VALUES (?, ?, ?, ?, 'active')
    `)
    .run(session.id, session.agentType, session.startedAt, session.task)

  return session
}

export function endSession(
  store: DB,
  sessionId: string,
  status: 'completed' | 'aborted' = 'completed',
): void {
  store.db
    .prepare(`
      UPDATE agent_sessions
      SET ended_at = ?, status = ?
      WHERE id = ?
    `)
    .run(new Date().toISOString(), status, sessionId)
}

export function getActiveSession(store: DB, agentType: AgentType): AgentSession | null {
  const row = store.db
    .prepare(`
      SELECT id, agent_type, started_at, task, status
      FROM agent_sessions
      WHERE agent_type = ? AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `)
    .get(agentType) as
    | { id: string; agent_type: string; started_at: string; task: string | null; status: string }
    | undefined

  if (!row) return null

  return {
    id: row.id,
    agentType: row.agent_type as AgentType,
    startedAt: row.started_at,
    task: row.task,
    status: row.status as AgentSession['status'],
  }
}

export function logEvent(
  store: DB,
  sessionId: string | null,
  type: string,
  payload?: unknown,
): void {
  store.db
    .prepare(`
      INSERT INTO events (session_id, type, payload)
      VALUES (?, ?, ?)
    `)
    .run(sessionId, type, payload ? JSON.stringify(payload) : null)
}
