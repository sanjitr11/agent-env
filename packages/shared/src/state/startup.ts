/**
 * Startup context persistence — built on node:sqlite via db.ts.
 * There is exactly one row (id=1) — a startup has one context.
 */

import { DB } from './db.js'
import { StartupContext, StartupContextSchema } from '../config/schema.js'

export function saveStartupContext(store: DB, ctx: StartupContext): void {
  const now = new Date().toISOString()
  store.db
    .prepare(`
      INSERT INTO startup_context (id, data, created_at, updated_at)
      VALUES (1, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        data       = excluded.data,
        updated_at = excluded.updated_at
    `)
    .run(JSON.stringify(ctx), ctx.createdAt, now)
}

export function loadStartupContext(store: DB): StartupContext | null {
  const row = store.db
    .prepare('SELECT data FROM startup_context WHERE id = 1')
    .get() as { data: string } | undefined

  if (!row) return null

  const parsed = StartupContextSchema.safeParse(JSON.parse(row.data))
  if (!parsed.success) return null
  return parsed.data
}

export function startupContextExists(store: DB): boolean {
  const row = store.db
    .prepare('SELECT 1 AS exists_flag FROM startup_context WHERE id = 1')
    .get()
  return !!row
}

export function updateStartupContext(
  store: DB,
  updates: Partial<Omit<StartupContext, 'createdAt' | 'version'>>,
): StartupContext {
  const existing = loadStartupContext(store)
  if (!existing) throw new Error('No startup context found. Run `agent-env init` first.')

  const updated: StartupContext = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
    version: existing.version + 1,
  }

  saveStartupContext(store, updated)
  return updated
}
