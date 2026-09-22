import { Archive, Search } from 'lucide-react'
import { useState } from 'react'
import { useAi } from '../../context/AiContext'
import { useWorkbench } from '../../context/WorkbenchContext'

export function ProjectsPane() {
  const { selectedId } = useWorkbench()
  const {
    projects,
    project,
    trail,
    conversations,
    conversation,
    showArchived,
    setShowArchived,
    selectConversation,
    newChat,
    moveConversation,
    archiveConversation,
    searchConversations,
    createProject,
  } = useAi()
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<typeof conversations>([])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">Mapped from menu</p>
      <p className="mt-1 text-[13px] font-medium text-slate-800">{project?.name || 'No project'}</p>
      <p className="text-[11px] text-slate-500">{trail.join(' / ') || selectedId} · {project?.kind}</p>

      <label className="relative mt-3 block">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => {
            const value = event.target.value
            setQuery(value)
            if (value.trim().length < 2) {
              setHits([])
              return
            }
            void searchConversations(value).then(setHits)
          }}
          placeholder="Search conversations"
          className="h-8 w-full rounded border border-slate-200 pl-7 pr-2 text-[13px] outline-none focus:border-brand-500"
        />
      </label>

      {(hits.length ? hits : conversations).map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => void selectConversation(item.id)}
          className={`mt-2 w-full rounded border px-3 py-2 text-left ${
            conversation?.id === item.id ? 'border-brand-400 bg-brand-50' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="truncate text-[13px] font-medium text-slate-800">{item.title}</div>
          <div className="text-[11px] text-slate-400">
            {[item.canvasSlug, item.tabSlug, item.subtabSlug].filter(Boolean).join(' / ') || 'workspace'}
            {item.pinned ? ' · pinned' : ''}
            {item.archived ? ' · archived' : ''}
          </div>
        </button>
      ))}

      <div className="mt-4 flex gap-2">
        <button type="button" className="ui-btn" onClick={() => void newChat(false)}>
          New chat here
        </button>
        <button type="button" className="ui-btn" onClick={() => setShowArchived(!showArchived)}>
          <Archive className="h-3.5 w-3.5" />
          {showArchived ? 'Hide archived' : 'Archived'}
        </button>
      </div>

      {conversation && (
        <div className="mt-4 space-y-2">
          <label className="block text-[11px] text-slate-500">
            Move conversation
            <select
              className="mt-1 h-8 w-full rounded border border-slate-200 px-2 text-[13px]"
              value={conversation.projectId}
              onChange={(event) => void moveConversation(Number(event.target.value))}
            >
              {projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.kind})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="ui-btn w-full"
            onClick={() => void archiveConversation(!conversation.archived)}
          >
            {conversation.archived ? 'Restore conversation' : 'Archive conversation'}
          </button>
        </div>
      )}

      <form
        className="mt-5 border-t border-slate-100 pt-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (!name.trim()) return
          void createProject(name.trim())
          setName('')
        }}
      >
        <p className="text-[11px] font-medium text-slate-600">Add programme / client project</p>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Meridian FY27"
          className="mt-1 h-8 w-full rounded border border-slate-200 px-2 text-[13px] outline-none focus:border-brand-500"
        />
        <button type="submit" className="ui-btn-primary mt-2 w-full">
          Create project
        </button>
      </form>
    </div>
  )
}