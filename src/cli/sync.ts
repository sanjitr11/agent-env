/**
 * Sync command — regenerates root CLAUDE.md and slash commands from stored
 * startup context, without overwriting agent CLAUDE.md files (they're
 * append-only and owned by the agents after init).
 *
 * Run after:
 * - Changing startup context (stage, priorities, stack updates)
 * - Pulling a teammate's changes that updated the context
 * - Upgrading agent-env (new template format)
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'
import { join } from 'path'

import { generate, formatResult } from '../config/generator.js'
import { openDb, closeDb } from '../state/db.js'
import { loadStartupContext } from '../state/startup.js'

export async function runSync(projectRoot: string): Promise<void> {
  const agentEnvDir = join(projectRoot, '.agent-env')

  console.log('')
  p.intro(pc.bgCyan(pc.black(' agent-env sync ')))

  const store = openDb(agentEnvDir)
  const ctx = loadStartupContext(store)

  if (!ctx) {
    p.cancel('No startup context found. Run `agent-env init` first.')
    closeDb(store)
    process.exit(1)
  }

  p.log.info(`Syncing config for ${pc.bold(ctx.startupName)} (v${ctx.version})`)

  const spinner = p.spinner()
  spinner.start('Regenerating configuration files...')

  // force: true on root CLAUDE.md and commands (derived from context)
  // force: false on agent CLAUDE.md files (they accumulate session history)
  const result = await generate(ctx, { projectRoot, force: false })

  spinner.stop('Done.')

  p.note(formatResult(result), 'Sync result')
  p.outro(pc.green('Config synced.'))

  closeDb(store)
}
