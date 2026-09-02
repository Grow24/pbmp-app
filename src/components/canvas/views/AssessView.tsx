import { useWorkbench } from '../../../context/WorkbenchContext'

const alertClass: Record<string, string> = {
  rose: 'border-rose-200 bg-rose-50 text-rose-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
}

export function AssessView() {
  const { blocks } = useWorkbench()
  const items = blocks('assess')
  const summary = items.find((item) => item.blockType === 'assess_summary')
  const metrics = items.filter((item) => item.blockType === 'assess_metric')
  const alerts = items.filter((item) => item.blockType === 'assess_alert')
  const capabilities = items.filter((item) => item.blockType === 'capability')

  return (
    <div className="mx-auto max-w-6xl space-y-3">
      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="ui-card p-4">
          <p className="text-xs text-slate-400">{summary?.title}</p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">{summary?.subtitle}</h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-slate-600">{summary?.body}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {metrics.map((item) => (
              <div key={item.id} className="border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-[11px] text-slate-400">{item.title}</div>
                <div className="mt-0.5 text-[13px] font-medium text-slate-800">{item.value}</div>
              </div>
            ))}
          </div>
        </article>
        <article className="ui-card p-4">
          <h3 className="text-[13px] font-medium text-slate-900">Steering snapshot</h3>
          <ul className="mt-3 space-y-2 text-[13px]">
            {alerts.map((item) => (
              <li
                key={item.id}
                className={`border px-3 py-2 ${alertClass[String(item.extra.tone || 'amber')] || alertClass.amber}`}
              >
                {item.body}
              </li>
            ))}
          </ul>
        </article>
      </div>

      <article className="ui-card p-4">
        <h3 className="text-[13px] font-medium text-slate-900">Capability scores</h3>
        <div className="mt-3 space-y-3">
          {capabilities.map((item) => (
            <div key={item.id}>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-slate-800">{item.title}</span>
                <span className="text-slate-500">{item.value}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden bg-slate-100">
                <div className="h-full bg-brand-500" style={{ width: `${Number(item.value || 0)}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-400">{item.body}</p>
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}
