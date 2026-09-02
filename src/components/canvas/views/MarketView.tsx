import { useWorkbench } from '../../../context/WorkbenchContext'

export function MarketView() {
  const { blocks, filterItems } = useWorkbench()
  const signals = filterItems(blocks('market').filter((item) => item.blockType === 'market_signal'))
  const narrative = blocks('market').find((item) => item.blockType === 'market_narrative')

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {signals.map((item) => (
          <article key={item.id} className="ui-card p-4">
            <p className="text-xs font-medium text-slate-500">{item.title}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{item.value}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
          </article>
        ))}
      </div>
      {narrative && (
        <article className="ui-card p-4">
          <h2 className="text-sm font-semibold text-slate-900">{narrative.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{narrative.body}</p>
        </article>
      )}
    </div>
  )
}
