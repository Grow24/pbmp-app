import { ChevronRight, MessageSquare } from 'lucide-react'
import { useWorkbench } from '../../context/WorkbenchContext'
import { CanvasBody } from './CanvasBody'

export function Canvas() {
  const { canvas, ancestors, activeTab, activeSubtab, setTab, setSubtab, rightOpen, setRightOpen, viewKind } =
    useWorkbench()

  if (!canvas) {
    return (
      <section className="flex flex-1 items-center justify-center bg-[#f5f7fa] text-sm text-slate-500">
        Select a menu item to open its workspace.
      </section>
    )
  }

  const isDiagram = viewKind === 'maps' || viewKind === 'tool'

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-white">
      <div className="border-b border-slate-200 px-4 pt-3 sm:px-5">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          {ancestors.map((item, index) => (
            <span key={item.id} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3 w-3" />}
              {item.label}
            </span>
          ))}
        </div>

        <div className="mt-1.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900">{canvas.title}</h1>
            <p className="mt-0.5 max-w-2xl text-[13px] text-slate-500">{canvas.description}</p>
          </div>
          {!rightOpen && (
            <button type="button" className="ui-btn xl:hidden" onClick={() => setRightOpen(true)}>
              <MessageSquare className="h-3.5 w-3.5" />
              Panel
            </button>
          )}
        </div>

        <div className="mt-3 flex gap-0 overflow-x-auto">
          {canvas.tabs.map((tab) => {
            const selected = activeTab?.id === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-[13px] ${
                  selected
                    ? 'border-brand-500 font-medium text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab?.subtabs && (
        <div className="flex gap-1 border-b border-slate-200 bg-[#fafafa] px-4 sm:px-5">
          {activeTab.subtabs.map((tab) => {
            const selected = activeSubtab?.id === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubtab(tab.id)}
                className={`-mb-px border-b-2 px-3 py-2 text-xs ${
                  selected
                    ? 'border-brand-500 font-medium text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      <div className={`min-h-0 flex-1 overflow-auto p-4 sm:p-5 ${isDiagram ? 'canvas-grid' : 'bg-[#f5f7fa]'}`}>
        <CanvasBody />
      </div>
    </section>
  )
}
