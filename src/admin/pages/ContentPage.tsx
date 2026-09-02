import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { BLOCK_META, VIEW_LABELS, blocksForView } from '../constants'
import { Field, PageHead, Select, TextArea, TextInput } from '../ui'
import type { DbContent, DbItem } from '../../types'

type FormState = {
  block_type: string
  title: string
  subtitle: string
  body: string
  value_text: string
  extra_json: Record<string, unknown>
  sort_order: number
}

function emptyForm(blockType: string): FormState {
  return { block_type: blockType, title: '', subtitle: '', body: '', value_text: '', extra_json: {}, sort_order: 0 }
}

function readField(form: FormState, key: string): string {
  if (key.startsWith('extra.')) {
    const extraKey = key.slice(6)
    const value = form.extra_json?.[extraKey]
    if (Array.isArray(value)) return value.join('\n')
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    return value == null ? '' : String(value)
  }
  return String((form as Record<string, unknown>)[key] ?? '')
}

function writeField(form: FormState, key: string, raw: string): FormState {
  if (key.startsWith('extra.')) {
    const extraKey = key.slice(6)
    let next: unknown = raw
    if (extraKey === 'items') next = raw.split('\n').map((line) => line.trim()).filter(Boolean)
    if (extraKey === 'primary') next = raw === 'true'
    if (extraKey === 'x' || extraKey === 'y') next = Number(raw || 0)
    return { ...form, extra_json: { ...form.extra_json, [extraKey]: next } }
  }
  return { ...form, [key]: raw } as FormState
}

export function ContentPage({ onMessage }: { onMessage: (text: string) => void }) {
  const [items, setItems] = useState<DbItem[]>([])
  const [itemId, setItemId] = useState<number | 'null'>('null')
  const [viewKind, setViewKind] = useState('highlight')
  const [rows, setRows] = useState<DbContent[]>([])
  const [form, setForm] = useState<FormState>(emptyForm('highlight'))
  const [editing, setEditing] = useState<number | null>(null)

  const availableBlocks = useMemo(() => blocksForView(viewKind), [viewKind])

  const load = async (id = itemId, kind = viewKind) => {
    setRows(await api.content(id, kind))
  }

  useEffect(() => {
    api.items().then(setItems)
    load()
  }, [])

  const startNew = (type = availableBlocks[0]?.type || 'highlight') => {
    setEditing(null)
    setForm(emptyForm(type))
  }

  return (
    <div className="space-y-4">
      <PageHead
        title="Page content"
        subtitle="Jo cards, KPIs, SWOT points, inquiry Q&A workbench par dikhte hain — yahan add/edit/delete karo."
      />

      <section className="ui-card grid gap-3 p-5 md:grid-cols-2">
        <Field label="Menu item">
          <Select
            value={String(itemId)}
            onChange={(event) => {
              const value = event.target.value === 'null' ? 'null' : Number(event.target.value)
              setItemId(value)
              const nextKind = value === 'null' ? 'highlight' : viewKind === 'highlight' ? 'dashboard' : viewKind
              setViewKind(nextKind)
              startNew(blocksForView(nextKind)[0]?.type)
              load(value, nextKind)
            }}
          >
            <option value="null">Global highlights</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Page / view">
          <Select
            value={viewKind}
            onChange={(event) => {
              const next = event.target.value
              setViewKind(next)
              startNew(blocksForView(next)[0]?.type)
              load(itemId, next)
            }}
          >
            {Object.entries(VIEW_LABELS).map(([kind, label]) => (
              <option key={kind} value={kind}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="ui-card overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
            Current blocks ({rows.length})
          </div>
          <div className="max-h-[560px] overflow-auto">
            {rows.length === 0 && <p className="px-4 py-6 text-[13px] text-slate-400">Is view par abhi koi content nahi hai.</p>}
            {rows.map((row) => (
              <div key={row.id} className="flex items-start gap-2 border-b border-slate-100 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {BLOCK_META[row.block_type]?.label || row.block_type}
                  </div>
                  <div className="truncate text-[13px] text-slate-800">{row.title || row.body || row.value_text}</div>
                </div>
                <button
                  type="button"
                  className="ui-btn h-7 px-2"
                  onClick={() => {
                    setEditing(row.id)
                    setForm({
                      block_type: row.block_type,
                      title: row.title || '',
                      subtitle: row.subtitle || '',
                      body: row.body || '',
                      value_text: row.value_text || '',
                      extra_json: row.extra_json || {},
                      sort_order: row.sort_order,
                    })
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="ui-btn h-7 px-2"
                  onClick={async () => {
                    if (!confirm('Delete this block?')) return
                    await api.deleteContent(row.id)
                    await load()
                    onMessage('Content deleted.')
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="ui-card p-5">
          <h2 className="text-sm font-semibold text-slate-800">{editing ? 'Edit block' : 'Add block'}</h2>
          <div className="mt-3 grid gap-3">
            <Field label="Block type">
              <Select
                value={form.block_type}
                onChange={(event) => setForm((prev) => ({ ...prev, block_type: event.target.value }))}
              >
                {availableBlocks.map((block) => (
                  <option key={block.type} value={block.type}>
                    {block.label}
                  </option>
                ))}
              </Select>
            </Field>
            {(BLOCK_META[form.block_type]?.fields || []).map((field) => {
              const value = readField(form, field.key)
              const onChange = (raw: string) => setForm((prev) => writeField(prev, field.key, raw))
              if (field.type === 'textarea') {
                return (
                  <Field key={field.key} label={field.label} hint={field.hint}>
                    <TextArea rows={4} value={value} onChange={(event) => onChange(event.target.value)} />
                  </Field>
                )
              }
              if (field.type === 'select') {
                return (
                  <Field key={field.key} label={field.label} hint={field.hint}>
                    <Select value={value} onChange={(event) => onChange(event.target.value)}>
                      {(field.options || []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )
              }
              return (
                <Field key={field.key} label={field.label} hint={field.hint}>
                  <TextInput type={field.type === 'number' ? 'number' : 'text'} value={value} onChange={(event) => onChange(event.target.value)} />
                </Field>
              )
            })}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="ui-btn-primary"
                onClick={async () => {
                  await api.saveContent(
                    {
                      ...form,
                      menu_item_id: itemId === 'null' ? null : Number(itemId),
                      view_kind: viewKind,
                      sort_order: form.sort_order || rows.length + 1,
                    },
                    editing ?? undefined,
                  )
                  startNew(form.block_type)
                  await load()
                  onMessage('Content saved.')
                }}
              >
                {editing ? 'Update block' : 'Add block'}
              </button>
              {editing && (
                <button type="button" className="ui-btn" onClick={() => startNew(form.block_type)}>
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
