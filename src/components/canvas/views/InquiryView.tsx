import { useWorkbench } from '../../../context/WorkbenchContext'

export function InquiryView() {
  const { blocks, filterItems } = useWorkbench()
  const intro = blocks('inquiry').find((item) => item.blockType === 'inquiry_intro')
  const questions = filterItems(blocks('inquiry').filter((item) => item.blockType === 'inquiry'))

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div className="ui-card p-4">
        <h2 className="text-sm font-semibold text-slate-900">{intro?.title}</h2>
        <p className="mt-1 text-sm text-slate-500">{intro?.body}</p>
      </div>
      {questions.map((item, index) => (
        <article key={item.id} className="ui-card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">Q{index + 1}</div>
          <h3 className="mt-1 text-sm font-semibold text-slate-900">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
        </article>
      ))}
    </div>
  )
}
