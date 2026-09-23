import { useWorkbench } from '../../context/WorkbenchContext'

const toneClass = {
  insight: 'border-sky-200 bg-sky-50 text-sky-700',
  risk: 'border-rose-200 bg-rose-50 text-rose-700',
  action: 'border-amber-200 bg-amber-50 text-amber-700',
}

export function HighlightPane() {
  const { highlights } = useWorkbench()
  const tagged = highlights.filter((item) => item.mentionId)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">How tagging works</p>
      <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
        Type <span className="font-medium text-slate-800">@</span> in Chat and pick Priya, Arjun, or Nisha. Send does not email them. It posts a Highlight here so the team can see the ask on this workbench.
      </p>
      {tagged.length ? (
        <p className="mt-2 text-[11px] text-slate-400">{tagged.length} tag{tagged.length === 1 ? '' : 's'} from chat.</p>
      ) : null}

      <div className="mt-3 space-y-2">
        {highlights.length ? (
          highlights.map((item) => (
            <article key={item.id} className="ui-card p-3">
              <div className="flex items-center justify-between gap-2">
                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase ${toneClass[item.tone]}`}>
                  {item.mentionId ? 'Tagged' : item.tone}
                </span>
                <span className="text-[11px] text-slate-400">{item.time}</span>
              </div>
              <h3 className="mt-2 text-[13px] font-medium text-slate-900">{item.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{item.note}</p>
              <p className="mt-2 text-[11px] text-slate-400">
                {item.mentionId ? `For ${item.author}` : item.author}
                {item.from ? ` · ${item.from}` : ''}
              </p>
            </article>
          ))
        ) : (
          <p className="text-[13px] text-slate-500">
            No highlights yet. In Chat click @, choose Priya Shah, and send — the tag will appear here.
          </p>
        )}
      </div>
    </div>
  )
}
