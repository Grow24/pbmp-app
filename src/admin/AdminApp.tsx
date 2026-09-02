import { useEffect, useState } from 'react'
import { ArrowLeft, FileText, LayoutList, PanelsTopLeft, Settings2, Highlighter } from 'lucide-react'
import { GeneralPage } from './pages/GeneralPage'
import { MenusPage } from './pages/MenusPage'
import { TabsPage } from './pages/TabsPage'
import { ContentPage } from './pages/ContentPage'

type Page = 'general' | 'menus' | 'tabs' | 'content'

const NAV: { id: Page; label: string; hint: string; icon: typeof Settings2 }[] = [
  { id: 'general', label: 'General', hint: 'Brand, user, footer', icon: Settings2 },
  { id: 'menus', label: 'Menus', hint: 'Left sidebar tree', icon: LayoutList },
  { id: 'tabs', label: 'Canvas tabs', hint: 'Tabs and sub-tabs', icon: PanelsTopLeft },
  { id: 'content', label: 'Page content', hint: 'Cards, KPIs, SWOT', icon: FileText },
]

export function AdminApp() {
  const [page, setPage] = useState<Page>('general')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(''), 2800)
    return () => window.clearTimeout(timer)
  }, [message])

  return (
    <div className="flex h-full bg-[#f5f7fa]">
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-brand-500 text-[11px] font-semibold text-white">
              AD
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Admin panel</div>
              <div className="text-[11px] text-slate-400">Set workbench from here</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = page === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPage(item.id)}
                className={`mb-1 flex w-full items-center gap-2.5 rounded px-3 py-2 text-left ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>
                  <span className="block text-[13px] font-medium">{item.label}</span>
                  <span className="block text-[11px] text-slate-400">{item.hint}</span>
                </span>
              </button>
            )
          })}
        </nav>
        <div className="border-t border-slate-200 p-3 text-[11px] leading-relaxed text-slate-400">
          Changes MySQL mein save hote hain. Workbench refresh karo to naya data dikhega.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center justify-between border-b border-slate-200 bg-white px-4">
          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <Highlighter className="h-3.5 w-3.5 text-brand-500" />
            PBMP configuration
          </div>
          <a href="/" className="ui-btn">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to workbench
          </a>
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-5">
          {page === 'general' && <GeneralPage onMessage={setMessage} />}
          {page === 'menus' && <MenusPage onMessage={setMessage} />}
          {page === 'tabs' && <TabsPage onMessage={setMessage} />}
          {page === 'content' && <ContentPage onMessage={setMessage} />}
        </main>
      </div>

      {message && (
        <div className="fixed bottom-4 right-4 z-50 rounded border border-emerald-200 bg-white px-4 py-2 text-[13px] text-emerald-800 shadow-lg">
          {message}
        </div>
      )}
    </div>
  )
}
