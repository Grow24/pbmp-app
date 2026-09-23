import { Copy, GitFork, ImagePlus, Mic, MicOff, Pin, Plus, RefreshCw, Send, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type ReactNode } from 'react'
import { beginImageAttach, type DraftImage } from '../../ai/images'
import { MarkdownView } from '../../ai/markdown'
import { speakText, startBrowserStt, stopSpeaking } from '../../ai/speech'
import { useAi } from '../../context/AiContext'
import { useWorkbench } from '../../context/WorkbenchContext'

export function ChatPane() {
  const { canvas, settings } = useWorkbench()
  const {
    status,
    prefs,
    project,
    conversation,
    messages,
    streaming,
    error,
    quote,
    setQuote,
    newChat,
    keepChat,
    discardTemp,
    pinConversation,
    forkConversation,
    sendMessage,
    binding,
    agents,
    agentSlug,
    setAgent,
    team,
  } = useAi()
  const [draft, setDraft] = useState('')
  const [image, setImage] = useState<DraftImage | null>(null)
  const [listening, setListening] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [mentionOpen, setMentionOpen] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const recRef = useRef<{ stop: () => void } | null>(null)
  const sendTimer = useRef<number>(0)

  const visible = messages.length
    ? messages
    : settings.chat_welcome
      ? [{ id: 'welcome', role: 'assistant' as const, text: settings.chat_welcome }]
      : []

  useEffect(() => {
    if (!prefs.autoScroll) return
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streaming, prefs.autoScroll])

  const imageRef = useRef<DraftImage | null>(null)
  imageRef.current = image
  useEffect(() => () => {
    imageRef.current?.revoke()
  }, [])

  useEffect(() => {
    const last = messages[messages.length - 1]
    if (prefs.ttsAutoplay && prefs.tts && last?.role === 'assistant' && !streaming && last.text) {
      speakText(last.text, prefs.speechLang)
    }
  }, [messages, prefs.speechLang, prefs.tts, prefs.ttsAutoplay, streaming])

  const clearImage = () => {
    image?.revoke()
    setImage(null)
  }

  const attachFile = (file: File) => {
    image?.revoke()
    const next = beginImageAttach(file, prefs.imageResize)
    setImage(next)
    void next.ready.then((dataUrl) => {
      setImage((prev) => (prev?.previewUrl === next.previewUrl ? { ...prev, dataUrl } : prev))
    })
  }

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    const text = draft.trim()
    if (!text && !image) return
    const pending = image
    const replaceId = editId
    setDraft('')
    setEditId(null)
    void (async () => {
      const dataUrl = pending ? pending.dataUrl || (await pending.ready) : ''
      await sendMessage(text, pending ? { name: pending.name, dataUrl } : undefined, replaceId || undefined)
      pending?.revoke()
      setImage((prev) => (prev?.previewUrl === pending?.previewUrl ? null : prev))
    })()
  }

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const file = [...event.clipboardData.files].find((item) => item.type.startsWith('image/'))
    if (file) {
      event.preventDefault()
      attachFile(file)
      return
    }
    const text = event.clipboardData.getData('text')
    if (prefs.longPaste && text.length > 1200) {
      event.preventDefault()
      setDraft((prev) => `${prev}${prev ? '\n\n' : ''}[Attached note — ${text.length} chars]\n${text}`)
    }
  }

  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop()
      recRef.current = null
      setListening(false)
      return
    }
    if (!prefs.stt) return
    const rec = startBrowserStt({
      lang: prefs.speechLang,
      onText: (text, final) => {
        setDraft(text)
        window.clearTimeout(sendTimer.current)
        if (final && prefs.autoSendMs > 0) {
          sendTimer.current = window.setTimeout(() => {
            const pending = image
            void (async () => {
              const dataUrl = pending ? pending.dataUrl || (await pending.ready) : ''
              await sendMessage(text, pending ? { name: pending.name, dataUrl } : undefined)
              pending?.revoke()
            })()
            setDraft('')
            setImage(null)
          }, prefs.autoSendMs)
        }
      },
      onEnd: () => {
        setListening(false)
        recRef.current = null
      },
    })
    recRef.current = rec
    setListening(Boolean(rec))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] text-slate-400">{binding || `${project?.name || 'No project'} · ${canvas?.title || 'Canvas'}`}</p>
          <p className="truncate text-[12px] font-medium text-slate-700">
            {conversation?.title || 'New conversation for this tab'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="ui-btn h-7 px-2 text-[11px]"
            onClick={() => void newChat(false)}
            title="Start a new saved chat. The previous saved chats stay in Projects."
          >
            <Plus className="h-3 w-3" />
            New
          </button>
          <button
            type="button"
            className={`ui-btn h-7 px-2 text-[11px] ${conversation?.temporary ? 'border-amber-400 text-amber-800' : ''}`}
            onClick={() => void newChat(true)}
            title="Scratch chat. Not saved, and it does not replace this tab's saved history."
          >
            Don't save
          </button>
          <button type="button" className="ui-btn h-7 px-2 text-[11px]" onClick={() => void pinConversation()} title="Pin this saved chat">
            <Pin className={`h-3 w-3 ${conversation?.pinned ? 'text-brand-600' : ''}`} />
          </button>
        </div>
      </div>

      {conversation?.temporary ? (
        <div className="border-b border-amber-100 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
          <p className="font-medium">Not saved — scratch chat</p>
          <p className="mt-0.5 leading-relaxed">
            Messages stay only while this tab is open. Saved history for this canvas is unchanged. Switch menu or tab and this scratch chat is discarded.
          </p>
          <div className="mt-1.5 flex gap-2">
            <button type="button" className="ui-btn h-7 px-2 text-[11px]" onClick={() => void keepChat()}>
              Keep in history
            </button>
            <button type="button" className="text-[11px] text-amber-800 underline" onClick={() => void discardTemp()}>
              Discard and show saved chat
            </button>
          </div>
        </div>
      ) : null}

      <p className="border-b border-slate-100 px-3 py-1.5 text-[10px] text-slate-400">
        {conversation?.temporary ? 'Not saved' : 'Saved in Projects'}
        {' · '}
        {status?.configured ? `Model · ${status.model}` : 'Local canvas assistant'}
        {' · '}
        {agents.find((item) => item.slug === agentSlug)?.name || 'General assistant'}
        {quote ? ' · quote attached' : ''}
      </p>
      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 py-1.5">
        {agents.map((agent) => (
          <button
            key={agent.slug}
            type="button"
            onClick={() => void setAgent(agent.slug)}
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${
              agent.slug === agentSlug ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500'
            }`}
          >
            {agent.name}
          </button>
        ))}
      </div>

      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {visible.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[94%] rounded px-3 py-2 ${
                message.role === 'user' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {message.imageData && (
                <img
                  src={message.imageData}
                  alt={message.imageName || 'upload'}
                  className="mb-2 max-h-48 w-full rounded object-contain"
                />
              )}
              {message.role === 'assistant' ? (
                <MarkdownView text={message.text} />
              ) : (
                <p className="text-[13px] leading-relaxed">
                  {message.text.split(/(@[A-Za-z][A-Za-z .]+)/g).map((part, index) =>
                    part.startsWith('@') ? (
                      <span key={index} className="rounded bg-white/20 px-1 font-medium">
                        {part}
                      </span>
                    ) : (
                      <span key={index}>{part}</span>
                    ),
                  )}
                </p>
              )}
              {message.role === 'assistant' && message.id !== 'welcome' && (
                <div className="mt-2 flex gap-1">
                  <IconBtn
                    label="Copy"
                    onClick={() => void navigator.clipboard.writeText(message.text)}
                  >
                    <Copy className="h-3 w-3" />
                  </IconBtn>
                  <IconBtn label="Speak" onClick={() => (prefs.tts ? speakText(message.text, prefs.speechLang) : stopSpeaking())}>
                    <Volume2 className="h-3 w-3" />
                  </IconBtn>
                  <IconBtn label="Branch" onClick={() => void forkConversation(message.id)}>
                    <GitFork className="h-3 w-3" />
                  </IconBtn>
                </div>
              )}
              {message.role === 'user' && (
                <button
                  type="button"
                  className="mt-1 text-[10px] underline opacity-80"
                  onClick={() => {
                    setDraft(message.text)
                    setEditId(message.id)
                  }}
                >
                  Edit & regenerate
                </button>
              )}
            </div>
          </div>
        ))}
        {streaming && <p className="text-[11px] text-slate-400">Streaming…</p>}
        {error && <p className="text-[11px] text-rose-600">{error}</p>}
      </div>

      {quote && (
        <div className="flex items-start justify-between gap-2 border-t border-amber-100 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800">
          <span className="line-clamp-2">Quote: {quote}</span>
          <button type="button" onClick={() => setQuote('')}>
            Clear
          </button>
        </div>
      )}

      {image && (
        <div className="border-t border-slate-100 px-3 py-2">
          <div className="flex items-start gap-2">
            <img
              src={image.previewUrl}
              alt={image.name}
              className="max-h-44 max-w-[70%] rounded border border-slate-200 bg-slate-50 object-contain"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-slate-700">{image.name}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">{image.dataUrl ? 'Ready to send' : 'Preparing…'}</p>
              <button type="button" className="mt-2 text-[11px] text-rose-600" onClick={clearImage}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={submit}
        className="border-t border-slate-200 p-3"
        onDragOver={(event) => {
          if ([...event.dataTransfer.types].includes('Files')) event.preventDefault()
        }}
        onDrop={(event) => {
          const file = [...event.dataTransfer.files].find((item) => item.type.startsWith('image/'))
          if (!file) return
          event.preventDefault()
          attachFile(file)
        }}
      >
        <textarea
          value={draft}
          onChange={(event) => {
            const value = event.target.value
            setDraft(value)
            setMentionOpen(value.endsWith('@') || /@[A-Za-z]*$/.test(value))
          }}
          onPaste={(event) => void onPaste(event)}
          placeholder={editId ? 'Edit prompt and regenerate…' : 'Ask about this canvas…  @ to tag'}
          rows={3}
          className="w-full resize-none rounded border border-slate-200 px-2.5 py-2 text-[13px] outline-none placeholder:text-slate-400 focus:border-brand-500"
        />
        {mentionOpen && (
          <div className="mt-1 overflow-hidden rounded border border-slate-200 bg-white text-[12px] shadow-sm">
            {team.map((person) => (
              <button
                key={person.id}
                type="button"
                className="flex w-full items-center justify-between px-2 py-1.5 text-left hover:bg-slate-50"
                onClick={() => {
                  setDraft((prev) => prev.replace(/@([A-Za-z]*)$/, `@${person.name} `))
                  setMentionOpen(false)
                }}
              >
                <span className="font-medium text-slate-800">@{person.name}</span>
                <span className="text-slate-400">{person.role}</span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                attachFile(file)
              }}
            />
            <button type="button" className="ui-btn h-8 w-8 px-0" title="Attach image" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={`ui-btn h-8 w-8 px-0 ${listening ? 'border-brand-500 text-brand-600' : ''}`}
              title="Browser voice"
              onClick={toggleMic}
            >
              {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            </button>
            {editId && (
              <button type="button" className="ui-btn h-8 px-2 text-[11px]" onClick={() => setEditId(null)}>
                <RefreshCw className="h-3 w-3" />
                Cancel edit
              </button>
            )}
          </div>
          <button type="submit" className="ui-btn-primary h-8 w-8 px-0" aria-label="Send" disabled={streaming}>
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  )
}

function IconBtn({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-white hover:text-slate-800"
    >
      {children}
    </button>
  )
}