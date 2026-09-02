import { Plus } from 'lucide-react'
import { getIcon } from '../../../icons'
import { useWorkbench } from '../../../context/WorkbenchContext'

export function ToolView() {
  const { selectedItem, canvas, blocks, filterItems } = useWorkbench()
  const Icon = getIcon(selectedItem?.icon)
  const actions = blocks('tool').filter((item) => item.blockType === 'tool_action')
  const slots = filterItems(blocks('tool').filter((item) => item.blockType === 'tool_slot'))

  return (
    <div className="mx-auto max-w-4xl">
      <article className="ui-card p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded border border-brand-100 bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">{canvas?.title}</h2>
        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-slate-600">{canvas?.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className={action.extra.primary ? 'ui-btn-primary' : 'ui-btn'}
            >
              {action.extra.primary ? <Plus className="h-4 w-4" /> : null}
              {action.title}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="border border-dashed border-slate-300 px-4 py-6 text-center text-[13px] text-slate-500"
            >
              {slot.title}
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}
