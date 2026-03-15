# DESIGN.md — Agent Environment for Startups

> Scratchpad answers to the 6 design questions before writing any code.
> These are the decisions this codebase is built on. Update this file when
> a decision changes, not after the fact.

---

## Q1: The 5–7 Onboarding Questions

These questions must be answerable in under 3 minutes. Every answer
feeds directly into a generated CLAUDE.md. No question is asked for
analytics or future features — each one has a home in the output.

| # | Field | Prompt | Type | Why it's asked |
|---|-------|--------|------|----------------|
| 1 | `startupName` | "What's the name of your startup or project?" | text | Root identity, used in every agent's header |
| 2 | `pitch` | "Describe what you're building in one sentence." | text | Coding + ops agents need product context to make coherent decisions |
| 3 | `stage` | "What stage are you at?" | select | Sets urgency tone and default priorities for all agents |
| 4 | `stack` | "What's your primary tech stack? (e.g. TypeScript, Next.js, PostgreSQL, Vercel)" | text | Coding agent needs this to give relevant advice; avoids hallucinating wrong frameworks |
| 5 | `icp` | "Who is your ideal customer and what's their core pain?" | text | Marketing agent's foundation; also grounding for ops + product decisions |
| 6 | `priorities` | "What are your top 1–3 priorities right now?" | text | All agents use this to understand what matters; routing uses it to calibrate ops vs coding |
| 7 | `bottleneck` | "What's the one thing slowing you down most?" | text | Optional but high-signal; helps the ops agent's default stance |

**Stage options:**
- `idea` — Pre-product / exploring the problem space
- `mvp` — Actively building the first version
- `early` — Have users, iterating toward PMF
- `revenue` — Revenue exists, scaling what works
- `scaling` — Scaling teams, infra, and GTM

---

## Q2: Root CLAUDE.md (for a SaaS startup)

The root CLAUDE.md lives at the project root. Claude Code loads it
automatically for every session. It sets the universal context that all
agents inherit, and explains the agent team so Claude knows how to route
sub-tasks when using the Task tool.

```markdown
# [StartupName] — Startup Context

## What We're Building
[pitch]

## Stage
[stage label] — [one-line implication of this stage, e.g. "Speed > polish. Ship to learn."]

## Tech Stack
[stack]

## Ideal Customer
[icp]

## Current Priorities
[priorities, formatted as a numbered list]

## Biggest Bottleneck
[bottleneck]

---

## Agent Team

This project uses a specialized agent environment. Four agents are
available. When delegating work via the Task tool, or when asked to
route a task, use this guide:

### Coding Agent (`/coding`)
Codebase-aware. Knows architecture, conventions, testing approach.
Use for: implementation, debugging, refactoring, code review, migrations.

### Research Agent (`/research`)
Investigation memory. Tracks what's been explored, decided, and dismissed.
Use for: technical decisions, competitor analysis, library evaluation,
architecture tradeoffs, "should we" questions.

### Marketing Agent (`/marketing`)
Positioning and messaging aware. Knows ICP, brand voice, content history.
Use for: copy, content, announcements, email, positioning, pitch decks.

### Ops Agent (`/ops`)
General purpose. Handles everything else.
Use for: planning, scheduling, admin, integrations, tooling, anything
that doesn't fit the above.

---

## Routing Rules
When a task description is ambiguous, default to the coding agent if it
involves the codebase, the research agent if it involves a decision or
investigation, the marketing agent if it involves external communication,
and the ops agent otherwise.
```

---

## Q3: Coding Agent CLAUDE.md

Lives at `.agent-env/agents/coding/CLAUDE.md`. Injected via the `/coding`
custom command. Provides deep technical context the root CLAUDE.md omits
to keep root concise.

