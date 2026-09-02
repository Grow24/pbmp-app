import { useMemo, useState } from 'react'
import { useWorkbench } from '../../../context/WorkbenchContext'
import { api } from '../../../lib/api'
import {
  FILTER_GROUPS,
  FILTER_PAGES,
  FilterBuilder,
  SHARED_FILTER_FIELDS,
  emptyQuery,
  scopeLabel,
  type FilterQuery,
  type FilterScope,
  type SavedFilter,
} from '../../filter'

const emptyForm = {
  name: '',
  description: '',
  scope: 'global' as FilterScope,
  groupKey: 'workspace',
  pageKeys: ['dashboard'] as string[],
  query: emptyQuery(SHARED_FILTER_FIELDS),
}

export function FilterView() {
  const { savedFilters, reload } = useWorkbench()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadFilter = (filter: SavedFilter) => {
    setEditingId(filter.id)
    setForm({
      name: filter.name,
      description: filter.description,
      scope: filter.scope,
      groupKey: filter.groupKey || 'workspace',
      pageKeys: filter.pageKeys.length ? filter.pageKeys : ['dashboard'],
      query: filter.query.conditions.length ? filter.query : emptyQuery(SHARED_FILTER_FIELDS),
    })
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const save = async () => {
    if (!form.name.trim()) {
      setMessage('Give the filter a name.')
      return
    }
    setSaving(true)
    try {
      await api.saveFilter(
        {
          name: form.name.trim(),
          description: form.description,
          scope: form.scope,
          groupKey: form.scope === 'group' ? form.groupKey : null,
          pageKeys: form.scope === 'pages' ? form.pageKeys : [],
          combinator: form.query.combinator,
          conditions: form.query.conditions,
        },
        editingId ?? undefined,
      )
      await reload()
      setMessage(editingId ? 'Filter updated. Other pages will pick it up.' : 'Filter created. Toggle it on assigned pages.')
      resetForm()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save filter')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    await api.deleteFilter(id)
    await reload()
    if (editingId === id) resetForm()
    setMessage('Filter removed.')
  }

  const togglePage = (key: string) => {
    setForm((prev) => ({
      ...prev,
      pageKeys: prev.pageKeys.includes(key)
        ? prev.pageKeys.filter((item) => item !== key)
        : [...prev.pageKeys, key],
    }))
  }

  const grouped = useMemo(() => {
    const map = new Map<string, SavedFilter[]>()
    for (const filter of savedFilters) {
      const key = filter.scope === 'global' ? 'global' : filter.scope === 'group' ? `group:${filter.groupKey}` : 'pages'
      const list = map.get(key) || []
      list.push(filter)
      map.set(key, list)
    }
    return [...map.entries()]
  }, [savedFilters])

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Filter manager</h2>
        <p className="mt-1 text-[13px] text-slate-500">
          Create a filter once, then assign it to all pages, a page group (Workspace / Report manager / Studio), or
          specific pages like Dashboard manager. Assigned pages show it as a toggle chip.
        </p>
        {message && <p className="mt-2 text-xs text-brand-600">{message}</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-3">
          <div className="ui-card p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-slate-600">Filter name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="h-9 w-full rounded border border-slate-200 px-3 text-[13px] outline-none focus:border-brand-500"
                  placeholder="e.g. Draft work"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-slate-600">Description</span>
                <input
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="h-9 w-full rounded border border-slate-200 px-3 text-[13px] outline-none focus:border-brand-500"
                  placeholder="When should teams use this?"
                />
              </label>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-xs font-medium text-slate-600">Apply this filter on</div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['global', 'All pages'],
                    ['group', 'Page group'],
                    ['pages', 'Selected pages'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, scope: value }))}
                    className={`rounded border px-2.5 py-1.5 text-xs ${
                      form.scope === value
                        ? 'border-brand-500 bg-brand-50 font-medium text-brand-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {form.scope === 'group' && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {FILTER_GROUPS.map((group) => (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, groupKey: group.key }))}
                    className={`rounded border p-3 text-left ${
                      form.groupKey === group.key ? 'border-brand-500 bg-brand-50' : 'border-slate-200'
                    }`}
                  >
                    <div className="text-[13px] font-medium text-slate-800">{group.label}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{group.hint}</div>
                  </button>
                ))}
              </div>
            )}

            {form.scope === 'pages' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {FILTER_PAGES.filter((page) => page.key !== 'filter').map((page) => (
                  <button
                    key={page.key}
                    type="button"
                    onClick={() => togglePage(page.key)}
                    className={`rounded border px-2.5 py-1.5 text-xs ${
                      form.pageKeys.includes(page.key)
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {page.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <FilterBuilder
            title="Conditions"
            fields={SHARED_FILTER_FIELDS}
            value={form.query}
            onChange={(query: FilterQuery) => setForm((prev) => ({ ...prev, query }))}
            showApply={false}
          />

          <div className="flex gap-2">
            <button type="button" className="ui-btn-primary" disabled={saving} onClick={() => void save()}>
              {saving ? 'Saving…' : editingId ? 'Update filter' : 'Save filter'}
            </button>
            {editingId && (
              <button type="button" className="ui-btn" onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
        </div>

        <article className="ui-card overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-[13px] font-medium text-slate-900">Saved filters</h3>
            <p className="text-[11px] text-slate-400">Turn these on from the filter bar on each assigned page.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {savedFilters.length === 0 && (
              <p className="px-4 py-6 text-sm text-slate-400">No saved filters yet.</p>
            )}
            {grouped.map(([key, list]) => (
              <div key={key} className="px-4 py-3">
                <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {scopeLabel(list[0])}
                </div>
                <div className="space-y-2">
                  {list.map((filter) => (
                    <div key={filter.id} className="flex items-start justify-between gap-2 rounded border border-slate-200 px-3 py-2">
                      <div>
                        <div className="text-[13px] font-medium text-slate-800">{filter.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {filter.description || `${filter.query.conditions.length} condition(s)`}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button type="button" className="ui-btn h-7 px-2 text-[11px]" onClick={() => loadFilter(filter)}>
                          Edit
                        </button>
                        <button type="button" className="ui-btn h-7 px-2 text-[11px]" onClick={() => void remove(filter.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  )
}
