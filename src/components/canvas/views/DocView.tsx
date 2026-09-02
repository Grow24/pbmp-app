import { useWorkbench } from '../../../context/WorkbenchContext'

export function DocView() {
  const { canvas, blocks, filterItems } = useWorkbench()
  const meta = blocks('doc').find((item) => item.blockType === 'doc_meta')
  const sections = filterItems(blocks('doc').filter((item) => item.blockType === 'doc_section'))

  return (
    <div className="mx-auto max-w-3xl ui-card p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{meta?.title}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{canvas?.title}</h2>
      <p className="mt-1 text-sm text-slate-500">{meta?.subtitle}</p>
      <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
        {sections.map((section) => {
          const list = Array.isArray(section.extra.items) ? (section.extra.items as string[]) : []
          return (
            <section key={section.id}>
              <h3 className="text-base font-semibold text-slate-900">{section.title}</h3>
              {section.body && <p className="mt-2">{section.body}</p>}
              {list.length > 0 && (
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  {list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
