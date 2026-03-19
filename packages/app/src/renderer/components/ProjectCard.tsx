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
  idea:     'bg-surface-overlay text-ink-2',
  mvp:      'bg-blue-950 text-blue-400',
  early:    'bg-emerald-950 text-emerald-400',
  revenue:  'bg-amber-950 text-amber-400',
  scaling:  'bg-violet-950 text-violet-400',
}

interface Props {
  project: Project
}

export default function ProjectCard({ project }: Props) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="group block bg-surface-raised rounded-lg border border-surface-border p-5 hover:bg-surface-overlay hover:border-ink-3 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-medium text-ink truncate">{project.startup_name}</h2>
          <p className="text-sm text-ink-2 mt-1 line-clamp-2">{project.pitch}</p>
        </div>
        <span
          className={`shrink-0 text-xs px-2.5 py-1 rounded font-medium ${
            STAGE_COLORS[project.stage] ?? 'bg-surface-overlay text-ink-2'
          }`}
        >
          {STAGE_LABELS[project.stage] ?? project.stage}
        </span>
      </div>
      <p className="text-xs text-ink-3 mt-3">
        {new Date(project.created_at).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </p>
    </Link>
  )
}
