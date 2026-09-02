import { useWorkbench } from '../../context/WorkbenchContext'

export function Footer() {
  const { canvas, activeTab, activeSubtab, settings } = useWorkbench()
  const trail = [canvas?.title, activeTab?.label, activeSubtab?.label].filter(Boolean).join(' / ')

  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 text-[11px] text-slate-500">
      <div className="truncate">{trail || 'Workbench'}</div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline">{settings.footer_org}</span>
        <span className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">
          {settings.footer_status}
        </span>
      </div>
    </footer>
  )
}
