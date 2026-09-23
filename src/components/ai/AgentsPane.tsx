import { Bot } from 'lucide-react'
import { useAi } from '../../context/AiContext'
import { useWorkbench } from '../../context/WorkbenchContext'

export function AgentsPane() {
  const { setRightTab } = useWorkbench()
  const { agents, agentSlug, setAgent, binding, sendMessage } = useAi()
  const active = agents.find((item) => item.slug === agentSlug) || agents[0]

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">What these names are</p>
      <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
        These are not separate people or ChatGPT accounts. They are <span className="font-medium text-slate-800">role lenses</span> on the same bound chat
        {binding ? ` (${binding})` : ''}. Pick one, then ask — the assistant answers in that voice, still from this canvas. Switch the tab and the chat changes; the role stays until you pick another.
      </p>

      <div className="mt-3 space-y-2">
        {agents.map((agent) => {
          const selected = agent.slug === agentSlug
          return (
            <button
              key={agent.slug}
              type="button"
              onClick={() => void setAgent(agent.slug)}
              className={`w-full rounded border px-3 py-2.5 text-left ${
                selected ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bot className={`h-4 w-4 ${selected ? 'text-brand-600' : 'text-slate-400'}`} />
                <span className="text-[13px] font-medium text-slate-800">{agent.name}</span>
                {selected ? <span className="text-[10px] uppercase text-brand-700">Active</span> : null}
              </div>
              <p className="mt-1 text-[12px] text-slate-600">{agent.role}</p>
              {agent.useWhen ? (
                <p className="mt-1 text-[11px] text-slate-500">
                  <span className="font-medium text-slate-600">Use when: </span>
                  {agent.useWhen}
                </p>
              ) : null}
              {agent.ask ? (
                <p className="mt-0.5 text-[11px] text-slate-400">Try: “{agent.ask}”</p>
              ) : null}
            </button>
          )
        })}
      </div>

      {active?.ask ? (
        <button
          type="button"
          className="ui-btn mt-3 w-full"
          onClick={() => {
            setRightTab('chat')
            void sendMessage(active.ask || '')
          }}
        >
          Ask as {active.name}
        </button>
      ) : null}
    </div>
  )
}
