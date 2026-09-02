import { useEffect, useState } from 'react'
import { useWorkbench } from '../../context/WorkbenchContext'

const TOOLS = [
  { id: 'iq', label: 'iq', title: 'IQ insights', menuId: 'inquiry', className: 'bg-[#6d28d9]' },
  { id: 'vs', label: 'Vs', title: 'Visio', menuId: 'drawio', className: 'bg-[#eab308]' },
  { id: 'ta', label: 'Ta', title: 'Tableau', menuId: 'gds', className: 'bg-[#22d3ee]' },
] as const

export function Footer() {
  const { canvas, activeTab, activeSubtab, settings, selectItem, setTab, setSubtab } = useWorkbench()
  const trail = [canvas?.title, activeTab?.label, activeSubtab?.label].filter(Boolean).join(' / ')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2200)
    return () => window.clearTimeout(timer)
  }, [notice])

  const openTool = (tool: (typeof TOOLS)[number]) => {
    if (tool.id === 'iq') {
      selectItem('business')
      setTab('assess')
      setSubtab('inquiry')
    } else {
      selectItem(tool.menuId)
    }
    setNotice(`Opened ${tool.title}`)
  }

  return (
    <footer className="flex h-8 shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 text-[11px] text-slate-500">
      <div className="min-w-0 truncate">{trail || 'Workbench'}</div>
      <div className="flex items-center gap-3">
        {notice && <span className="hidden text-[10px] text-brand-600 sm:inline">{notice}</span>}
        <span className="hidden sm:inline">{settings.footer_org}</span>
        <span className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">
          {settings.footer_status}
        </span>
        <div className="flex items-center gap-1">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              title={tool.title}
              aria-label={tool.title}
              onClick={() => openTool(tool)}
              className={`inline-flex h-[18px] w-[18px] items-center justify-center rounded-[3px] text-[9px] font-bold leading-none text-white ${tool.className}`}
            >
              {tool.label}
            </button>
          ))}
        </div>
      </div>
    </footer>
  )
}
