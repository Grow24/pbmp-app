import { GripVertical, Trash2 } from 'lucide-react'
import { ArtifactPreview, artifactFromContent } from '../../ai/ArtifactPreview'
import { useAi } from '../../../context/AiContext'
import { useWorkbench } from '../../../context/WorkbenchContext'

export function DashboardView() {
  const { blocks, filterItems, reorderBlocks } = useWorkbench()
  const { prefs, removeFromCanvas } = useAi()
  const movable = prefs.layout === 'movable'
  const kpis = blocks('dashboard').filter((item) => item.blockType === 'kpi')
  const work = filterItems(blocks('dashboard').filter((item) => item.blockType === 'work_row'))
  const sprint = blocks('dashboard').find((item) => item.blockType === 'sprint')
  const stats = blocks('dashboard').filter((item) => item.blockType === 'sprint_stat')
  const savedAi = blocks('dashboard').filter((item) => item.blockType === 'ai_artifact')

  const moveKpi = (from: number, to: number) => {
    if (to < 0 || to >= kpis.length) return
    const ids = kpis.map((item) => item.id)
    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved)
    void reorderBlocks(ids)
  }

  const moveArtifact = (from: number, to: number) => {
    if (to < 0 || to >= savedAi.length) return
    const ids = savedAi.map((item) => item.id)
    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved)
    void reorderBlocks(ids)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <p className="text-[11px] text-slate-400">
        {movable
          ? 'Widgets are movable. Drag the handle to rearrange KPIs and saved AI artifacts. Switch to Fixed in Personal preferences to lock them.'
          : 'Widgets are fixed. Open Personal preferences and choose Movable if you want to drag KPIs and saved artifacts.'}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => (
          <article
            key={kpi.id}
            draggable={movable}
            onDragStart={(event) => {
              if (!movable) return
              event.dataTransfer.setData('text/plain', String(index))
            }}
            onDragOver={(event) => {
              if (movable) event.preventDefault()
            }}
            onDrop={(event) => {
              if (!movable) return
              event.preventDefault()
              moveKpi(Number(event.dataTransfer.getData('text/plain')), index)
            }}
            className="ui-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-slate-500">{kpi.title}</p>
              {movable ? <GripVertical className="h-3.5 w-3.5 cursor-grab text-slate-300" /> : null}
            </div>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-2xl font-semibold text-slate-900">{kpi.value}</span>
              <span className="mb-0.5 text-sm text-slate-400">{String(kpi.extra.suffix || '')}</span>
            </div>
            <p className={`mt-2 text-xs ${kpi.extra.tone === 'good' ? 'text-emerald-600' : 'text-amber-600'}`}>
              {String(kpi.extra.delta || '')}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <article className="ui-card">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-[13px] font-medium text-slate-900">Continue working</h2>
          </div>
          <table className="w-full text-left text-[13px]">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Item</th>
                <th className="px-4 py-2 font-medium">Owner</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {work.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 text-slate-800">{item.title}</td>
                  <td className="px-4 py-2.5 text-slate-500">{item.subtitle}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-600">
                      {item.value}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        {sprint && (
          <article className="ui-card p-4">
            <h2 className="text-[13px] font-medium text-slate-900">{sprint.title}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{sprint.body}</p>
            <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
              {stats.map((stat) => (
                <div key={stat.id}>
                  <dt className="text-[11px] text-slate-400">{stat.title}</dt>
                  <dd className="mt-1 text-base font-semibold text-slate-800">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        )}
      </div>

      {savedAi.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Saved AI artifacts</p>
            {movable && (
              <p className="text-[11px] text-slate-400">Drag a card to move it</p>
            )}
          </div>
          <div className={`grid gap-3 ${savedAi.length > 1 ? 'lg:grid-cols-2' : ''}`}>
            {savedAi.map((item, index) => (
              <article
                key={item.id}
                onDragOver={(event) => {
                  if (movable) event.preventDefault()
                }}
                onDrop={(event) => {
                  if (!movable) return
                  event.preventDefault()
                  moveArtifact(Number(event.dataTransfer.getData('text/plain')), index)
                }}
                className="overflow-hidden rounded border border-slate-200 bg-white p-3"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      {String(item.value || 'artifact')} · saved from conversation
                    </p>
                    <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {movable ? (
                      <span
                        draggable
                        title="Drag to move"
                        onDragStart={(event) => {
                          event.dataTransfer.setData('text/plain', String(index))
                        }}
                        className="inline-flex h-7 w-7 cursor-grab items-center justify-center rounded border border-slate-200 text-slate-400"
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className="ui-btn h-7 px-2 text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                      title="Remove this artifact from the canvas"
                      onClick={() => void removeFromCanvas(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
                <ArtifactPreview artifact={artifactFromContent(item, savedAi)} compact />
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
