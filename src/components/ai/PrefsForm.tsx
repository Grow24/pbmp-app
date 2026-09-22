import { useEffect, useState } from 'react'
import { useAi } from '../../context/AiContext'
import type { AiPrefs } from '../../ai/types'

export function PrefsForm({ compact = false }: { compact?: boolean }) {
  const { prefs, savePrefs, status } = useAi()
  const [draft, setDraft] = useState<AiPrefs>(prefs)
  const [saved, setSaved] = useState('')

  useEffect(() => {
    setDraft(prefs)
  }, [prefs])

  return (
    <form
      className={compact ? 'space-y-2' : 'space-y-2'}
      onSubmit={(event) => {
        event.preventDefault()
        void savePrefs(draft).then(() => {
          setSaved('Preferences saved.')
          window.setTimeout(() => setSaved(''), 2000)
        })
      }}
    >
      <p className="text-[12px] text-slate-500">
        Voice, images, scrolling and clock for this user.
        {status?.configured ? ` Model: ${status.model}.` : ' Local assistant until AI_API_KEY is set.'}
      </p>
      <Toggle label="Auto-scroll chat" checked={draft.autoScroll} onChange={(autoScroll) => setDraft((p) => ({ ...p, autoScroll }))} />
      <Toggle label="Browser speech-to-text" checked={draft.stt} onChange={(stt) => setDraft((p) => ({ ...p, stt }))} />
      <Toggle label="Browser text-to-speech" checked={draft.tts} onChange={(tts) => setDraft((p) => ({ ...p, tts }))} />
      <Toggle label="Auto-play spoken answers" checked={draft.ttsAutoplay} onChange={(ttsAutoplay) => setDraft((p) => ({ ...p, ttsAutoplay }))} />
      <Toggle label="Resize images before upload" checked={draft.imageResize} onChange={(imageResize) => setDraft((p) => ({ ...p, imageResize }))} />
      <Toggle label="Long paste → attached note" checked={draft.longPaste} onChange={(longPaste) => setDraft((p) => ({ ...p, longPaste }))} />
      <Toggle label="24-hour clock" checked={draft.clock24h} onChange={(clock24h) => setDraft((p) => ({ ...p, clock24h }))} />
      <label className="flex items-center justify-between gap-3 border border-slate-200 px-3 py-2 text-[13px]">
        <span className="text-slate-600">Speech language</span>
        <input
          value={draft.speechLang}
          onChange={(event) => setDraft((p) => ({ ...p, speechLang: event.target.value }))}
          className="h-8 w-28 rounded border border-slate-200 px-2 text-right"
        />
      </label>
      <div className="flex items-center gap-3 pt-1">
        <button type="submit" className="ui-btn-primary">
          Save
        </button>
        {saved && <span className="text-[12px] text-emerald-600">{saved}</span>}
      </div>
    </form>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 border border-slate-200 px-3 py-2 text-[13px]">
      <span className="text-slate-600">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  )
}
