import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProjectCard from '../components/ProjectCard'
import type { Project } from '../lib/types'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) setError(error.message)
      else setProjects(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <header className="bg-surface-raised border-b border-surface-border px-6 py-3 flex items-center justify-between">
        <h1 className="text-sm font-semibold text-ink">agent-env</h1>
        <div className="flex items-center gap-3">
          <Link
            to="/projects/new"
            className="bg-accent hover:bg-accent-hover text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
          >
            + New Project
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm text-ink-3 hover:text-ink transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {loading && (
          <p className="text-ink-3 text-sm">Loading projects...</p>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-950 rounded-lg px-4 py-3">{error}</p>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="py-20 max-w-sm">
            <h2 className="text-base font-semibold text-ink mb-2">Welcome to agent-env</h2>
            <p className="text-sm text-ink-2 leading-relaxed mb-6">
              Create a project to set up your agent team — a Coding Agent, Research Agent,
              Marketing Agent, and Ops Agent, each loaded with your startup context and
              persistent memory across every Claude Code session.
            </p>
            <div className="space-y-2 mb-8">
              {[
                'Answer 7 questions about your startup',
                'Get 4 specialized agents pre-configured',
                'Agents remember decisions across sessions',
              ].map((step) => (
                <div key={step} className="flex items-start gap-2 text-sm text-ink-2">
                  <span className="text-accent mt-px">✓</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <Link
              to="/projects/new"
              className="inline-block bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Create your first project →
            </Link>
          </div>
        )}

        {projects.length > 0 && (
          <div className="space-y-2">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
