import { useEffect, useState } from 'react'
import { OPENAI_TTS_VOICES } from '../../ai/composer'
import { applyTheme, EVENT_OPTIONS, LAYOUT_OPTIONS, SPEECH_LANG_OPTIONS, THEME_OPTIONS, TTS_PROVIDER_OPTIONS } from '../../ai/prefs'
import type { AiPrefs, TtsProvider } from '../../ai/types'
import { listSpeechVoices, speakWithPrefs } from '../../ai/speech'
import { useAi } from '../../context/AiContext'

export function PrefsForm({ compact = false }: { compact?: boolean }) {
  const { prefs, savePrefs, status, runWorkspaceEvent } = useAi()
  const [draft, setDraft] = useState<AiPrefs>(prefs)
  const [saved, setSaved] = useState('')
  const [eventNote, setEventNote] = useState('')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    setDraft(prefs)
  }, [prefs])

  useEffect(() => {
    const load = () => setVoices(listSpeechVoices())
    load()
    window.speechSynthesis?.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load)
  }, [])

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
          Fixed locks the dashboard KPI and artifact order. Movable lets this user drag those widgets. Other people still have their own preference.
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

      <Section title="Speech">
        <Toggle
          label="Voice output"
          checked={draft.tts}
          onChange={(tts) => setDraft((p) => ({ ...p, tts }))}
        />
        <Select
          label="TTS provider"
          value={draft.ttsProvider}
          options={TTS_PROVIDER_OPTIONS}
          onChange={(ttsProvider) => setDraft((p) => ({ ...p, ttsProvider: ttsProvider as TtsProvider }))}
        />
        <p className="text-[11px] leading-relaxed text-slate-500">
          LibreChat-style path: Browser first (fast, no server), then cloud (OpenAI/Azure/ElevenLabs-compatible), then a custom endpoint later for local engines such as Piper, Kokoro, or Chatterbox.
        </p>
        {draft.ttsProvider === 'browser' ? (
          <>
            <Select
              label="Speech language"
              value={draft.speechLang}
              options={
                SPEECH_LANG_OPTIONS.some((item) => item.value === draft.speechLang)
                  ? SPEECH_LANG_OPTIONS
                  : [...SPEECH_LANG_OPTIONS, { value: draft.speechLang, label: draft.speechLang }]
              }
              onChange={(speechLang) => setDraft((p) => ({ ...p, speechLang, speechVoice: '' }))}
            />
            <Select
              label="Browser voice"
              value={draft.speechVoice}
              options={[
                { value: '', label: 'Auto — match speech language' },
                ...voices
                  .filter((voice) => {
                    const prefix = draft.speechLang.slice(0, 2).toLowerCase()
                    return voice.lang.toLowerCase().startsWith(prefix)
                  })
                  .map((voice) => ({
                    value: voice.voiceURI,
                    label: `${voice.name} (${voice.lang})`,
                  })),
              ]}
              onChange={(speechVoice) => setDraft((p) => ({ ...p, speechVoice }))}
            />
          </>
        ) : (
          <Select
            label="Cloud voice"
            value={draft.ttsCloudVoice}
            options={OPENAI_TTS_VOICES.map((voice) => ({ value: voice, label: voice }))}
            onChange={(ttsCloudVoice) => setDraft((p) => ({ ...p, ttsCloudVoice }))}
          />
        )}
        <label className="flex items-center justify-between gap-3 border border-slate-200 px-3 py-2 text-[13px]">
          <span className="text-slate-600">Playback speed</span>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={draft.ttsSpeed}
            onChange={(event) => setDraft((p) => ({ ...p, ttsSpeed: Number(event.target.value) }))}
            className="w-36"
          />
          <span className="w-8 text-right text-[12px] text-slate-500">{draft.ttsSpeed.toFixed(1)}×</span>
        </label>
        <Toggle
          label="Speak the reply after I send with the mic"
          checked={draft.voiceReplyAfterMic}
          onChange={(voiceReplyAfterMic) => setDraft((p) => ({ ...p, voiceReplyAfterMic }))}
        />
        <Toggle
          label="Automatic playback — speak every reply"
          checked={draft.ttsAutoplay}
          onChange={(ttsAutoplay) => setDraft((p) => ({ ...p, ttsAutoplay }))}
        />
        <p className="text-[11px] leading-relaxed text-slate-500">
          Chat box: <span className="font-medium text-slate-700">@</span> who (Agent) · <span className="font-medium text-slate-700">$</span> how
          (Skill) · <span className="font-medium text-slate-700">#</span> what (canvas) · <span className="font-medium text-slate-700">/</span> action
          (`/pie` `/save` `/voice`).
        </p>
        <button
          type="button"
          className="ui-btn"
          onClick={() =>
            void speakWithPrefs('This is the voice that will speak replies after you send a voice message.', draft)
          }
        >
          Preview voice
        </button>
      </Section>

      <Section title="Conversation">
        <Toggle label="Auto-scroll chat" checked={draft.autoScroll} onChange={(autoScroll) => setDraft((p) => ({ ...p, autoScroll }))} />
        <Toggle label="Browser speech-to-text (mic)" checked={draft.stt} onChange={(stt) => setDraft((p) => ({ ...p, stt }))} />
        <Toggle label="Resize images before upload" checked={draft.imageResize} onChange={(imageResize) => setDraft((p) => ({ ...p, imageResize }))} />
        <Toggle label="Long paste → attached note" checked={draft.longPaste} onChange={(longPaste) => setDraft((p) => ({ ...p, longPaste }))} />
        <Toggle label="24-hour clock" checked={draft.clock24h} onChange={(clock24h) => setDraft((p) => ({ ...p, clock24h }))} />
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
