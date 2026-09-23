import { Bot, FolderKanban, Highlighter, MessageSquare, Sparkles, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { AgentsPane } from '../ai/AgentsPane'
import { ArtifactsPane } from '../ai/ArtifactsPane'
import { ChatPane } from '../ai/ChatPane'
import { HighlightPane } from '../ai/HighlightPane'
import { ProjectsPane } from '../ai/ProjectsPane'
import { useWorkbench } from '../../context/WorkbenchContext'

const tabs = [
  { id: 'chat', label: 'Chat' },
  { id: 'projects', label: 'Projects' },
  { id: 'artifacts', label: 'Artifacts' },
  { id: 'agents', label: 'Agents' },
  { id: 'highlight', label: 'Highlight' },
] as const

export function RightPanel() {
  const { rightOpen, setRightOpen, rightTab, setRightTab } = useWorkbench()

  if (!rightOpen) {
    return (
      <aside className="hidden h-full w-12 shrink-0 flex-col items-center gap-1 border-l border-slate-200 bg-white py-2 xl:flex">
        <RailButton
          label="Chat"
          onClick={() => {
            setRightTab('chat')
            setRightOpen(true)
          }}
        >
          <MessageSquare className="h-4 w-4" />
        </RailButton>
        <RailButton
          label="Projects"
          onClick={() => {
            setRightTab('projects')
            setRightOpen(true)
          }}
        >
          <FolderKanban className="h-4 w-4" />
        </RailButton>
        <RailButton
          label="Artifacts"
          onClick={() => {
            setRightTab('artifacts')
            setRightOpen(true)
          }}
        >
          <Sparkles className="h-4 w-4" />
        </RailButton>
        <RailButton
          label="Agents"
          onClick={() => {
            setRightTab('agents')
            setRightOpen(true)
          }}
        >
          <Bot className="h-4 w-4" />
        </RailButton>
        <RailButton
          label="Highlight"
          onClick={() => {
            setRightTab('highlight')
            setRightOpen(true)
          }}
        >
          <Highlighter className="h-4 w-4" />
        </RailButton>
      </aside>
    )
  }

  return (
    <aside className="flex h-full w-full min-w-0 flex-col border-l border-slate-200 bg-white">
      <div className="flex h-10 items-center justify-between border-b border-slate-200 px-3">
        <span className="min-w-0">
          <span className="block text-[13px] font-medium text-slate-800">
            {rightTab === 'chat'
              ? 'Conversation'
              : rightTab === 'projects'
                ? 'Projects'
                : rightTab === 'artifacts'
                  ? 'Artifacts'
                  : rightTab === 'agents'
                    ? 'Agents'
                    : 'Highlights'}
          </span>
          <span className="block text-[10px] text-slate-400">Drag the left edge to resize</span>
        </span>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          onClick={() => setRightOpen(false)}
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex border-b border-slate-200 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRightTab(tab.id)}
            className={`-mb-px border-b-2 px-2 py-2 text-xs ${
              rightTab === tab.id ? 'border-brand-500 font-medium text-brand-600' : 'border-transparent text-slate-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {rightTab === 'chat' && <ChatPane />}
      {rightTab === 'projects' && <ProjectsPane />}
      {rightTab === 'artifacts' && <ArtifactsPane />}
      {rightTab === 'agents' && <AgentsPane />}
      {rightTab === 'highlight' && <HighlightPane />}
    </aside>
  )
}

function RailButton({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-50"
    >
      {children}
    </button>
  )
}