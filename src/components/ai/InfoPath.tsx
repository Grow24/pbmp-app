import type { InfoPath } from '../../ai/types'

const welcomePath: InfoPath = {
  used: 'local',
  provider: 'Workbench welcome',
  steps: [
    {
      n: 1,
      title: 'MySQL settings',
      detail: 'This is the saved chat_welcome text. No ChatGPT or Gemini call was made.',
    },
  ],
}

export function InfoPathView({ path, welcome = false }: { path?: InfoPath | null; welcome?: boolean }) {
  const trail = path || (welcome ? welcomePath : null)
  if (!trail?.steps?.length) return null

  return (
    <div className="mt-2 border-t border-slate-200/80 pt-2 text-left text-[11px] text-slate-500">
      <p className="font-medium text-slate-600">Information path · {trail.provider || trail.used}</p>
      <ol className="mt-1 space-y-1">
        {trail.steps.map((step) => (
          <li key={step.n} className="leading-relaxed">
            <span className="font-medium text-slate-600">
              {step.n}. {step.title}
            </span>
            <span className="text-slate-500"> — {step.detail}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
