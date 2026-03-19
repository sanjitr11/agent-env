import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AGENT_META } from '../lib/agentMeta'
import type { AgentType } from '../lib/types'

const TYPES: AgentType[] = ['coding', 'research', 'marketing', 'ops', 'custom']

export default function CreateAgentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [type, setType] = useState<AgentType>('coding')
  const [name, setName] = useState(AGENT_META.coding.label)
  const [instructions, setInstructions] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleTypeChange(t: AgentType) {
    setType(t)
    setName(AGENT_META[t].label)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setSaving(false); return }

    const { error: insertError } = await supabase.from('agents').insert({
      project_id: id,
      user_id: user.id,
      name: name.trim(),
      type,
      instructions: instructions.trim() || null,
    })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    navigate(`/projects/${id}`)
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <header className="bg-surface-raised border-b border-surface-border px-6 py-3 flex items-center gap-3">
        <Link
          to={`/projects/${id}`}
          className="text-sm text-ink-3 hover:text-ink transition-colors"
        >
          ← back
        </Link>
        <h1 className="text-sm font-semibold text-ink">New agent</h1>
      </header>

      <main className="max-w-lg mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type select */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-ink-3 font-medium mb-2">
              Type
            </label>
            <div className="space-y-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    type === t
                      ? 'border-accent bg-accent-muted text-ink'
                      : 'border-surface-border bg-surface-raised hover:bg-surface-overlay hover:border-ink-3 text-ink'
                  }`}
                >
                  <div className="font-medium text-sm">{AGENT_META[t].label}</div>
                  {AGENT_META[t].role && (
                    <div className={`text-xs mt-0.5 ${type === t ? 'text-accent-text' : 'text-ink-3'}`}>
                      {AGENT_META[t].role}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-ink-3 font-medium mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
              className="w-full px-3 py-2 border border-surface-border bg-surface-overlay rounded-lg text-sm text-ink placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Advanced toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-ink-3 hover:text-ink transition-colors"
            >
              {showAdvanced ? '▾' : '▸'} Advanced
            </button>
            {showAdvanced && (
              <div className="mt-3">
                <label className="block text-[10px] uppercase tracking-widest text-ink-3 font-medium mb-1.5">
                  Custom instructions{' '}
                  <span className="font-normal text-ink-3 normal-case tracking-normal">({instructions.length}/1000)</span>
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  maxLength={1000}
                  rows={5}
                  placeholder="Optional: additional instructions for this agent…"
                  className="w-full px-3 py-2 border border-surface-border bg-surface-overlay rounded-lg text-sm text-ink placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full bg-accent hover:bg-accent-hover text-white py-3 px-6 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating…' : 'Create agent'}
          </button>
        </form>
      </main>
    </div>
  )
}
