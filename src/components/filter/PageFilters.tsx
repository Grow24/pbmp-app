import { useWorkbench } from '../../context/WorkbenchContext'
import { filtersForPage, scopeLabel } from './scope'

export function PageFilters({ page }: { page: string }) {
  const { savedFilters, activeFilterIds, toggleFilter } = useWorkbench()
  const assigned = filtersForPage(savedFilters, page)

  if (!assigned.length) return null

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Filters</span>
      {assigned.map((filter) => {
        const on = activeFilterIds.includes(filter.id)
        return (
          <button
            key={filter.id}
            type="button"
            title={filter.description || scopeLabel(filter)}
            onClick={() => toggleFilter(filter.id)}
            className={`rounded border px-2.5 py-1 text-xs ${
              on
                ? 'border-brand-500 bg-brand-50 font-medium text-brand-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-400'
            }`}
          >
            {filter.name}
            <span className={`ml-1.5 ${on ? 'text-brand-500' : 'text-slate-400'}`}>{scopeLabel(filter)}</span>
          </button>
        )
      })}
      {activeFilterIds.some((id) => assigned.some((filter) => filter.id === id)) && (
        <span className="text-[11px] text-slate-400">ON filters apply to this page</span>
      )}
    </div>
  )
}
