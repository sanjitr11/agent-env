import { useState } from 'react'
import type { ProjectFormData } from '../lib/types'

const STAGES: Array<{ value: ProjectFormData['stage']; label: string }> = [
  { value: 'idea', label: 'Pre-product — exploring the problem space' },
  { value: 'mvp', label: 'Building MVP — first version in progress' },
  { value: 'early', label: 'Early users — iterating toward PMF' },
  { value: 'revenue', label: 'Revenue — scaling what works' },
  { value: 'scaling', label: 'Scaling — teams, infra, and GTM' },
]

interface Props {
  initialValues?: Partial<ProjectFormData>
  onSubmit: (data: ProjectFormData) => Promise<void>
  loading?: boolean
  error?: string | null
  submitLabel?: string
}

export default function ProjectForm({
  initialValues,
  onSubmit,
  loading,
  error,
  submitLabel = 'Save project',
}: Props) {
  const [values, setValues] = useState<ProjectFormData>({
    startup_name: initialValues?.startup_name ?? '',
    pitch: initialValues?.pitch ?? '',
    stage: initialValues?.stage ?? 'idea',
    stack: initialValues?.stack ?? '',
    icp: initialValues?.icp ?? '',
    priorities: initialValues?.priorities ?? '',
    bottleneck: initialValues?.bottleneck ?? null,
  })

  function set<K extends keyof ProjectFormData>(key: K, value: ProjectFormData[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Startup name" required>
        <input
          type="text"
          value={values.startup_name}
          onChange={(e) => set('startup_name', e.target.value)}
          maxLength={60}
          required
          className="input"
          placeholder="e.g. Acme, TaskFlow"
        />
      </Field>

      <Field label="One-sentence pitch" required>
        <textarea
          value={values.pitch}
          onChange={(e) => set('pitch', e.target.value)}
          rows={2}
          maxLength={300}
          required
          minLength={10}
          className="input resize-none"
          placeholder="What are you building and for whom?"
        />
      </Field>

      <Field label="Stage" required>
        <select
          value={values.stage}
          onChange={(e) => set('stage', e.target.value as ProjectFormData['stage'])}
          className="input"
        >
          {STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tech stack" required>
        <input
          type="text"
          value={values.stack}
          onChange={(e) => set('stack', e.target.value)}
          maxLength={200}
          required
          className="input"
          placeholder="e.g. TypeScript, Next.js, PostgreSQL, Vercel"
        />
      </Field>

      <Field label="Ideal customer profile" required>
        <textarea
          value={values.icp}
          onChange={(e) => set('icp', e.target.value)}
          rows={3}
          maxLength={400}
          required
          minLength={10}
          className="input resize-none"
          placeholder="Who is your ideal customer and what's their core pain?"
        />
      </Field>

      <Field label="Current priorities" required>
        <textarea
          value={values.priorities}
          onChange={(e) => set('priorities', e.target.value)}
          rows={3}
          maxLength={500}
          required
          minLength={5}
          className="input resize-none"
          placeholder="Top 1–3 priorities right now"
        />
      </Field>

      <Field label="Biggest bottleneck" hint="optional">
        <textarea
          value={values.bottleneck ?? ''}
          onChange={(e) => set('bottleneck', e.target.value || null)}
          rows={2}
          maxLength={300}
          className="input resize-none"
          placeholder="What's slowing you down most?"
        />
      </Field>

      {error && (
        <p className="text-sm text-red-400 bg-red-950 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-accent hover:bg-accent-hover text-white py-3 px-6 rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
      >
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-2 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {hint && <span className="text-ink-3 font-normal ml-1">({hint})</span>}
      </label>
      {children}
    </div>
  )
}
