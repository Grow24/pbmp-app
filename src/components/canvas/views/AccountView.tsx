import { useEffect, useState } from 'react'
import { useAi } from '../../../context/AiContext'
import { useWorkbench } from '../../../context/WorkbenchContext'
import type { AiPrefs } from '../../../ai/types'

export function AccountView() {
  const { settings, blocks, filterItems } = useWorkbench()
  const { prefs, savePrefs, status } = useAi()
  const fields = filterItems(blocks('account').filter((item) => item.blockType === 'account_field'))
  const [draft, setDraft] = useState<AiPrefs>(prefs)
  const [saved, setSaved] = useState('')

  useEffect(() => {
    setDraft(prefs)
  }, [prefs])

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="ui-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
            {settings.user_initials || 'PS'}
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">{settings.user_name}</h2>
            <p className="text-[13px] text-slate-500">
              {settings.user_role} · {settings.footer_org}
            </p>
          </div>
        </div>
        <dl className="mt-5 space-y-2 text-[13px]">
          {fields.map((field) => (
            <div key={field.id} className="flex items-center justify-between border border-slate-200 bg-slate-50 px-3 py-2">
              <dt className="text-slate-400">{field.title}</dt>
              <dd className="text-slate-800">{field.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <form
        className="ui-card p-5"
        onSubmit={(event) => {
          event.preventDefault()
          void savePrefs(draft).then(() => {
            setSaved('Conversation preferences saved.')
            window.setTimeout(() => setSaved(''), 2000)
          })
        }}
      >
        <h3 className="text-sm font-semibold text-slate-900">Conversation & speech</h3>
        <p className="mt-1 text-[12px] text-slate-500">
          These settings drive the canvas-side chat: voice, images, scrolling and clock.
          {status?.configured ? ` Model: ${status.model}.` : ' Local assistant is active until AI_API_KEY is set.'}
        </p>
        <div className="mt-4 space-y-2 text-[13px]">
          <Toggle label="Auto-scroll chat" checked={draft.autoScroll} onChange={(autoScroll) => setDraft((p) => ({ ...p, autoScroll }))} />
          <Toggle label="Browser speech-to-text" checked={draft.stt} onChange={(stt) => setDraft((p) => ({ ...p, stt }))} />
          <Toggle label="Browser text-to-speech" checked={draft.tts} onChange={(tts) => setDraft((p) => ({ ...p, tts }))} />
          <Toggle label="Auto-play spoken answers" checked={draft.ttsAutoplay} onChange={(ttsAutoplay) => setDraft((p) => ({ ...p, ttsAutoplay }))} />
          <Toggle label="Resize images before upload" checked={draft.imageResize} onChange={(imageResize) => setDraft((p) => ({ ...p, imageResize }))} />
          <Toggle label="Convert long paste into an attached note" checked={draft.longPaste} onChange={(longPaste) => setDraft((p) => ({ ...p, longPaste }))} />
          <Toggle label="24-hour clock" checked={draft.clock24h} onChange={(clock24h) => setDraft((p) => ({ ...p, clock24h }))} />
          <label className="flex items-center justify-between gap-3 border border-slate-200 px-3 py-2">
            <span className="text-slate-600">Speech language</span>
            <input
              value={draft.speechLang}
              onChange={(event) => setDraft((p) => ({ ...p, speechLang: event.target.value }))}
              className="h-8 w-32 rounded border border-slate-200 px-2 text-right"
            />
          </label>
          <label className="flex items-center justify-between gap-3 border border-slate-200 px-3 py-2">
            <span className="text-slate-600">Auto-send after speech (ms)</span>
            <input
              type="number"
              min={0}
              value={draft.autoSendMs}
              onChange={(event) => setDraft((p) => ({ ...p, autoSendMs: Number(event.target.value) }))}
              className="h-8 w-24 rounded border border-slate-200 px-2 text-right"
            />
          </label>
          <label className="flex items-center justify-between gap-3 border border-slate-200 px-3 py-2">
            <span className="text-slate-600">Week starts</span>
            <select
              value={draft.weekStart}
              onChange={(event) => setDraft((p) => ({ ...p, weekStart: Number(event.target.value) }))}
              className="h-8 rounded border border-slate-200 px-2"
            >
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" className="ui-btn-primary">
            Save AI preferences
          </button>
          {saved && <span className="text-[12px] text-emerald-600">{saved}</span>}
        </div>
      </form>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 border border-slate-200 px-3 py-2">
      <span className="text-slate-600">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  )
}