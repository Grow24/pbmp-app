import { useEffect, useState } from 'react'
import type { AiArtifact } from '../../ai/types'
import { aiApi } from '../../lib/aiApi'
import { ArtifactPreview } from './ArtifactPreview'

export function ArtifactWindow({ id }: { id: string }) {
  const [artifact, setArtifact] = useState<AiArtifact | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    aiApi
      .artifact(id)
      .then((row) => {
        if (!cancelled) setArtifact(row)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not open this artifact')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <div className="flex h-full flex-col bg-[#f5f7fa]">
      <header className="border-b border-slate-200 bg-white px-5 py-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Artifact</p>
        <h1 className="text-base font-semibold text-slate-900">{artifact?.title || 'Opening…'}</h1>
      </header>
      <main className="min-h-0 flex-1 overflow-auto p-5">
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {!error && !artifact && <p className="text-sm text-slate-500">Loading artifact…</p>}
        {artifact && (
          <div className="ui-card p-4">
            <ArtifactPreview artifact={artifact} />
          </div>
        )}
      </main>
    </div>
  )
}
