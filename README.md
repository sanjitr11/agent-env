# Dispatch

A persistent agent team for solo founders and early-stage startups, built on Claude Code. Your agents never start blank — every session begins with full context about your startup, your decisions, and what was done last time.

## The Problem

Solo founders using Claude Code waste hours re-explaining their stack, ICP, and priorities every session. Claude Code agents are powerful but amnesiac by default. Dispatch fixes that.

## What It Does

- **One-time onboarding** — answer 7 questions about your startup. Your context is written into `CLAUDE.md` files that live inside your project repo.
- **Specialized agent team** — Coding, Research, Marketing, and Ops agents, each loaded with your startup context and role-specific instructions.
- **Persistent memory** — agents maintain a session log across restarts. Each session starts knowing what was built and decided last time.
- **Desktop app** — embedded xterm.js terminals, split-view agent sessions, light/dark mode.
- **Task router** — type a task in the sidebar, Dispatch routes it to the right agent automatically.
- **MCP integrations** — Coding agents get filesystem + git MCP servers injected automatically. Connect GitHub, Slack, and others per agent via the UI.
- **Cloud sync** — Supabase-backed auth and project data, synced across machines.

## Architecture

```
dispatch/
├── packages/
│   ├── shared/        # Core library: config generation, SQLite state, routing
│   ├── cli/           # Dispatch CLI (init, sync, route)
│   └── app/           # Electron desktop app (React + xterm.js + Supabase)
└── supabase/          # Database migrations
```

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (strict, ESM) |
| Runtime | Node.js 22.5+ |
| Desktop | Electron 33 + Vite + React 18 |
| Terminal | xterm.js + node-pty |
| Cloud sync | Supabase (auth + RLS) |
| UI | TailwindCSS + React Router |
| State | SQLite (node:sqlite, WAL mode) |

## Getting Started

**Prerequisites:** Node.js 22.5.0+, Claude Code installed

```bash
git clone https://github.com/sanjitr11/agent-env
cd agent-env
npm install
npm run dev    # Electron app with hot reload
```

## How It Works

### Onboarding

Seven questions to capture your startup context:

1. Startup name
2. One-sentence pitch
3. Stage (idea / mvp / early / revenue / scaling)
4. Tech stack
5. Ideal customer profile
6. Current top priorities
7. Biggest bottleneck *(optional)*

From your answers, Dispatch generates `CLAUDE.md` files for each agent, `.claude/settings.json` with runtime config and hooks, and slash command definitions.

### Agent Team

| Agent | Role |
|---|---|
| Coding Agent | Implementation, bugs, refactoring, code review, deploys |
| Research Agent | Decisions, competitor analysis, library evaluation, tradeoffs |
| Marketing Agent | Copy, content, messaging, positioning, pitch, launches |
| Ops Agent | Planning, tooling, admin, integrations, everything else |

Each agent runs as a separate Claude Code session with its own `CLAUDE.md` and MCP server configuration.

### Task Router

Weighted keyword scoring routes tasks to the right agent:

```
"should we use Postgres or DynamoDB?" → research agent (confidence: 0.88)
"fix the auth bug"                    → coding agent  (confidence: 0.91)
"write a landing page headline"       → marketing agent (confidence: 0.85)
```

### Persistent Memory

Each session appends to a `## Session Log` in the agent's `CLAUDE.md`. The next session starts knowing what was done before. No blank slates.

## Scripts

```bash
npm run dev          # Electron app (hot reload)
npm run build        # Production build
npm run package:mac  # macOS DMG (x64 + arm64)
```

## License

MIT
