import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProjectForm from '../components/ProjectForm'
import type { Project, ProjectFormData } from '../lib/types'

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    supabase.from('projects').select('*').eq('id', id).single().then(({ data, error }) => {
      if (error) setLoadError(error.message)
      else setProject(data)
    })
  }, [id])

  async function handleSubmit(data: ProjectFormData) {
    if (!id) return
    setSaving(true)
    setSaveError(null)

    const { error } = await supabase
      .from('projects')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      setSaveError(error.message)
      setSaving(false)
    } else {
      navigate(`/projects/${id}`)
    }
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-4">{loadError}</p>
          <Link to="/projects" className="text-accent hover:text-accent-text text-sm transition-colors">
            ← Back to projects
          </Link>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-base">
        <p className="text-ink-3 text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <header className="bg-surface-raised border-b border-surface-border px-6 py-3 flex items-center gap-3">
        <Link
          to={`/projects/${id}`}
          className="text-sm text-ink-3 hover:text-ink transition-colors"
        >
          ← Back
        </Link>
        <h1 className="text-sm font-semibold text-ink">Edit {project.startup_name}</h1>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10">
        <ProjectForm
          initialValues={project}
          onSubmit={handleSubmit}
          loading={saving}
          error={saveError}
          submitLabel="Save changes"
        />
      </main>
    </div>
  )
}
