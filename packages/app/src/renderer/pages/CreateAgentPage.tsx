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
    <div className="min-h-screen bg-bg-base">
      <header className="bg-bg-subtle border-b border-border px-6 py-3 flex items-center gap-3">
        <Link
          to={`/projects/${id}`}
          className="text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          ← back
        </Link>
        <h1 className="text-sm font-semibold text-text-primary">New agent</h1>
      </header>

      <main className="max-w-lg mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-muted font-medium mb-2">
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
                      ? 'border-border-strong bg-accent-subtle text-text-primary'
                      : 'border-border bg-bg-subtle hover:bg-bg-muted hover:border-border-strong text-text-primary'
                  }`}
                >
                  <div className="font-medium text-sm">{AGENT_META[t].label}</div>
                  {AGENT_META[t].role && (
                    <div className={`text-xs mt-0.5 ${type === t ? 'text-text-secondary' : 'text-text-muted'}`}>
                      {AGENT_META[t].role}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
              className="input"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              {showAdvanced ? '▾' : '▸'} Advanced
            </button>
            {showAdvanced && (
              <div className="mt-3">
                <label className="block text-[10px] uppercase tracking-widest text-text-muted font-medium mb-1.5">
                  Custom instructions{' '}
                  <span className="font-normal text-text-muted normal-case tracking-normal">({instructions.length}/1000)</span>
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  maxLength={1000}
                  rows={5}
                  placeholder="Optional: additional instructions for this agent…"
                  className="input resize-none"
                />
              </div>
            )}
          </div>

          {error && <p className="text-error text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full bg-accent hover:bg-accent-hover text-accent-text py-3 px-6 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating…' : 'Create agent'}
          </button>
        </form>
      </main>
    </div>
  )
}
