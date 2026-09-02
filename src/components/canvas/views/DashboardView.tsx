import { useWorkbench } from '../../../context/WorkbenchContext'

export function DashboardView() {
  const { blocks, filterItems } = useWorkbench()
  const kpis = blocks('dashboard').filter((item) => item.blockType === 'kpi')
  const work = filterItems(blocks('dashboard').filter((item) => item.blockType === 'work_row'))
  const sprint = blocks('dashboard').find((item) => item.blockType === 'sprint')
  const stats = blocks('dashboard').filter((item) => item.blockType === 'sprint_stat')

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <article key={kpi.id} className="ui-card p-4">
            <p className="text-xs text-slate-500">{kpi.title}</p>
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
