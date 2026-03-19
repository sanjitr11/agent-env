import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AGENT_META } from '../lib/agentMeta'
import { agentSlug } from '../lib/buildClaudeMd'
import type { Project, Agent } from '../lib/types'
import TerminalPanel, { type TerminalStatus } from '../components/TerminalPanel'

const STAGE_LABELS: Record<string, string> = {
  idea: 'Pre-product',
  mvp: 'Building MVP',
  early: 'Early users',
  revenue: 'Revenue',
  scaling: 'Scaling',
}

const STATUS_DOT: Record<TerminalStatus, string> = {
  starting: 'text-yellow-400',
  running:  'text-emerald-400',
  exited:   'text-gray-500',
  error:    'text-red-400',
}

export default function ProjectWorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [linkingFolder, setLinkingFolder] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Which agent's terminal is currently shown
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  // Which terminals have been booted (never unmounted once in)
  const [openedAgentIds, setOpenedAgentIds] = useState<Set<string>>(new Set())
  // Status per agent
  const [agentStatuses, setAgentStatuses] = useState<Record<string, TerminalStatus>>({})
  // Agents with unread output
  const [unreadAgentIds, setUnreadAgentIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('agents').select('*').eq('project_id', id).order('created_at'),
    ]).then(([projRes, agentsRes]) => {
      if (!projRes.error) setProject(projRes.data)
      setAgents(agentsRes.data ?? [])
      setLoading(false)
    })
  }, [id])

  function selectAgent(agentId: string) {
    setActiveAgentId(agentId)
    setOpenedAgentIds((prev) => new Set([...prev, agentId]))
    setUnreadAgentIds((prev) => {
      const next = new Set(prev)
      next.delete(agentId)
      return next
    })
  }

  function handleStatusChange(agentId: string, status: TerminalStatus) {
    setAgentStatuses((prev) => ({ ...prev, [agentId]: status }))
  }

  function handleUnreadOutput(agentId: string) {
    if (agentId === activeAgentId) return
    setUnreadAgentIds((prev) => new Set([...prev, agentId]))
  }

  async function handleLinkFolder() {
    if (!project) return
    setLinkingFolder(true)
    const picked = await window.electronAPI.openFolder()
    if (!picked) { setLinkingFolder(false); return }
    const { error } = await supabase
      .from('projects')
      .update({ local_path: picked })
      .eq('id', project.id)
    if (!error) setProject({ ...project, local_path: picked })
    setLinkingFolder(false)
  }

  async function handleDelete() {
    if (!project) return
    setDeleting(true)
    await supabase.from('agents').delete().eq('project_id', project.id)
    await supabase.from('projects').delete().eq('id', project.id)
    navigate('/projects')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d1117]">
        <p className="text-gray-500 text-sm">Loading…</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d1117]">
        <p className="text-red-400 text-sm">Project not found.</p>
      </div>
    )
  }

  const activeAgent = agents.find((a) => a.id === activeAgentId) ?? null

  return (
    <div className="flex h-screen bg-[#0d1117] overflow-hidden">
      {/* ── Sidebar ── */}
      <div className="w-52 flex flex-col bg-[#0d1117] border-r border-[#21262d] shrink-0">
        {/* Back + project header */}
        <div className="px-3 pt-3 pb-2 border-b border-[#21262d]">
          <Link
            to="/projects"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors block mb-2"
          >
            ← Projects
          </Link>
          <div className="text-sm font-semibold text-gray-200 truncate">
            {project.startup_name}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {STAGE_LABELS[project.stage] ?? project.stage}
          </div>
          <div className="mt-2">
            {project.local_path ? (
              <span className="text-[10px] text-gray-600 truncate block" title={project.local_path}>
                {project.local_path.split('/').pop()}
              </span>
            ) : (
              <button
                onClick={handleLinkFolder}
                disabled={linkingFolder}
                className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
              >
                {linkingFolder ? 'Picking…' : '+ Link folder'}
              </button>
            )}
          </div>

          <div className="mt-3">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">Sure?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-[10px] text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-[10px] text-gray-700 hover:text-red-400 transition-colors"
              >
                Delete project
              </button>
            )}
          </div>
        </div>

        {/* Agent list */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 mb-1">
            <span className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">
              Agents
            </span>
          </div>

          {agents.length === 0 ? (
            <p className="text-xs text-gray-600 px-3 py-2">No agents yet.</p>
          ) : (
            agents.map((agent) => {
              const isActive = agent.id === activeAgentId
              const status = agentStatuses[agent.id]
              const hasUnread = unreadAgentIds.has(agent.id)
              const dotColor = status ? STATUS_DOT[status] : 'text-gray-600'

              return (
                <button
                  key={agent.id}
                  onClick={() => selectAgent(agent.id)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                    isActive
                      ? 'bg-[#161b22] text-gray-100'
                      : 'text-gray-400 hover:bg-[#161b22] hover:text-gray-200'
                  }`}
                >
                  {/* Status dot — only shown once started */}
                  {status ? (
                    <span className={`text-[8px] ${dotColor}`}>●</span>
                  ) : (
                    <span className="w-[10px]" />
                  )}
                  <span className="text-xs flex-1 truncate">{agent.name}</span>
                  {hasUnread && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="Unread output" />
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Add agent */}
        <div className="px-3 py-3 border-t border-[#21262d]">
          <Link
            to={`/projects/${id}/agents/new`}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            + Add agent
          </Link>
        </div>
      </div>

      {/* ── Main panel ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Panel header */}
        <div className="flex items-center gap-3 px-4 py-2 bg-[#161b22] border-b border-[#21262d] shrink-0">
          {activeAgent ? (
            <>
              <span className="text-sm font-medium text-gray-200">{activeAgent.name}</span>
              {agentStatuses[activeAgent.id] && (
                <span className={`text-xs ${STATUS_DOT[agentStatuses[activeAgent.id]]}`}>
                  ● {agentStatuses[activeAgent.id]}
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                {activeAgent.type === 'coding' && (
                  <button
                    onClick={() => {
                      /* Sync sends /sync to the active terminal — handled by autoCmd on boot.
                         For post-boot, we need to send input directly. */
                      window.electronAPI.terminalInput(activeAgent.id, '/sync\r')
                    }}
                    className="text-xs text-gray-500 hover:text-gray-300 border border-[#30363d] px-2.5 py-1 rounded transition-colors"
                  >
                    Sync
                  </button>
                )}
                {/* Expand to full-screen */}
                <button
                  onClick={() =>
                    navigate(`/projects/${id}/agents/${activeAgent.id}/terminal`)
                  }
                  className="text-xs text-gray-500 hover:text-gray-300 border border-[#30363d] px-2 py-1 rounded transition-colors"
                  title="Expand to full screen"
                >
                  ⛶
                </button>
              </div>
            </>
          ) : (
            <span className="text-sm text-gray-600">Select an agent to start a session</span>
          )}
        </div>

        {/* Terminal area */}
        <div className="flex-1 relative overflow-hidden">
          {/* No-selection placeholder */}
          {!activeAgentId && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-1">No agent selected</p>
                <p className="text-gray-700 text-xs">
                  Pick an agent from the sidebar to start a Claude Code session.
                </p>
              </div>
            </div>
          )}

          {/* Missing folder prompt — show if no local_path and an agent is selected */}
          {activeAgentId && !project.local_path && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-3">
                  Link a local folder to start a session.
                </p>
                <button
                  onClick={handleLinkFolder}
                  disabled={linkingFolder}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded font-medium transition-colors disabled:opacity-50"
                >
                  {linkingFolder ? 'Picking…' : '+ Link folder'}
                </button>
              </div>
            </div>
          )}

          {/* Render a TerminalPanel for each opened agent — CSS hide/show, never unmount */}
          {project.local_path &&
            agents
              .filter((a) => openedAgentIds.has(a.id))
              .map((agent) => (
                <TerminalPanel
                  key={agent.id}
                  project={project}
                  agent={agent}
                  visible={agent.id === activeAgentId}
                  onStatusChange={handleStatusChange}
                  onUnreadOutput={handleUnreadOutput}
                />
              ))}
        </div>
      </div>
    </div>
  )
}
