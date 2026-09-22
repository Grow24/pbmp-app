import { Bot } from 'lucide-react'
import { useAi } from '../../context/AiContext'

export function AgentsPane() {
  const { agents, agentSlug, setAgent, binding } = useAi()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">LibreChat-style agents</p>
      <p className="mt-1 text-[12px] text-slate-500">
        Bound to <span className="font-medium text-slate-700">{binding || 'this canvas'}</span>. Pick who answers on this level.
      </p>
      <div className="mt-3 space-y-2">
        {agents.map((agent) => {
          const active = agent.slug === agentSlug
          return (
            <button
              key={agent.slug}
              type="button"
              onClick={() => void setAgent(agent.slug)}
              className={`w-full rounded border px-3 py-2 text-left ${
                active ? 'border-brand-400 bg-brand-50' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bot className={`h-4 w-4 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
                <span className="text-[13px] font-medium text-slate-800">{agent.name}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{agent.role}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
