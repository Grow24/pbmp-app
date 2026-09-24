import { MessagesSquare } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AiConversation } from '../../ai/types'
import { useAi } from '../../context/AiContext'

function chatLevel(item: AiConversation) {
  return item.level || [item.canvasSlug, item.tabSlug, item.subtabSlug].filter(Boolean).join(' · ') || 'Workspace'
}

function chatLabel(item: AiConversation) {
  return `${item.title} — ${chatLevel(item)}`
}

export function AllChatsPane() {
  const { allChats, conversation, selectConversation } = useAi()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return allChats
    return allChats.filter((item) => {
      const hay = `${item.title} ${chatLevel(item)} ${item.projectName || ''}`.toLowerCase()
      return hay.includes(needle)
    })
  }, [allChats, query])

  const grouped = useMemo(() => {
    const buckets = new Map<string, AiConversation[]>()
    for (const item of filtered) {
      const key = chatLevel(item)
      const list = buckets.get(key) || []
      list.push(item)
      buckets.set(key, list)
    }
    return [...buckets.entries()]
  }, [filtered])

  const openChat = (id: string) => {
    if (!id) return
    void selectConversation(id)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">All chats</p>
      <p className="mt-1 text-[13px] font-medium text-slate-800">Every saved conversation</p>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
        Chat tab only opens the thread bound to the page you are on. This list is every saved chat across levels —
        Strategy, Marketing, Survey Manager, and the rest. Pick one below to open it, even if you are on a different
        page.
      </p>

      <label className="mt-3 block text-[11px] text-slate-500">
        Switch chat
        <select
          className="mt-1 h-9 w-full rounded border border-slate-200 bg-white px-2 text-[13px] text-slate-800 outline-none focus:border-brand-500"
          value={conversation && allChats.some((item) => item.id === conversation.id) ? conversation.id : ''}
          onChange={(event) => openChat(event.target.value)}
        >
          <option value="">{allChats.length ? 'Select a chat…' : 'No saved chats yet'}</option>
          {allChats.map((item) => (
            <option key={item.id} value={item.id}>
              {chatLabel(item)}
            </option>
          ))}
        </select>
      </label>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter by title or level"
        className="mt-2 h-8 w-full rounded border border-slate-200 px-2 text-[13px] outline-none focus:border-brand-500"
      />

      {!filtered.length ? (
        <p className="mt-4 text-[13px] text-slate-500">
          {allChats.length
            ? 'No chats match that filter.'
            : 'No saved chats yet. Open Chat on any page, send a message (not Don\'t save), then it appears here.'}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {grouped.map(([level, items]) => (
            <section key={level}>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">{level}</p>
              <div className="space-y-1.5">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openChat(item.id)}
                    className={`w-full rounded border px-3 py-2 text-left ${
                      conversation?.id === item.id ? 'border-brand-400 bg-brand-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <MessagesSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium text-slate-800">{item.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {item.projectName ? `${item.projectName} · ` : ''}
                          {item.pinned ? 'pinned' : 'saved'}
                          {item.archived ? ' · archived' : ''}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
