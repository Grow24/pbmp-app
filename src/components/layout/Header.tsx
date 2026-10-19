import { Bell, CalendarDays, Menu, Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { prefsFromSettings } from '../../ai/prefs'
import { api } from '../../lib/api'
import { useWorkbench } from '../../context/WorkbenchContext'

export function Header() {
  const { search, setSearch, setMobileNavOpen, settings, highlights, reload, setRightOpen, setRightTab } = useWorkbench()
  const [notesOpen, setNotesOpen] = useState(false)
  const prefs = prefsFromSettings(settings)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  const assignments = highlights.filter((item) => item.mentionId && item.status !== 'done')

  const clock = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !prefs.clock24h,
  }).format(now)

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3">
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-600 hover:bg-slate-100 lg:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2 pr-2">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-brand-500 text-white">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
            <path
              d="M5 16.5 12 6l7 10.5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="17.4" r="1.6" fill="currentColor" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-slate-800">{settings.brand_name || 'PBMP'}</span>
        <span className="hidden h-4 w-px bg-slate-200 sm:block" />
        <span className="hidden text-sm text-slate-500 sm:block">{settings.brand_subtitle || 'Workbench'}</span>
      </div>

      <label className="relative ml-2 hidden min-w-0 flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={settings.search_placeholder || 'Search menu'}
          className="h-8 w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:bg-white"
        />
      </label>

      <div className="ml-auto flex items-center gap-1">
        <div className="mr-1 hidden items-center gap-1.5 px-2 text-xs text-slate-500 lg:flex">
          <CalendarDays className="h-3.5 w-3.5" />
          {settings.header_date || '2 Sep 2026'} · {clock}
        </div>
        <a
          href="/admin"
          className="inline-flex h-8 items-center gap-1 rounded px-2 text-xs text-slate-600 hover:bg-slate-100"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Admin
        </a>
        <div className="relative">
          <button
            type="button"
            className="relative inline-flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100"
            aria-label="Notifications"
            onClick={() => setNotesOpen((open) => !open)}
          >
            <Bell className="h-4 w-4" />
            {assignments.length ? (
              <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-semibold text-white">
                {assignments.length}
              </span>
            ) : null}
          </button>
          {notesOpen ? (
            <div className="absolute right-0 top-9 z-30 w-80 rounded border border-slate-200 bg-white p-2 shadow-lg">
              <p className="px-1 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">Assignments</p>
              {assignments.length ? (
                assignments.map((item) => (
                  <div key={item.id} className="border-t border-slate-100 px-1 py-2">
                    <p className="text-[12px] font-medium text-slate-800">{item.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[12px] text-slate-600">{item.note}</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400">{item.author}</span>
                      <button
                        type="button"
                        className="text-[11px] font-medium text-brand-600"
                        onClick={() => {
                          void api.setHighlightStatus(item.id, 'done').then(() => reload())
                        }}
                      >
                        Mark done
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="px-1 py-2 text-[12px] text-slate-500">No open assignments. Tag a teammate with @ in Conversation.</p>
              )}
              <button
                type="button"
                className="mt-1 w-full rounded px-1 py-1 text-left text-[11px] text-slate-500 hover:bg-slate-50"
                onClick={() => {
                  setRightTab('highlight')
                  setRightOpen(true)
                  setNotesOpen(false)
                }}
              >
                Open Highlight
              </button>
            </div>
          ) : null}
        </div>
        <div className="ml-1 flex items-center gap-2 border-l border-slate-200 pl-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-[11px] font-semibold text-white">
            {settings.user_initials || 'PS'}
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="text-[13px] font-medium text-slate-800">{settings.user_name || 'User'}</div>
            <div className="text-[11px] text-slate-400">{settings.user_role || ''}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
