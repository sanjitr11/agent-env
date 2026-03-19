import { z } from 'zod'

export const StageSchema = z.enum(['idea', 'mvp', 'early', 'revenue', 'scaling'])
export type Stage = z.infer<typeof StageSchema>

export const STAGE_LABELS: Record<Stage, string> = {
  idea: 'Pre-product / exploring the problem space',
  mvp: 'Building the first version',
  early: 'Have users, iterating toward PMF',
  revenue: 'Revenue exists, scaling what works',
  scaling: 'Scaling teams, infra, and GTM',
}

export const STAGE_TONE: Record<Stage, string> = {
  idea: 'Validate before building. Speed of learning > speed of shipping.',
  mvp: 'Ship to learn. Speed > polish. Every decision is reversible.',
  early: 'Listen to users. Fix what breaks PMF. Ignore everything else.',
  revenue: 'Double down on what works. Kill what doesn\'t.',
  scaling: 'Systematize. Hire for leverage. Protect what\'s working.',
}

export const StartupContextSchema = z.object({
  // Core identity
  startupName: z.string().min(1).max(60),
  pitch: z.string().min(10).max(300),
  stage: StageSchema,

  // Technical
  stack: z.string().min(2).max(200),

  // Product/market
  icp: z.string().min(10).max(400),

  // Current state
  priorities: z.string().min(5).max(500),
  bottleneck: z.string().max(300).optional(),

  // Metadata
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  version: z.number().int().positive().default(1),
})

export type StartupContext = z.infer<typeof StartupContextSchema>

export function makeStartupContext(
  raw: Omit<StartupContext, 'createdAt' | 'updatedAt' | 'version'>,
): StartupContext {
  const now = new Date().toISOString()
  return StartupContextSchema.parse({
    ...raw,
    createdAt: now,
    updatedAt: now,
    version: 1,
  })
}
