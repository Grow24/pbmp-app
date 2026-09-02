import { useWorkbench } from '../../../context/WorkbenchContext'

export function MapsView() {
  const { blocks } = useWorkbench()
  const meta = blocks('maps').find((item) => item.blockType === 'map_meta')
  const nodes = blocks('maps').filter((item) => item.blockType === 'map_node')

  return (
    <div className="mx-auto max-w-6xl">
      <article className="ui-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{meta?.title}</h2>
            <p className="text-xs text-slate-400">{meta?.subtitle}</p>
          </div>
          <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
            {meta?.value}
          </span>
        </div>
        <div className="relative h-[380px] bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.28)_1px,transparent_0)] bg-[size:20px_20px]">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 80" preserveAspectRatio="none">
            <line x1="14" y1="42" x2="30" y2="42" stroke="#91caff" strokeWidth="0.6" />
            <line x1="36" y1="42" x2="52" y2="24" stroke="#91caff" strokeWidth="0.6" />
            <line x1="36" y1="42" x2="52" y2="62" stroke="#91caff" strokeWidth="0.6" />
            <line x1="58" y1="24" x2="76" y2="42" stroke="#91caff" strokeWidth="0.6" />
            <line x1="58" y1="62" x2="76" y2="42" stroke="#91caff" strokeWidth="0.6" />
          </svg>
          {nodes.map((node) => (
            <div
              key={node.id}
              className="absolute w-36 -translate-x-1/2 -translate-y-1/2 border border-slate-200 bg-white px-3 py-2 text-center shadow-sm"
              style={{ left: `${Number(node.extra.x || 0)}%`, top: `${Number(node.extra.y || 0)}%` }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">{node.title}</div>
              <div className="text-sm font-semibold text-slate-800">{node.subtitle}</div>
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}
