import { useWorkbench } from '../../../context/WorkbenchContext'

export function FilterView() {
  const { blocks } = useWorkbench()
  const intro = blocks('filter').find((item) => item.blockType === 'filter_intro')
  const views = blocks('filter').filter((item) => item.blockType === 'filter_view')

  return (
    <div className="mx-auto max-w-3xl ui-card p-4">
      <h2 className="text-sm font-semibold text-slate-900">{intro?.title || 'Saved views'}</h2>
      <p className="mt-1 text-sm text-slate-500">{intro?.body}</p>
      <div className="mt-4 space-y-2">
        {views.map((view) => (
          <button
            key={view.id}
            type="button"
            className="flex w-full items-center justify-between border border-slate-200 px-4 py-3 text-left hover:border-brand-500 hover:bg-brand-50"
          >
            <div>
              <div className="text-sm font-medium text-slate-800">{view.title}</div>
              <div className="text-xs text-slate-400">
                {view.subtitle} · {view.body}
              </div>
            </div>
            <span className="text-xs font-semibold text-brand-600">{view.value} items</span>
          </button>
        ))}
      </div>
    </div>
  )
}
