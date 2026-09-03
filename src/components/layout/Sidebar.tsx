import { ChevronDown, ChevronRight, ExternalLink, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import { getIcon } from '../../icons'
import { useWorkbench } from '../../context/WorkbenchContext'
import type { MenuItem } from '../../types'

function matchesQuery(item: MenuItem, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  if (item.label.toLowerCase().includes(q)) return true
  return Boolean(item.children?.some((child) => matchesQuery(child, q)))
}

function SidebarRow({ item, depth }: { item: MenuItem; depth: number }) {
  const { selectedId, expandedIds, sidebarCollapsed, toggleExpanded, selectItem, search, setMobileNavOpen } =
    useWorkbench()
  const Icon = getIcon(item.icon)
  const hasChildren = Boolean(item.children?.length)
  const expanded = expandedIds.includes(item.id) || Boolean(search)
  const active = selectedId === item.id
  const childActive = Boolean(
    item.children?.some((child) => child.id === selectedId || child.children?.some((n) => n.id === selectedId)),
  )

  const onClick = () => {
    if (hasChildren) {
      if (sidebarCollapsed) {
        const firstLeaf = item.children?.find((child) => child.canvas) ?? item.children?.[0]
        if (firstLeaf?.canvas) selectItem(firstLeaf.id)
        return
      }
      toggleExpanded(item.id)
      return
    }
    if (item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer')
      setMobileNavOpen(false)
      return
    }
    if (item.canvas) selectItem(item.id)
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        title={sidebarCollapsed ? item.label : undefined}
        className={`group flex w-full items-center gap-2 text-left ${
          sidebarCollapsed ? 'h-10 justify-center px-0' : 'h-9 px-3'
        } ${
          active
            ? 'bg-brand-50 text-brand-600'
            : childActive
              ? 'text-slate-800'
              : 'text-slate-600 hover:bg-slate-50'
        }`}
        style={sidebarCollapsed ? undefined : { paddingLeft: 12 + depth * 16 }}
      >
        <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-brand-500' : 'text-slate-400'}`} />
        {!sidebarCollapsed && (
          <>
            <span className="min-w-0 flex-1 truncate text-[13px]">{item.label}</span>
            {item.externalUrl && <ExternalLink className="h-3 w-3 shrink-0 text-slate-300" />}
            {hasChildren &&
              (expanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              ))}
          </>
        )}
      </button>
      {!sidebarCollapsed && hasChildren && expanded && (
        <div className="ml-5 border-l border-slate-200">
          {item.children
            ?.filter((child) => matchesQuery(child, search))
            .map((child) => (
              <SidebarRow key={child.id} item={child} depth={depth + 1} />
            ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const { search, setSearch, sidebarCollapsed, setSidebarCollapsed, mobileNavOpen, setMobileNavOpen, menuSections } =
    useWorkbench()

  const body = (
    <aside
      className={`flex h-full flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ${
        sidebarCollapsed ? 'w-14' : 'w-60'
      }`}
    >
      <div className={`flex h-10 items-center border-b border-slate-100 px-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
        {!sidebarCollapsed && (
          <label className="relative mr-1 block flex-1 lg:hidden">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="h-8 w-full rounded border border-slate-200 pl-7 pr-2 text-[13px] outline-none focus:border-brand-500"
            />
          </label>
        )}
        <button
          type="button"
          className="hidden h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-slate-50 hover:text-slate-700 lg:inline-flex"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {menuSections.map((section) => {
          const visible = section.items.filter((item) => matchesQuery(item, search))
          if (!visible.length) return null
          return (
            <div key={section.id} className="mb-3">
              {!sidebarCollapsed && (
                <div className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {section.label}
                </div>
              )}
              {visible.map((item) => (
                <SidebarRow key={item.id} item={item} depth={0} />
              ))}
            </div>
          )
        })}
      </nav>
    </aside>
  )

  return (
    <>
      <div className="hidden h-full lg:block">{body}</div>
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 shadow-lg">{body}</div>
        </div>
      )}
    </>
  )
}
