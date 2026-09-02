import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { VIEW_KINDS, VIEW_LABELS, slugify } from '../constants'
import { Field, PageHead, Select, TextInput } from '../ui'
import type { DbItem, DbSubtab, DbTab } from '../../types'

export function TabsPage({ onMessage }: { onMessage: (text: string) => void }) {
  const [items, setItems] = useState<DbItem[]>([])
  const [itemId, setItemId] = useState<number | ''>('')
  const [tabs, setTabs] = useState<DbTab[]>([])
  const [subtabs, setSubtabs] = useState<DbSubtab[]>([])
  const [tabForm, setTabForm] = useState({ slug: '', label: '', view_kind: 'assess' })
  const [subForm, setSubForm] = useState({ slug: '', label: '', view_kind: 'assess', tab_id: 0 })
  const [editingTab, setEditingTab] = useState<DbTab | null>(null)

  const load = async (id = itemId) => {
    const nextItems = (await api.items()).filter((item) => item.canvas_title)
    setItems(nextItems)
    if (!id) return
    const [nextTabs, allSubs] = await Promise.all([api.tabs(Number(id)), api.subtabs()])
    setTabs(nextTabs)
    setSubtabs(allSubs.filter((sub) => nextTabs.some((tab) => tab.id === sub.tab_id)))
    setSubForm((prev) => ({ ...prev, tab_id: prev.tab_id || nextTabs[0]?.id || 0 }))
  }

  useEffect(() => {
    api.items().then((rows) => {
      const usable = rows.filter((item) => item.canvas_title)
      setItems(usable)
      if (usable[0]) {
        setItemId(usable[0].id)
        load(usable[0].id)
      }
    })
  }, [])

  return (
    <div className="max-w-5xl space-y-4">
      <PageHead
        title="Canvas tabs"
        subtitle="Har menu item ke canvas par kaunse tabs aur sub-tabs dikhenge, yahan set karo."
      />

      <section className="ui-card p-5">
        <Field label="Menu item">
          <Select
            className="max-w-md"
            value={itemId}
            onChange={(event) => {
              const id = Number(event.target.value)
              setItemId(id)
              load(id)
            }}
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
      </section>

      <section className="ui-card p-5">
        <h2 className="text-sm font-semibold text-slate-800">Primary tabs</h2>
        <div className="mt-3 space-y-2">
          {tabs.map((tab) => (
            <div key={tab.id} className="flex flex-wrap items-center gap-2 rounded border border-slate-200 px-3 py-2">
              {editingTab?.id === tab.id ? (
                <>
                  <TextInput
                    className="max-w-xs"
                    value={editingTab.label}
                    onChange={(event) => setEditingTab({ ...editingTab, label: event.target.value })}
                  />
                  <Select
                    className="max-w-xs"
                    value={editingTab.view_kind}
                    onChange={(event) => setEditingTab({ ...editingTab, view_kind: event.target.value })}
                  >
                    {VIEW_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {VIEW_LABELS[kind]}
                      </option>
                    ))}
                  </Select>
                  <button
                    type="button"
                    className="ui-btn-primary"
                    onClick={async () => {
                      await api.saveTab(editingTab, editingTab.id)
                      setEditingTab(null)
                      await load()
                      onMessage('Tab updated.')
                    }}
                  >
                    Save
                  </button>
                  <button type="button" className="ui-btn" onClick={() => setEditingTab(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="min-w-32 text-[13px] font-medium text-slate-800">{tab.label}</span>
                  <span className="text-xs text-slate-400">{VIEW_LABELS[tab.view_kind] || tab.view_kind}</span>
                  <button type="button" className="ui-btn ml-auto" onClick={() => setEditingTab(tab)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ui-btn"
                    onClick={async () => {
                      if (!confirm(`Delete tab “${tab.label}”?`)) return
                      await api.deleteTab(tab.id)
                      await load()
                      onMessage('Tab deleted.')
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <TextInput
            placeholder="Tab name"
            value={tabForm.label}
            onChange={(event) => setTabForm((prev) => ({ ...prev, label: event.target.value, slug: slugify(event.target.value) }))}
          />
          <Select value={tabForm.view_kind} onChange={(event) => setTabForm((prev) => ({ ...prev, view_kind: event.target.value }))}>
            {VIEW_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {VIEW_LABELS[kind]}
              </option>
            ))}
          </Select>
          <button
            type="button"
            className="ui-btn-primary"
            onClick={async () => {
              if (!itemId || !tabForm.label.trim()) return
              await api.saveTab({ ...tabForm, slug: tabForm.slug || slugify(tabForm.label), menu_item_id: Number(itemId), sort_order: tabs.length + 1 })
              setTabForm({ slug: '', label: '', view_kind: 'assess' })
              await load()
              onMessage('Tab added.')
            }}
          >
            Add tab
          </button>
        </div>
      </section>

      <section className="ui-card p-5">
        <h2 className="text-sm font-semibold text-slate-800">Sub tabs</h2>
        <div className="mt-3 space-y-2">
          {subtabs.map((sub) => (
            <div key={sub.id} className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 text-[13px]">
              <span className="font-medium text-slate-800">{sub.label}</span>
              <span className="text-xs text-slate-400">
                {tabs.find((tab) => tab.id === sub.tab_id)?.label} · {VIEW_LABELS[sub.view_kind] || sub.view_kind}
              </span>
              <button
                type="button"
                className="ui-btn ml-auto"
                onClick={async () => {
                  if (!confirm(`Delete sub tab “${sub.label}”?`)) return
                  await api.deleteSubtab(sub.id)
                  await load()
                  onMessage('Sub tab deleted.')
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-4">
          <Select value={subForm.tab_id} onChange={(event) => setSubForm((prev) => ({ ...prev, tab_id: Number(event.target.value) }))}>
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </Select>
          <TextInput
            placeholder="Sub tab name"
            value={subForm.label}
            onChange={(event) => setSubForm((prev) => ({ ...prev, label: event.target.value, slug: slugify(event.target.value) }))}
          />
          <Select value={subForm.view_kind} onChange={(event) => setSubForm((prev) => ({ ...prev, view_kind: event.target.value }))}>
            {VIEW_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {VIEW_LABELS[kind]}
              </option>
            ))}
          </Select>
          <button
            type="button"
            className="ui-btn-primary"
            onClick={async () => {
              if (!subForm.tab_id || !subForm.label.trim()) return
              await api.saveSubtab({ ...subForm, slug: subForm.slug || slugify(subForm.label), sort_order: subtabs.length + 1 })
              setSubForm((prev) => ({ ...prev, slug: '', label: '' }))
              await load()
              onMessage('Sub tab added.')
            }}
          >
            Add sub tab
          </button>
        </div>
      </section>
    </div>
  )
}
