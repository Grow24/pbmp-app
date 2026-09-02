import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { Field, PageHead, TextArea, TextInput } from '../ui'
import type { SettingRow } from '../../types'

export function GeneralPage({ onMessage }: { onMessage: (text: string) => void }) {
  const [rows, setRows] = useState<SettingRow[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.settings().then((data) => {
      setRows(data)
      setValues(Object.fromEntries(data.map((row) => [row.setting_key, row.setting_value])))
    })
  }, [])

  const groups = useMemo(() => {
    const map = new Map<string, SettingRow[]>()
    for (const row of rows) {
      const list = map.get(row.group_name) || []
      list.push(row)
      map.set(row.group_name, list)
    }
    return [...map.entries()]
  }, [rows])

  const titles: Record<string, string> = {
    header: 'Header / brand',
    footer: 'Footer',
    general: 'Workbench defaults',
  }

  return (
    <form
      className="max-w-3xl space-y-4"
      onSubmit={async (event) => {
        event.preventDefault()
        setSaving(true)
        try {
          await api.saveSettings(values)
          onMessage('General settings saved.')
        } finally {
          setSaving(false)
        }
      }}
    >
      <PageHead title="General" subtitle="Brand, user, footer, default menu and chat welcome — yeh sab workbench header/footer par dikhte hain." />
      {groups.map(([group, items]) => (
        <section key={group} className="ui-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">{titles[group] || group}</h2>
          <div className="grid gap-3">
            {items.map((item) => (
              <Field key={item.setting_key} label={item.label}>
                {item.input_type === 'textarea' ? (
                  <TextArea
                    rows={3}
                    value={values[item.setting_key] || ''}
                    onChange={(event) => setValues((prev) => ({ ...prev, [item.setting_key]: event.target.value }))}
                  />
                ) : (
                  <TextInput
                    value={values[item.setting_key] || ''}
                    onChange={(event) => setValues((prev) => ({ ...prev, [item.setting_key]: event.target.value }))}
                  />
                )}
              </Field>
            ))}
          </div>
        </section>
      ))}
      <button type="submit" className="ui-btn-primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save general settings'}
      </button>
    </form>
  )
}