```markdown
# [StartupName] — Coding Agent

## Role
You are the coding agent for [startupName]. Your job is to implement,
debug, and maintain the codebase with full awareness of the product
context and architectural conventions.

## Product Context
[pitch]

## Tech Stack (Detailed)
[stack — expanded with any additional detail gathered post-init]

## Architecture Overview
[Populated by `agent-env sync` after the agent reads the codebase. Initially:
"Not yet populated — run `agent-env sync` after onboarding to generate
an architecture summary."]

## Code Conventions
[Populated by sync, or manually via `/coding update-conventions`. Initially:
- Follow the conventions already present in the codebase
- When in doubt, match the style of the surrounding file
- No unnecessary abstractions — solve the specific problem]

## Testing Approach
[Populated by sync. Initially: "Follow existing test patterns in the repo."]

## Key Files
[Populated by sync. Initially: empty]

## What This Agent Remembers
[Structured log of past decisions, updated by the agent after each session.
Format: `YYYY-MM-DD: [decision or finding]`]

## What This Agent Does NOT Handle
- Market research or competitive analysis → use /research
- Copy, content, or messaging → use /marketing
- Administrative or planning tasks → use /ops
```

---

## Q4: Research Agent CLAUDE.md

Lives at `.agent-env/agents/research/CLAUDE.md`. This is a living document
of institutional knowledge — the "second brain" for technical and product
decisions.

```markdown
# [StartupName] — Research Agent

## Role
You are the research agent for [startupName]. You maintain the
institutional memory of what has been investigated, what decisions were
made and why, and what approaches were considered and dismissed.

## Product Context
[pitch]

## Stage Context
[stage] — [implication]

## Competitive Landscape
[Populated by the research agent as it runs sessions. Initially: "Not yet
populated. Start a research session with `/research` to begin building
this section."]

## Technical Decisions Log
Format: `YYYY-MM-DD: [decision] — [rationale]`
[Initially empty — append here after each research session]

## Dismissed Approaches
Format: `YYYY-MM-DD: [what was dismissed] — [why]`
[Initially empty]

## Open Questions
[List of unresolved questions that need future investigation]

## What This Agent Remembers
This agent is append-only for findings — it grows over time. When you
complete a research session, always append a summary to the appropriate
section of this file.

## What This Agent Does NOT Handle
- Writing code → use /coding
- Writing copy or content → use /marketing
- Operations or scheduling → use /ops
```

---

## Q5: Claude Code settings.json with 3 Subagents Configured

Claude Code reads `.claude/settings.json` for runtime configuration. It
does not natively support "subagents" as a concept — subagents in our
system are activated via custom slash commands in `.claude/commands/`.

### `.claude/settings.json`

```json
{
  "model": "claude-sonnet-4-6",
  "cleanupPeriodDays": 30,
  "permissions": {
    "allow": [
      "Bash(git *)",
      "Bash(npm *)",
      "Bash(npx *)",
      "Bash(node *)",
      "Bash(tsx *)",
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep",
      "WebFetch",
      "WebSearch",
      "Task"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(curl * | bash)",
      "Bash(wget * | bash)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node .agent-env/hooks/pre-tool-use.js"
          }
        ]
      }
    ]
  }
}
```

### `.claude/commands/coding.md`

```markdown
You are now operating as the **Coding Agent** for [startupName].

Load your full context from `.agent-env/agents/coding/CLAUDE.md` at the
start of this session. After completing the task, append a one-line
summary of any significant decisions or findings to the "What This Agent
Remembers" section of that file.

Task: $ARGUMENTS
```

### `.claude/commands/research.md`

```markdown
You are now operating as the **Research Agent** for [startupName].

Load your full context from `.agent-env/agents/research/CLAUDE.md` at the
start of this session. After completing the task, append findings to the
appropriate section (Competitive Landscape / Technical Decisions /
Dismissed Approaches / Open Questions).

Task: $ARGUMENTS
```

### `.claude/commands/marketing.md`

```markdown
You are now operating as the **Marketing Agent** for [startupName].

Load your full context from `.agent-env/agents/marketing/CLAUDE.md` at the
start of this session. After completing the task, append a summary of
any new decisions, copy produced, or positioning changes to the agent
file.

Task: $ARGUMENTS
```

### `.claude/commands/route.md`

