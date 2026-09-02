import { Bell, CalendarDays, Menu, Search, SlidersHorizontal } from 'lucide-react'
import { useWorkbench } from '../../context/WorkbenchContext'

export function Header() {
  const { search, setSearch, setMobileNavOpen, settings } = useWorkbench()

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
          {settings.header_date || '2 Sep 2026'}
        </div>
        <a
          href="/admin"
          className="inline-flex h-8 items-center gap-1 rounded px-2 text-xs text-slate-600 hover:bg-slate-100"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Admin
        </a>
        <button
          type="button"
          className="relative inline-flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>
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
