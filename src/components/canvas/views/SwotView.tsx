import { useWorkbench } from '../../../context/WorkbenchContext'

const colors: Record<string, string> = {
  Strengths: 'bg-emerald-50 border-emerald-100 text-emerald-900',
  Weaknesses: 'bg-rose-50 border-rose-100 text-rose-900',
  Opportunities: 'bg-sky-50 border-sky-100 text-sky-900',
  Threats: 'bg-amber-50 border-amber-100 text-amber-900',
}

export function SwotView() {
  const { blocks } = useWorkbench()
  const items = blocks('swot').filter((item) => item.blockType === 'swot')
  const quadrants = ['Strengths', 'Weaknesses', 'Opportunities', 'Threats']

  return (
    <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
      {quadrants.map((quad) => (
        <article key={quad} className={`rounded border p-4 ${colors[quad]}`}>
          <h2 className="text-sm font-semibold">{quad}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {items
              .filter((item) => item.title === quad)
              .map((item) => (
                <li key={item.id} className="border border-white/80 bg-white px-3 py-2">
                  {item.body}
                </li>
              ))}
          </ul>
        </article>
      ))}
    </div>
  )
}
