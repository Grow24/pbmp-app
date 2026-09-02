import { useWorkbench } from '../../../context/WorkbenchContext'

export function AboutView() {
  const { blocks } = useWorkbench()
  const intro = blocks('about').find((item) => item.blockType === 'about_intro')
  const features = blocks('about').filter((item) => item.blockType === 'about_feature')

  return (
    <div className="mx-auto max-w-2xl ui-card p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">{intro?.title}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{intro?.subtitle}</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{intro?.body}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {features.map((item) => (
          <div key={item.id} className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {item.title}
          </div>
        ))}
      </div>
    </div>
  )
}
