import { Link } from 'react-router-dom'
import { AGENT_META } from '../lib/agentMeta'
import type { Agent } from '../lib/types'

interface Props {
  agent: Agent
  projectId: string
}

export default function AgentCard({ agent, projectId }: Props) {
  const meta = AGENT_META[agent.type]
  return (
    <Link
      to={`/projects/${projectId}/agents/${agent.id}`}
      className="group block bg-bg-subtle rounded-lg border border-border p-4 hover:bg-bg-muted hover:border-border-strong transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-text-primary truncate">{agent.name}</h3>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded font-medium ${meta.color}`}>
          {meta.label}
        </span>
      </div>
      {meta.role && (
        <p className="text-xs text-text-secondary mt-1.5 line-clamp-1">{meta.role}</p>
      )}
      <p className="text-xs text-text-muted mt-2">
        {new Date(agent.created_at).toLocaleDateString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric',
        })}
      </p>
    </Link>
  )
}
