/**
 * SQLite state store for agent-env.
 *
 * Uses the built-in `node:sqlite` module (Node 22.5+, stable in Node 24).
 * No native compilation required — zero extra dependencies.
 *
 * Database lives at {agentEnvDir}/state.db — typically .agent-env/state.db.
 *
 * Context-RAII integration note:
 * When Context-RAII is wired in, session tracking moves to its store.
 * The startup_context table stays here — it's our data.
 */

import { DatabaseSync } from 'node:sqlite'
import { join } from 'path'
import { mkdirSync } from 'fs'

export interface DB {
  db: DatabaseSync
  agentEnvDir: string
}

export function openDb(agentEnvDir: string): DB {
  mkdirSync(agentEnvDir, { recursive: true })
  const dbPath = join(agentEnvDir, 'state.db')
  const db = new DatabaseSync(dbPath)

  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')

  migrate(db)

  return { db, agentEnvDir }
}

export function closeDb({ db }: DB): void {
  db.close()
}

// ─── Migrations ───────────────────────────────────────────────────────────────

function migrate(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL
    );
  `)

  const versionRow = db.prepare('SELECT version FROM schema_version').get() as
    | { version: number }
    | undefined

  if (!versionRow) {
    db.exec('INSERT INTO schema_version (version) VALUES (0)')
  }

  const version = (versionRow?.version ?? 0) as number

  if (version < 1) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS startup_context (
        id          INTEGER PRIMARY KEY CHECK (id = 1),
        data        TEXT NOT NULL,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS agent_sessions (
        id          TEXT PRIMARY KEY,
        agent_type  TEXT NOT NULL CHECK (agent_type IN ('coding', 'research', 'marketing', 'ops')),
        started_at  TEXT NOT NULL,
        ended_at    TEXT,
        task        TEXT,
        status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'aborted'))
      );

      CREATE TABLE IF NOT EXISTS events (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id  TEXT REFERENCES agent_sessions(id),
        type        TEXT NOT NULL,
        payload     TEXT,
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );

      UPDATE schema_version SET version = 1;
    `)
  }
}
