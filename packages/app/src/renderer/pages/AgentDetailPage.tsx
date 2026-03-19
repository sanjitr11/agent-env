import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AGENT_META } from '../lib/agentMeta'
import { agentCwd } from '../lib/buildClaudeMd'
import type { Agent, Project } from '../lib/types'

function parseSessionLog(content: string): string[] {
  const marker = '## Session Log'
  const idx = content.indexOf(marker)
  if (idx === -1) return []
  const section = content.slice(idx + marker.length)
  return section
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^\d{4}-\d{2}-\d{2}:/.test(l))
    .reverse()
}

export default function AgentDetailPage() {
  const { id, agentId } = useParams<{ id: string; agentId: string }>()
  const navigate = useNavigate()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [opening, setOpening] = useState(false)
  const [sessionLog, setSessionLog] = useState<string[]>([])
  const [claudeMd, setClaudeMd] = useState<string | null>(null)
  const [showContext, setShowContext] = useState(false)

  useEffect(() => {
    if (!id || !agentId) return
    Promise.all([
      supabase.from('agents').select('*').eq('id', agentId).single(),
      supabase.from('projects').select('*').eq('id', id).single(),
    ]).then(async ([agentRes, projectRes]) => {
      if (agentRes.error) { setError(agentRes.error.message); setLoading(false); return }
      if (projectRes.error) { setError(projectRes.error.message); setLoading(false); return }
      const ag = agentRes.data
      const proj = projectRes.data
      setAgent(ag)
      setProject(proj)
      setLoading(false)

      if (proj.local_path) {
        const claudeMdPath = `${agentCwd(proj.local_path, ag.name)}/CLAUDE.md`
        const content = await window.electronAPI.readFile(claudeMdPath)
        if (content) {
          setSessionLog(parseSessionLog(content))
          setClaudeMd(content)
        }
      }
    })
  }, [id, agentId])

  async function handleOpen(cmd?: string) {
    if (!agent || !project) return
    setOpening(true)
    setError(null)

    try {
      let localPath = project.local_path

      if (!localPath) {
        const picked = await window.electronAPI.openFolder()
        if (!picked) { setOpening(false); return }

        const { error: updateError } = await supabase
          .from('projects')
          .update({ local_path: picked })
          .eq('id', project.id)

        if (updateError) {
          setError(`Failed to save folder: ${updateError.message}`)
          setOpening(false)
          return
        }

        setProject({ ...project, local_path: picked })
        localPath = picked
      }

      setOpening(false)
      const dest = `/projects/${id}/agents/${agentId}/terminal`
      navigate(cmd ? `${dest}?cmd=${cmd}` : dest)
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
      setOpening(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-base">
        <p className="text-ink-3 text-sm">Loading…</p>
      </div>
    )
  }

  if (error || !agent || !project) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-4">{error ?? 'Not found'}</p>
          <Link to={`/projects/${id}`} className="text-accent hover:text-accent-text text-sm transition-colors">
            ← back to project
          </Link>
        </div>
      </div>
    )
  }

  const meta = AGENT_META[agent.type]

  return (
    <div className="min-h-screen bg-surface-base">
      <header className="bg-surface-raised border-b border-surface-border px-6 py-3 flex items-center gap-3">
        <Link
          to={`/projects/${id}`}
          className="text-sm text-ink-3 hover:text-ink transition-colors"
        >
          ← back
        </Link>
        <h1 className="text-sm font-semibold text-ink">{agent.name}</h1>
        <span className={`text-xs px-2.5 py-1 rounded font-medium ${meta.color}`}>
          {meta.label}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {agent.type === 'coding' && (
            <button
              onClick={() => handleOpen('sync')}
              disabled={opening}
              className="text-sm text-ink-3 hover:text-ink border border-surface-border px-3 py-1.5 rounded font-medium disabled:opacity-50 transition-colors"
            >
              Sync
            </button>
          )}
          <button
            onClick={() => handleOpen()}
            disabled={opening}
            className="bg-accent hover:bg-accent-hover text-white px-4 py-1.5 rounded text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {opening ? 'Opening…' : 'Open in Claude Code →'}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        {meta.role && (
          <div>
            <h3 className="text-[10px] uppercase tracking-widest text-ink-3 font-medium mb-1.5">Role</h3>
            <p className="text-sm text-ink-2">{meta.role}</p>
          </div>
        )}
        {agent.instructions && (
          <div>
            <h3 className="text-[10px] uppercase tracking-widest text-ink-3 font-medium mb-1.5">
              Custom instructions
            </h3>
            <p className="text-sm text-ink-2 whitespace-pre-wrap">{agent.instructions}</p>
          </div>
        )}
        {sessionLog.length > 0 && (
          <div>
            <h3 className="text-[10px] uppercase tracking-widest text-ink-3 font-medium mb-2">
              Session log
            </h3>
            <ul className="space-y-1">
              {sessionLog.map((entry, i) => {
                const [date, ...rest] = entry.split(': ')
                return (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="text-ink-3 shrink-0 font-mono text-xs pt-px">{date}</span>
                    <span className="text-ink-2">{rest.join(': ')}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {claudeMd && (
          <div>
            <button
              onClick={() => setShowContext((v) => !v)}
              className="text-[10px] uppercase tracking-widest text-ink-3 font-medium hover:text-ink transition-colors"
            >
              {showContext ? '▾' : '▸'} Agent context (CLAUDE.md)
            </button>
            {showContext && (
              <pre className="mt-3 p-4 bg-surface-overlay rounded-lg text-xs text-ink-2 font-mono whitespace-pre-wrap overflow-auto max-h-96 border border-surface-border">
                {claudeMd}
              </pre>
            )}
          </div>
        )}

        <p className="text-xs text-ink-3 pt-2">
          Created {new Date(agent.created_at).toLocaleString()}
        </p>

        <button
          onClick={() => handleOpen()}
          disabled={opening}
          className="w-full bg-accent hover:bg-accent-hover text-white py-3 px-6 rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
        >
          {opening ? 'Opening…' : 'Open in Claude Code →'}
        </button>
      </main>
    </div>
  )
}
