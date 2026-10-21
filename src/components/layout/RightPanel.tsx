import { Bot, FolderKanban, Highlighter, MessagesSquare, Sparkles, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { AgentsPane } from '../ai/AgentsPane'
import { AllChatsPane } from '../ai/AllChatsPane'
import { ArtifactsPane } from '../ai/ArtifactsPane'
import { ChatPane } from '../ai/ChatPane'
import { HighlightPane } from '../ai/HighlightPane'
import { ProjectsPane } from '../ai/ProjectsPane'
import { useWorkbench } from '../../context/WorkbenchContext'
import type { RightTab } from '../../context/WorkbenchContext'

const tabs = [
  { id: 'chats', label: 'Chats' },
  { id: 'projects', label: 'Projects' },
  { id: 'artifacts', label: 'Artifacts' },
  { id: 'agents', label: 'Agents' },
  { id: 'highlight', label: 'Highlight' },
] as const

type PanelTab = (typeof tabs)[number]['id']

function isChatsTab(tab: RightTab) {
  return tab === 'chat' || tab === 'all-chats'
}

export function RightPanel() {
  const { rightOpen, setRightOpen, rightTab, setRightTab } = useWorkbench()

  const openTab = (id: PanelTab) => {
    if (id === 'chats') {
      if (!isChatsTab(rightTab)) setRightTab('chat')
      return
    }
    setRightTab(id)
  }

  if (!rightOpen) {
    return (
      <aside className="hidden h-full w-12 shrink-0 flex-col items-center gap-1 border-r border-slate-200 bg-white py-2 xl:flex">
        <RailButton
          label="Chats"
          onClick={() => {
            setRightTab('chat')
            setRightOpen(true)
          }}
        >
          <MessagesSquare className="h-4 w-4" />
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
    <aside className="flex h-full w-full min-w-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-10 items-center justify-between border-b border-slate-200 px-3">
        <span className="min-w-0">
          <span className="block text-[13px] font-medium text-slate-800">
            {isChatsTab(rightTab)
              ? 'Chats'
              : rightTab === 'projects'
                ? 'Projects'
                : rightTab === 'artifacts'
                  ? 'Artifacts'
                  : rightTab === 'agents'
                    ? 'Agents'
                    : 'Highlights'}
          </span>
          <span className="block text-[10px] text-slate-400">Drag the right edge to resize</span>
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

      <div className="flex overflow-x-auto border-b border-slate-200 px-2">
        {tabs.map((tab) => {
          const selected = tab.id === 'chats' ? isChatsTab(rightTab) : rightTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => openTab(tab.id)}
              className={`-mb-px shrink-0 border-b-2 px-2 py-2 text-xs ${
                selected ? 'border-brand-500 font-medium text-brand-600' : 'border-transparent text-slate-500'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {isChatsTab(rightTab) && (
        <div className="flex gap-1 border-b border-slate-100 bg-[#fafafa] px-2">
          <InnerTab label="This chat" selected={rightTab === 'chat'} onClick={() => setRightTab('chat')} />
          <InnerTab label="All chats" selected={rightTab === 'all-chats'} onClick={() => setRightTab('all-chats')} />
        </div>
      )}

      {rightTab === 'chat' && <ChatPane />}
      {rightTab === 'all-chats' && <AllChatsPane />}
      {rightTab === 'projects' && <ProjectsPane />}
      {rightTab === 'artifacts' && <ArtifactsPane />}
      {rightTab === 'agents' && <AgentsPane />}
      {rightTab === 'highlight' && <HighlightPane />}
    </aside>
  )
}

function InnerTab({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-2.5 py-1.5 text-[11px] ${
        selected ? 'border-brand-500 font-medium text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'
      }`}
    >
      {label}
    </button>
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