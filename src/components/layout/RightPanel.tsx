import { Highlighter, MessageSquare, Send, X } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useWorkbench } from '../../context/WorkbenchContext'

const toneClass = {
  insight: 'border-sky-200 bg-sky-50 text-sky-700',
  risk: 'border-rose-200 bg-rose-50 text-rose-700',
  action: 'border-amber-200 bg-amber-50 text-amber-700',
}

export function RightPanel() {
  const { rightOpen, setRightOpen, rightTab, setRightTab, chat, sendChat, highlights, canvas } =
    useWorkbench()
  const [draft, setDraft] = useState('')

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    sendChat(draft)
    setDraft('')
  }

  if (!rightOpen) {
    return (
      <aside className="hidden h-full w-12 shrink-0 flex-col items-center gap-1 border-l border-slate-200 bg-white py-2 xl:flex">
        <RailButton
          active={false}
          label="Chat"
          onClick={() => {
            setRightTab('chat')
            setRightOpen(true)
          }}
        >
          <MessageSquare className="h-4 w-4" />
        </RailButton>
        <RailButton
          active={false}
          label="Highlight"
          onClick={() => {
            setRightTab('highlight')
            setRightOpen(true)
          }}
        >
          <Highlighter className="h-4 w-4" />
        </RailButton>
      </aside>
    )
  }

  return (
    <aside className="flex h-full w-full max-w-full shrink-0 flex-col border-l border-slate-200 bg-white sm:w-[340px]">
      <div className="flex h-10 items-center justify-between border-b border-slate-200 px-3">
        <span className="text-[13px] font-medium text-slate-800">
          {rightTab === 'chat' ? 'Chat' : 'Highlights'}
        </span>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          onClick={() => setRightOpen(false)}
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex border-b border-slate-200 px-3">
        <button
          type="button"
          onClick={() => setRightTab('chat')}
          className={`-mb-px border-b-2 px-2 py-2 text-xs ${
            rightTab === 'chat' ? 'border-brand-500 font-medium text-brand-600' : 'border-transparent text-slate-500'
          }`}
        >
          Chat
        </button>
        <button
          type="button"
          onClick={() => setRightTab('highlight')}
          className={`-mb-px border-b-2 px-2 py-2 text-xs ${
            rightTab === 'highlight'
              ? 'border-brand-500 font-medium text-brand-600'
              : 'border-transparent text-slate-500'
          }`}
        >
          Highlight
        </button>
      </div>

      {rightTab === 'chat' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <p className="border-b border-slate-100 px-3 py-2 text-[11px] text-slate-400">
            {canvas?.title ?? 'Current canvas'}
          </p>
          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {chat.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded px-3 py-2 text-[13px] leading-relaxed ${
                    message.role === 'user' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={onSubmit} className="border-t border-slate-200 p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type something here…"
                rows={2}
                className="flex-1 resize-none rounded border border-slate-200 px-2.5 py-2 text-[13px] outline-none placeholder:text-slate-400 focus:border-brand-500"
              />
              <button type="submit" className="ui-btn-primary h-8 w-8 px-0" aria-label="Send">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {highlights.map((item) => (
            <article key={item.id} className="ui-card p-3">
              <div className="flex items-center justify-between gap-2">
                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase ${toneClass[item.tone]}`}>
                  {item.tone}
                </span>
                <span className="text-[11px] text-slate-400">{item.time}</span>
              </div>
              <h3 className="mt-2 text-[13px] font-medium text-slate-900">{item.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{item.note}</p>
              <p className="mt-2 text-[11px] text-slate-400">{item.author}</p>
            </article>
          ))}
        </div>
      )}
    </aside>
  )
}

function RailButton({
  children,
  label,
  onClick,
  active,
}: {
  children: ReactNode
  label: string
  onClick: () => void
  active: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded ${
        active ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}
