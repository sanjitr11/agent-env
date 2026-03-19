/**
 * Onboarding flow — the entry point for every new startup.
 *
 * Runs 7 questions, validates answers, writes startup context to SQLite,
 * and generates all Claude Code configuration files.
 *
 * Design decisions in DESIGN.md § Q1.
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'
import { join } from 'path'

import {
  makeStartupContext,
  Stage,
  STAGE_LABELS,
  generate,
  formatResult,
  openDb,
  closeDb,
  saveStartupContext,
  startupContextExists,
} from '@agent-env/shared'

export async function runInit(projectRoot: string): Promise<void> {
  const agentEnvDir = join(projectRoot, '.agent-env')

  console.log('')
  p.intro(pc.bgCyan(pc.black(' agent-env ')))

  // ── Check if already initialized ────────────────────────────────────────────
  const store = openDb(agentEnvDir)

  if (startupContextExists(store)) {
    const shouldReinit = await p.confirm({
      message:
        'This project already has an agent environment. Reinitialize and overwrite generated files?',
      initialValue: false,
    })

    if (p.isCancel(shouldReinit) || !shouldReinit) {
      p.outro(pc.dim('No changes made. Run `agent-env sync` to regenerate configs from existing context.'))
      closeDb(store)
      return
    }
  }

  p.note(
    [
      'I\'ll ask you 7 quick questions to set up your agent team.',
      'This takes about 2 minutes.',
      '',
      'Your answers generate:',
      '  • A root CLAUDE.md with your startup context',
      '  • Coding, Research, Marketing, and Ops agents',
      '  • Claude Code settings and slash commands',
    ].join('\n'),
    'What we\'re setting up',
  )

  // ── Question 1: Startup name ─────────────────────────────────────────────────
  const startupName = await p.text({
    message: 'What\'s the name of your startup or project?',
    placeholder: 'e.g. Acme, TaskFlow, my-side-project',
    validate: (v) => (v.trim().length < 1 ? 'Name is required' : undefined),
  })
  if (p.isCancel(startupName)) { cancelAndExit(store); return }

  // ── Question 2: One-sentence pitch ──────────────────────────────────────────
  const pitch = await p.text({
    message: 'Describe what you\'re building in one sentence.',
    placeholder: 'e.g. Persistent specialized agents for solo founders built on Claude Code',
    validate: (v) => (v.trim().length < 10 ? 'Give a bit more detail (10 chars min)' : undefined),
  })
  if (p.isCancel(pitch)) { cancelAndExit(store); return }

  // ── Question 3: Stage ────────────────────────────────────────────────────────
  const stage = await p.select<Stage>({
    message: 'What stage are you at?',
    options: [
      { value: 'idea', label: 'Pre-product', hint: 'Exploring the problem space' },
      { value: 'mvp', label: 'Building MVP', hint: 'Actively building the first version' },
      { value: 'early', label: 'Early users', hint: 'Have users, iterating toward PMF' },
      { value: 'revenue', label: 'Revenue', hint: 'Revenue exists, scaling what works' },
      { value: 'scaling', label: 'Scaling', hint: 'Scaling teams, infra, and GTM' },
    ],
  })
  if (p.isCancel(stage)) { cancelAndExit(store); return }

  // ── Question 4: Tech stack ───────────────────────────────────────────────────
  const stack = await p.text({
    message: 'What\'s your primary tech stack?',
    placeholder: 'e.g. TypeScript, Next.js, PostgreSQL, Vercel',
    validate: (v) => (v.trim().length < 2 ? 'Enter at least one technology' : undefined),
  })
  if (p.isCancel(stack)) { cancelAndExit(store); return }

  // ── Question 5: ICP ──────────────────────────────────────────────────────────
  const icp = await p.text({
    message: 'Who is your ideal customer and what\'s their core pain?',
    placeholder: 'e.g. Solo founders who waste hours managing Claude Code context manually',
    validate: (v) => (v.trim().length < 10 ? 'Describe the customer and their pain (10 chars min)' : undefined),
  })
  if (p.isCancel(icp)) { cancelAndExit(store); return }

  // ── Question 6: Priorities ───────────────────────────────────────────────────
  const priorities = await p.text({
    message: 'What are your top 1–3 priorities right now?',
    placeholder: 'e.g. Ship MVP, get 5 pilot users, close first paying customer',
    validate: (v) => (v.trim().length < 5 ? 'Enter at least one priority' : undefined),
  })
  if (p.isCancel(priorities)) { cancelAndExit(store); return }

  // ── Question 7: Bottleneck (optional) ────────────────────────────────────────
  const bottleneck = await p.text({
    message: 'What\'s the one thing slowing you down most? (optional — press Enter to skip)',
    placeholder: 'e.g. Context management — agents start blank every session',
  })
  if (p.isCancel(bottleneck)) { cancelAndExit(store); return }

  // ── Build context ─────────────────────────────────────────────────────────────
  const ctx = makeStartupContext({
    startupName: (startupName as string).trim(),
    pitch: (pitch as string).trim(),
    stage: stage as Stage,
    stack: (stack as string).trim(),
    icp: (icp as string).trim(),
    priorities: (priorities as string).trim(),
    bottleneck: (bottleneck as string | undefined)?.trim() || undefined,
  })

  // ── Persist context ───────────────────────────────────────────────────────────
  const savingSpinner = p.spinner()
  savingSpinner.start('Saving startup context...')
  saveStartupContext(store, ctx)
  savingSpinner.stop('Startup context saved.')

  // ── Generate files ────────────────────────────────────────────────────────────
  const genSpinner = p.spinner()
  genSpinner.start('Generating Claude Code configuration...')

  const result = await generate(ctx, { projectRoot, force: true })

  genSpinner.stop('Configuration generated.')

  // ── Summary ───────────────────────────────────────────────────────────────────
  const summaryLines = [
    `Startup: ${pc.bold(ctx.startupName)}`,
    `Stage:   ${STAGE_LABELS[ctx.stage]}`,
    `Stack:   ${ctx.stack}`,
    '',
    'Files written:',
    formatResult(result),
  ]

  p.note(summaryLines.join('\n'), 'Done')

  p.outro(
    [
      pc.green('Your agent environment is ready.'),
      '',
      `Open Claude Code in ${pc.cyan(projectRoot)} and use:`,
      `  ${pc.bold('/coding')}    <task>   — coding agent`,
      `  ${pc.bold('/research')}  <topic>  — research agent`,
      `  ${pc.bold('/marketing')} <task>   — marketing agent`,
      `  ${pc.bold('/ops')}       <task>   — ops agent`,
      `  ${pc.bold('/route')}     <task>   — auto-route to the right agent`,
    ].join('\n'),
  )

  closeDb(store)
}

function cancelAndExit(store: ReturnType<typeof openDb>): void {
  p.cancel('Initialization cancelled.')
  closeDb(store)
  process.exit(0)
}
