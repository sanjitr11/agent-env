import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Project, Agent } from '../lib/types'
import AgentCard from '../components/AgentCard'

const STAGE_LABELS: Record<string, string> = {
  idea: 'Pre-product',
  mvp: 'Building MVP',
  early: 'Early users',
  revenue: 'Revenue',
  scaling: 'Scaling',
}

const STAGE_COLORS: Record<string, string> = {
  idea:     'bg-surface-overlay text-ink-2',
  mvp:      'bg-blue-950 text-blue-400',
  early:    'bg-emerald-950 text-emerald-400',
  revenue:  'bg-amber-950 text-amber-400',
  scaling:  'bg-violet-950 text-violet-400',
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [linkingFolder, setLinkingFolder] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('agents').select('*').eq('project_id', id).order('created_at'),
    ]).then(([projRes, agentsRes]) => {
      if (projRes.error) { setError(projRes.error.message); setLoading(false); return }
      setProject(projRes.data)
      setAgents(agentsRes.data ?? [])
      setLoading(false)
    })
  }, [id])

  async function handleLinkFolder() {
    if (!project) return
    setLinkingFolder(true)

    const picked = await window.electronAPI.openFolder()
    if (!picked) { setLinkingFolder(false); return }

    const { error: updateError } = await supabase
      .from('projects')
      .update({ local_path: picked })
      .eq('id', project.id)

    if (updateError) {
      setError(`Failed to save folder: ${updateError.message}`)
    } else {
      setProject({ ...project, local_path: picked })
    }
    setLinkingFolder(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-base">
        <p className="text-ink-3 text-sm">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <Link to="/projects" className="text-accent hover:text-accent-text text-sm transition-colors">
            ← Back to projects
          </Link>
        </div>
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="min-h-screen bg-surface-base">
      <header className="bg-surface-raised border-b border-surface-border px-6 py-3 flex items-center gap-3">
        <Link
          to="/projects"
          className="text-sm text-ink-3 hover:text-ink transition-colors"
        >
          ← Back
        </Link>
        <h1 className="text-sm font-semibold text-ink">{project.startup_name}</h1>
        <span
          className={`text-xs px-2.5 py-1 rounded font-medium ${
            STAGE_COLORS[project.stage] ?? 'bg-surface-overlay text-ink-2'
          }`}
        >
          {STAGE_LABELS[project.stage] ?? project.stage}
        </span>

        <Link
          to={`/projects/${id}/edit`}
          className="text-sm text-ink-3 hover:text-ink transition-colors ml-auto mr-3"
        >
          Edit
        </Link>

        <div>
          {project.local_path ? (
            <span
              className="text-xs text-ink-3 max-w-[220px] truncate block"
              title={project.local_path}
            >
              {project.local_path}
            </span>
          ) : (
            <button
              onClick={handleLinkFolder}
              disabled={linkingFolder}
              className="text-xs text-ink-3 hover:text-ink-2 transition-colors disabled:opacity-50"
            >
              {linkingFolder ? 'Picking…' : '+ Link folder'}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <Section label="Pitch">{project.pitch}</Section>
        <Section label="Tech Stack">{project.stack}</Section>
        <Section label="Ideal Customer Profile">{project.icp}</Section>
        <Section label="Current Priorities">{project.priorities}</Section>
        {project.bottleneck && (
          <Section label="Biggest Bottleneck">{project.bottleneck}</Section>
        )}

        <p className="text-xs text-ink-3 pt-2">
          Created {new Date(project.created_at).toLocaleString()} &middot; version {project.version}
        </p>

        {/* Agents section */}
        <div className="pt-4 border-t border-surface-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink">Agents</h2>
            <Link
              to={`/projects/${id}/agents/new`}
              className="text-sm text-accent hover:text-accent-text font-medium transition-colors"
            >
              Add agent →
            </Link>
          </div>

          {agents.length === 0 ? (
            <p className="text-sm text-ink-3">
              No agents yet — add one to start working.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} projectId={id!} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="text-[10px] uppercase tracking-widest text-ink-3 font-medium mb-1.5">
        {label}
      </h3>
      <p className="text-sm text-ink-2 leading-relaxed">{children}</p>
    </div>
  )
}
