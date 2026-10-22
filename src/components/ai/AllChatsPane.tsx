import { PanelLeftClose, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AiConversation } from '../../ai/types'
import { useAi } from '../../context/AiContext'

function chatLevel(item: AiConversation) {
  return item.level || [item.canvasSlug, item.tabSlug, item.subtabSlug].filter(Boolean).join(' · ') || 'Workspace'
}

function recency(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Older'
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const days = Math.round((startToday - startDate) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return 'Previous 7 days'
  if (days < 30) return 'Previous 30 days'
  return 'Older'
}

const groupOrder = ['Pinned', 'Today', 'Yesterday', 'Previous 7 days', 'Previous 30 days', 'Older']

export function AllChatsPane({ onCollapse }: { onCollapse?: () => void }) {
  const { allChats, conversation, selectConversation, newChat } = useAi()
  const [query, setQuery] = useState('')

  const grouped = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = needle
      ? allChats.filter((item) => `${item.title} ${chatLevel(item)} ${item.projectName || ''}`.toLowerCase().includes(needle))
      : allChats
    const buckets = new Map<string, AiConversation[]>()
    const sorted = [...filtered].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    for (const item of sorted) {
      const key = item.pinned ? 'Pinned' : recency(item.updatedAt)
      const list = buckets.get(key) || []
      list.push(item)
      buckets.set(key, list)
    }
    return groupOrder.filter((key) => buckets.has(key)).map((key) => [key, buckets.get(key)!] as const)
  }, [allChats, query])

  const openChat = (id: string) => {
    if (!id) return
    void selectConversation(id)
  }

  return (
    <div className="flex h-full w-56 shrink-0 flex-col border-r border-slate-200 bg-[#f7f7f8]">
      <div className="flex items-center gap-1 px-2 pt-2">
        <button
          type="button"
          className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-[13px] font-medium text-slate-800 hover:bg-slate-200/70"
          onClick={() => void newChat(false)}
        >
          <Plus className="h-4 w-4 shrink-0" />
          New chat
        </button>
        {onCollapse && (
          <button
            type="button"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/70"
            onClick={onCollapse}
            aria-label="Hide chat list"
            title="Hide chat list"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <label className="relative mx-2 mt-1 block">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search chats"
          className="h-8 w-full rounded-lg border border-transparent bg-white px-2 pl-7 text-[13px] outline-none focus:border-slate-300"
        />
      </label>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {!grouped.length ? (
          <p className="px-2 py-3 text-[12px] leading-relaxed text-slate-500">
            {allChats.length ? 'No chats match that search.' : 'No saved chats yet. Start one with New chat.'}
          </p>
        ) : (
          grouped.map(([label, items]) => (
            <section key={label} className="mb-3">
              <p className="px-2 py-1 text-[11px] font-medium text-slate-400">{label}</p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const selected = conversation?.id === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openChat(item.id)}
                      title={`${item.title} — ${chatLevel(item)}`}
                      className={`w-full rounded-lg px-2 py-1.5 text-left ${
                        selected ? 'bg-slate-200 text-slate-900' : 'text-slate-700 hover:bg-slate-200/70'
                      }`}
                    >
                      <div className="truncate text-[13px]">{item.title}</div>
                      <div className="truncate text-[10px] text-slate-400">{chatLevel(item)}</div>
                    </button>
                  )
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
