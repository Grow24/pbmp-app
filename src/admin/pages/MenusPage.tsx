import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { iconKeys } from '../../icons'
import { slugify } from '../constants'
import { Field, PageHead, Select, TextArea, TextInput } from '../ui'
import type { DbItem, DbSection } from '../../types'

const emptyItem = (sectionId = 0): Partial<DbItem> => ({
  slug: '',
  label: '',
  icon: 'dashboard',
  sort_order: 0,
  section_id: sectionId,
  parent_id: null,
  canvas_title: '',
  canvas_eyebrow: '',
  canvas_description: '',
})

export function MenusPage({ onMessage }: { onMessage: (text: string) => void }) {
  const [sections, setSections] = useState<DbSection[]>([])
  const [items, setItems] = useState<DbItem[]>([])
  const [sectionLabel, setSectionLabel] = useState('')
  const [form, setForm] = useState<Partial<DbItem>>(emptyItem())
  const [editing, setEditing] = useState<number | null>(null)

  const load = async () => {
    const [nextSections, nextItems] = await Promise.all([api.sections(), api.items()])
    setSections(nextSections)
    setItems(nextItems)
    setForm((prev) => ({ ...prev, section_id: prev.section_id || nextSections[0]?.id }))
  }

  useEffect(() => {
    load().catch((error: Error) => onMessage(error.message))
  }, [])

  const childrenOf = (parentId: number | null, sectionId: number) =>
    items.filter((item) => item.section_id === sectionId && item.parent_id === parentId)

  return (
    <div className="space-y-4">
      <PageHead
        title="Menus"
        subtitle="Left sidebar yahan se banti hai. Section add karo, phir uske andar menu / sub-menu items."
      />

      <section className="ui-card p-5">
        <h2 className="text-sm font-semibold text-slate-800">Sections</h2>
        <div className="mt-3 space-y-2">
          {sections.map((section) => (
            <div key={section.id} className="flex flex-wrap items-center gap-2 rounded border border-slate-200 px-3 py-2">
              <TextInput
                className="max-w-xs"
                value={section.label}
                onChange={(event) =>
                  setSections((prev) => prev.map((row) => (row.id === section.id ? { ...row, label: event.target.value } : row)))
                }
              />
              <TextInput
                type="number"
                className="w-20"
                value={section.sort_order}
                onChange={(event) =>
                  setSections((prev) =>
                    prev.map((row) => (row.id === section.id ? { ...row, sort_order: Number(event.target.value) } : row)),
                  )
                }
              />
              <button
                type="button"
                className="ui-btn"
                onClick={async () => {
                  await api.saveSection(section, section.id)
                  onMessage('Section saved.')
                }}
              >
                Save
              </button>
              <button
                type="button"
                className="ui-btn"
                onClick={async () => {
                  if (!confirm(`Delete section “${section.label}” and its menus?`)) return
                  await api.deleteSection(section.id)
                  await load()
                  onMessage('Section deleted.')
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex max-w-md gap-2">
          <TextInput
            placeholder="New section name"
            value={sectionLabel}
            onChange={(event) => setSectionLabel(event.target.value)}
          />
          <button
            type="button"
            className="ui-btn-primary shrink-0"
            onClick={async () => {
              if (!sectionLabel.trim()) return
              await api.saveSection({ label: sectionLabel, slug: slugify(sectionLabel), sort_order: sections.length + 1 })
              setSectionLabel('')
              await load()
              onMessage('Section added.')
            }}
          >
            Add section
          </button>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="ui-card p-5">
          <h2 className="text-sm font-semibold text-slate-800">Menu tree</h2>
          <div className="mt-3 space-y-4">
            {sections.map((section) => (
              <div key={section.id}>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{section.label}</div>
                {childrenOf(null, section.id).map((item) => (
                  <div key={item.id}>
                    <MenuRow
                      item={item}
                      onEdit={() => {
                        setEditing(item.id)
                        setForm(item)
                      }}
                      onDelete={async () => {
                        if (!confirm(`Delete “${item.label}”?`)) return
                        await api.deleteItem(item.id)
                        await load()
                        onMessage('Menu item deleted.')
                      }}
                    />
                    <div className="ml-6 border-l border-slate-200">
                      {childrenOf(item.id, section.id).map((child) => (
                        <MenuRow
                          key={child.id}
                          item={child}
                          nested
                          onEdit={() => {
                            setEditing(child.id)
                            setForm(child)
                          }}
                          onDelete={async () => {
                            if (!confirm(`Delete “${child.label}”?`)) return
                            await api.deleteItem(child.id)
                            await load()
                            onMessage('Menu item deleted.')
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="ui-card p-5">
          <h2 className="text-sm font-semibold text-slate-800">{editing ? 'Edit menu item' : 'Add menu item'}</h2>
          <div className="mt-3 grid gap-3">
            <Field label="Name">
              <TextInput
                value={form.label || ''}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    label: event.target.value,
                    slug: editing ? prev.slug : slugify(event.target.value),
                  }))
                }
              />
            </Field>
            <Field label="Section">
              <Select
                value={form.section_id || ''}
                onChange={(event) => setForm((prev) => ({ ...prev, section_id: Number(event.target.value) }))}
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Parent menu" hint="Sub-level ke liye parent select karo. Top-level ke liye empty chhodo.">
              <Select
                value={form.parent_id || ''}
                onChange={(event) => setForm((prev) => ({ ...prev, parent_id: event.target.value ? Number(event.target.value) : null }))}
              >
                <option value="">No parent (top level)</option>
                {items
                  .filter((item) => item.id !== editing)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Icon">
              <Select value={form.icon || 'dashboard'} onChange={(event) => setForm((prev) => ({ ...prev, icon: event.target.value }))}>
                {iconKeys.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Canvas title" hint="Click par beech wale canvas ka heading.">
              <TextInput value={form.canvas_title || ''} onChange={(event) => setForm((prev) => ({ ...prev, canvas_title: event.target.value }))} />
            </Field>
            <Field label="Canvas eyebrow">
              <TextInput value={form.canvas_eyebrow || ''} onChange={(event) => setForm((prev) => ({ ...prev, canvas_eyebrow: event.target.value }))} />
            </Field>
            <Field label="Canvas description">
              <TextArea rows={3} value={form.canvas_description || ''} onChange={(event) => setForm((prev) => ({ ...prev, canvas_description: event.target.value }))} />
            </Field>
            <div className="flex gap-2">
              <button
                type="button"
                className="ui-btn-primary"
                onClick={async () => {
                  await api.saveItem({ ...form, slug: form.slug || slugify(form.label || 'item') }, editing ?? undefined)
                  setEditing(null)
                  setForm(emptyItem(sections[0]?.id))
                  await load()
                  onMessage('Menu item saved.')
                }}
              >
                {editing ? 'Update menu' : 'Add menu'}
              </button>
              {editing && (
                <button
                  type="button"
                  className="ui-btn"
                  onClick={() => {
                    setEditing(null)
                    setForm(emptyItem(sections[0]?.id))
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function MenuRow({
  item,
  nested,
  onEdit,
  onDelete,
}: {
  item: DbItem
  nested?: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 ${nested ? 'pl-3' : ''}`}>
      <span className="min-w-0 flex-1 truncate text-[13px] text-slate-800">{item.label}</span>
      <span className="hidden text-[11px] text-slate-400 sm:inline">{item.canvas_title || 'folder'}</span>
      <button type="button" className="ui-btn h-7 px-2" onClick={onEdit}>
        Edit
      </button>
      <button type="button" className="ui-btn h-7 px-2" onClick={onDelete}>
        Delete
      </button>
    </div>
  )
}
