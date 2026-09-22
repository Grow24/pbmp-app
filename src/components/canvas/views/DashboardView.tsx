import { GripVertical } from 'lucide-react'
import { useWorkbench } from '../../../context/WorkbenchContext'

export function DashboardView() {
  const { blocks, filterItems, reorderBlocks } = useWorkbench()
  const kpis = blocks('dashboard').filter((item) => item.blockType === 'kpi')
  const work = filterItems(blocks('dashboard').filter((item) => item.blockType === 'work_row'))
  const sprint = blocks('dashboard').find((item) => item.blockType === 'sprint')
  const stats = blocks('dashboard').filter((item) => item.blockType === 'sprint_stat')

  const moveKpi = (from: number, to: number) => {
    if (to < 0 || to >= kpis.length) return
    const ids = kpis.map((item) => item.id)
    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved)
    void reorderBlocks(ids)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <p className="text-[11px] text-slate-400">Drag the handle to rearrange KPI widgets. Order is saved for everyone.</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => (
          <article
            key={kpi.id}
            draggable
            onDragStart={(event) => event.dataTransfer.setData('text/plain', String(index))}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              moveKpi(Number(event.dataTransfer.getData('text/plain')), index)
            }}
            className="ui-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-slate-500">{kpi.title}</p>
              <GripVertical className="h-3.5 w-3.5 cursor-grab text-slate-300" />
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
    </div>
  )
}
