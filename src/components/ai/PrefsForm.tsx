import { useEffect, useState } from 'react'
import { applyTheme, EVENT_OPTIONS, LAYOUT_OPTIONS, THEME_OPTIONS } from '../../ai/prefs'
import type { AiPrefs } from '../../ai/types'
import { useAi } from '../../context/AiContext'

export function PrefsForm({ compact = false }: { compact?: boolean }) {
  const { prefs, savePrefs, status, runWorkspaceEvent } = useAi()
  const [draft, setDraft] = useState<AiPrefs>(prefs)
  const [saved, setSaved] = useState('')
  const [eventNote, setEventNote] = useState('')

  useEffect(() => {
    setDraft(prefs)
  }, [prefs])

  useEffect(() => {
    applyTheme(draft.theme)
  }, [draft.theme])

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        void savePrefs(draft).then(() => {
          setSaved('Preferences saved.')
          window.setTimeout(() => setSaved(''), 2000)
        })
      }}
    >
      <p className={`text-[12px] text-slate-500 ${compact ? '' : ''}`}>
        These stay with this user. Theme and layout apply immediately after Save. Events fire on workspace open, or now via Trigger.
        {status?.configured ? ` Model: ${status.model}.` : ' Local assistant until AI_API_KEY is set.'}
      </p>

      <Section title="Appearance">
        <Select
          label="Theme"
          value={draft.theme}
          options={THEME_OPTIONS}
          onChange={(theme) => setDraft((p) => ({ ...p, theme }))}
        />
        <Toggle label="Compact chat bubbles" checked={draft.compactChat} onChange={(compactChat) => setDraft((p) => ({ ...p, compactChat }))} />
      </Section>

      <Section title="Layout">
        <Select
          label="Canvas widgets"
          value={draft.layout}
          options={LAYOUT_OPTIONS}
          onChange={(layout) => setDraft((p) => ({ ...p, layout }))}
        />
        <p className="text-[11px] leading-relaxed text-slate-500">
          Fixed locks the dashboard KPI order. Movable lets this user drag widgets. Other people still have their own preference.
        </p>
      </Section>

      <Section title="Events">
        <Select
          label="On workspace open"
          value={draft.startupEvent}
          options={EVENT_OPTIONS}
          onChange={(startupEvent) => setDraft((p) => ({ ...p, startupEvent }))}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="ui-btn"
            onClick={() => {
              runWorkspaceEvent(draft.startupEvent)
              setEventNote(draft.startupEvent === 'none' ? 'No event selected.' : 'Event triggered.')
              window.setTimeout(() => setEventNote(''), 2000)
            }}
          >
            Trigger now
          </button>
          {eventNote ? <span className="text-[12px] text-slate-500">{eventNote}</span> : null}
        </div>
      </Section>

      <Section title="Conversation & speech">
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
        <label className="flex items-center justify-between gap-3 border border-slate-200 px-3 py-2 text-[13px]">
          <span className="text-slate-600">Auto-send after speech (ms)</span>
          <input
            type="number"
            min={0}
            step={100}
            value={draft.autoSendMs}
            onChange={(event) => setDraft((p) => ({ ...p, autoSendMs: Number(event.target.value || 0) }))}
            className="h-8 w-28 rounded border border-slate-200 px-2 text-right"
          />
        </label>
        <Select
          label="Week starts"
          value={String(draft.weekStart)}
          options={[
            { value: '1', label: 'Monday' },
            { value: '0', label: 'Sunday' },
          ]}
          onChange={(value) => setDraft((p) => ({ ...p, weekStart: Number(value) }))}
        />
      </Section>

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" className="ui-btn-primary">
          Save
        </button>
        {saved && <span className="text-[12px] text-emerald-600">{saved}</span>}
      </div>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{title}</h4>
      {children}
    </section>
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

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 border border-slate-200 px-3 py-2 text-[13px]">
      <span className="text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-8 max-w-[58%] rounded border border-slate-200 bg-white px-2 text-right text-[13px]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
