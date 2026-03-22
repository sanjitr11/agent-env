import { Link } from 'react-router-dom'
import type { Project } from '../lib/types'

const STAGE_LABELS: Record<string, string> = {
  idea: 'Pre-product',
  mvp: 'Building MVP',
  early: 'Early users',
  revenue: 'Revenue',
  scaling: 'Scaling',
}

const STAGE_COLORS: Record<string, string> = {
  idea:     'bg-bg-overlay text-text-secondary',
  mvp:      'bg-bg-overlay text-agent-coding',
  early:    'bg-bg-overlay text-agent-ops',
  revenue:  'bg-bg-overlay text-warning',
  scaling:  'bg-bg-overlay text-agent-research',
}

interface Props {
  project: Project
}

export default function ProjectCard({ project }: Props) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="group block bg-bg-subtle rounded-lg border border-border px-5 py-4 hover:bg-bg-muted hover:border-border-strong transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-medium text-text-primary truncate">{project.startup_name}</h2>
          <p className="text-sm text-text-secondary mt-1 line-clamp-2">{project.pitch}</p>
        </div>
        <span
          className={`shrink-0 text-xs px-2.5 py-1 rounded font-medium ${
            STAGE_COLORS[project.stage] ?? 'bg-bg-overlay text-text-secondary'
          }`}
        >
          {STAGE_LABELS[project.stage] ?? project.stage}
        </span>
      </div>
      <p className="text-xs text-text-muted mt-3">
        {new Date(project.created_at).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </p>
    </Link>
  )
}