```markdown
Analyze the following task and determine which specialized agent should
handle it. Use this routing logic:

- **Coding**: code, bugs, implementation, tests, deployment, refactoring,
  architecture, database, APIs, performance
- **Research**: decisions, comparisons, competitors, evaluation, tradeoffs,
  "should we", "which library", technical investigation
- **Marketing**: copy, content, messaging, positioning, email, announcements,
  ICP, brand, pitch, landing pages
- **Ops**: everything else — planning, scheduling, admin, tooling, integrations

Once you've determined the agent, activate it using the /coding, /research,
/marketing, or /ops command and execute the task.

Task: $ARGUMENTS
```

---

## Q6: Task Routing Logic

### The Problem
The founder describes a task in natural language. We need to decide:
coding, research, marketing, or ops — with enough confidence to route
automatically, and enough transparency to let the founder override.

### The Algorithm: Weighted Keyword Scoring

Each agent has a set of keywords with weights. We tokenize the task
description, score against each agent's pattern set, normalize by token
count, and pick the highest scorer above a confidence threshold.

```
score(agent) = Σ weight(keyword) for each keyword found in task
confidence(agent) = score(agent) / max(score(all agents))
```

If `max(score) < MIN_CONFIDENCE` (0.2), default to ops and surface the
ambiguity to the user.

### Keyword Maps

**Coding** (technical, implementation-oriented):
`code, bug, fix, implement, build, test, deploy, refactor, debug,
function, class, api, endpoint, database, schema, migration, query,
performance, error, crash, feature, component, module, library, package,
typescript, javascript, python, react, next, node, sql, git, pr, review,
lint, type, interface, compile, import, export, hook, route, middleware,
auth, encryption, cron, job, queue, cache`

**Research** (investigative, decision-oriented):
`research, investigate, compare, evaluate, competitor, alternative,
should we, which, tradeoff, decision, architecture, approach, strategy,
best practice, how does, why does, what is, learn, understand, analyze,
market, technical, design, pattern, recommend, pros and cons, options,
survey, benchmark, pick, choose, versus, vs`

**Marketing** (communication, positioning-oriented):
`marketing, copy, content, blog, tweet, post, thread, messaging,
positioning, customer, user, persona, icp, brand, email, newsletter,
landing page, website, announcement, launch, growth, acquisition,
retention, churn, pitch, deck, sales, headline, tagline, cta, campaign,
channel, seo, ads, pr, press, tone, voice`

**Ops** (catch-all): no keywords — receives tasks that score below
threshold on all others.

### Special Cases

1. **Multi-agent tasks**: If a task scores above threshold for 2+ agents,
   present the options to the user before routing. Don't silently split.

2. **Explicit agent prefix**: If the task starts with `@coding`, `@research`,
   `@marketing`, or `@ops`, skip scoring and route directly.

3. **Low-confidence fallback**: Route to ops, print the scores, and ask
   the founder to confirm or redirect.

### Why Not LLM-Based Routing?

For Sprint 1: latency + cost + setup friction. Keyword routing is
deterministic, instant, and works with zero API calls. Once we have
usage data, we can train a small classifier or add an LLM fallback for
low-confidence cases. YAGNI until then.

### Routing Decision Output

```typescript
interface RoutingDecision {
  agent: 'coding' | 'research' | 'marketing' | 'ops'
  confidence: number        // 0–1
  scores: Record<string, number>  // all agents' raw scores
  reason: string            // human-readable explanation
  override: boolean         // true if user used @agent prefix
}
```

---

## Key Design Invariants

1. **Generated files are owned by the tool, not the user.** Root CLAUDE.md
   and agent CLAUDE.md files are regenerated on `sync`. Manual edits go
   in `CLAUDE.local.md` which is preserved.

2. **One init, many syncs.** `init` runs once. `sync` runs whenever the
   startup context changes or the codebase evolves.

3. **Agents are stateful, not stateless.** Each agent appends to its own
   CLAUDE.md as it learns. The file grows. This is intentional.

4. **Routing is transparent.** The founder always sees why a task was
   routed where it was. No black-box assignment.

5. **Context-RAII owns session lifecycle.** We don't implement session
   management ourselves. We call the library.
