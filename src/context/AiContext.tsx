import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { prefsFromSettings, prefsToSettings } from '../ai/prefs'
import type { AiAgent, AiArtifact, AiConversation, AiMessage, AiPrefs, AiProject, AiStatus, AiTeammate } from '../ai/types'
import { PBMP_AGENTS, PBMP_TEAM } from '../ai/catalog'
import { aiApi, type ChatContextPayload } from '../lib/aiApi'
import { api } from '../lib/api'
import { useWorkbench } from './WorkbenchContext'

type AiContextValue = {
  status: AiStatus | null
  prefs: AiPrefs
  savePrefs: (next: AiPrefs) => Promise<void>
  projects: AiProject[]
  project: AiProject | null
  trail: string[]
  conversations: AiConversation[]
  conversation: AiConversation | null
  messages: AiMessage[]
  artifacts: AiArtifact[]
  activeArtifact: AiArtifact | null
  setActiveArtifact: (value: AiArtifact | null) => void
  fullscreenArtifact: boolean
  setFullscreenArtifact: (value: boolean) => void
  streaming: boolean
  error: string | null
  quote: string
  setQuote: (value: string) => void
  showArchived: boolean
  setShowArchived: (value: boolean) => void
  loadWorkspace: () => Promise<void>
  selectConversation: (id: string) => Promise<void>
  newChat: (temporary?: boolean) => Promise<void>
  moveConversation: (projectId: number) => Promise<void>
  archiveConversation: (archived: boolean) => Promise<void>
  pinConversation: () => Promise<void>
  forkConversation: (upToMessageId?: string) => Promise<void>
  sendMessage: (text: string, image?: { name: string; dataUrl: string }, replaceUserMessageId?: string) => Promise<void>
  saveArtifact: (id: string) => Promise<void>
  searchConversations: (q: string) => Promise<AiConversation[]>
  createProject: (name: string) => Promise<void>
  agents: AiAgent[]
  team: AiTeammate[]
  agentSlug: string
  setAgent: (slug: string) => Promise<void>
  binding: string
}

const AiContext = createContext<AiContextValue | null>(null)

function canvasBlocks(blocks: ReturnType<ReturnType<typeof useWorkbench>['blocks']>): ChatContextPayload['blocks'] {
  return blocks.slice(0, 24).map((block) => ({
    type: block.blockType,
    title: block.title || undefined,
    subtitle: block.subtitle || undefined,
    value: block.value || undefined,
    body: block.body || undefined,
  }))
}

export function AiProvider({ children }: { children: ReactNode }) {
  const {
    selectedId,
    selectedItem,
    ancestors,
    canvas,
    activeTab,
    activeSubtab,
    viewKind,
    settings,
    blocks,
    reload,
    setRightTab,
    setRightOpen,
  } = useWorkbench()

  const [status, setStatus] = useState<AiStatus | null>(null)
  const [projects, setProjects] = useState<AiProject[]>([])
  const [project, setProject] = useState<AiProject | null>(null)
  const [trail, setTrail] = useState<string[]>([])
  const [conversations, setConversations] = useState<AiConversation[]>([])
  const [conversation, setConversation] = useState<AiConversation | null>(null)
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [artifacts, setArtifacts] = useState<AiArtifact[]>([])
  const [activeArtifact, setActiveArtifact] = useState<AiArtifact | null>(null)
  const [fullscreenArtifact, setFullscreenArtifact] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quote, setQuote] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [agents, setAgents] = useState<AiAgent[]>([...PBMP_AGENTS])
  const [team, setTeam] = useState<AiTeammate[]>([...PBMP_TEAM])
  const [agentSlug, setAgentSlug] = useState('general')
  const conversationRef = useRef<AiConversation | null>(null)
  conversationRef.current = conversation

  const prefs = useMemo(() => prefsFromSettings(settings), [settings])

  const tabSlug = activeTab?.id || ''
  const subtabSlug = activeSubtab?.id || ''
  const binding = [selectedItem?.label || selectedId, activeTab?.label, activeSubtab?.label].filter(Boolean).join(' · ')

  const applyWorkspace = useCallback(async () => {
    const data = await aiApi.workspace(selectedId, showArchived, tabSlug, subtabSlug)
    setStatus(data.status)
    setProjects(data.projects)
    setProject(data.project)
    setTrail(data.trail)
    setConversations(data.conversations)
    if (data.agents?.length) setAgents(data.agents)
    if (data.team?.length) setTeam(data.team)
    const bound = data.conversations.find((item) => item.id === data.boundConversationId)
    if (bound) {
      const detail = await aiApi.conversation(bound.id)
      setConversation(detail.conversation)
      setMessages(detail.messages)
      setArtifacts(detail.artifacts)
      setAgentSlug(detail.conversation.agentSlug || 'general')
    } else {
      setConversation(null)
      setMessages([])
      setArtifacts([])
    }
  }, [selectedId, showArchived, tabSlug, subtabSlug])

  const loadWorkspace = useCallback(async () => {
    try {
      await applyWorkspace()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load AI workspace')
    }
  }, [applyWorkspace])

  useEffect(() => {
    if (!selectedId) return
    applyWorkspace().catch((err: Error) => setError(err.message))
  }, [selectedId, tabSlug, subtabSlug, showArchived, applyWorkspace])

  const selectConversation = useCallback(async (id: string) => {
    const detail = await aiApi.conversation(id)
    setConversation(detail.conversation)
    setMessages(detail.messages)
    setArtifacts(detail.artifacts)
    setRightTab('chat')
  }, [setRightTab])

  const newChat = useCallback(
    async (temporary = false) => {
      if (!project) return
      const created = await aiApi.createConversation({
        projectId: project.id,
        canvasSlug: selectedId,
        tabSlug,
        subtabSlug,
        agentSlug,
        title: temporary ? 'Temporary chat' : 'New conversation',
        temporary,
      })
      setConversation(created)
      setMessages([])
      setArtifacts([])
      if (!temporary) setConversations((prev) => [created, ...prev])
      setRightTab('chat')
      setRightOpen(true)
    },
    [project, selectedId, tabSlug, subtabSlug, agentSlug, setRightOpen, setRightTab],
  )

  const moveConversation = useCallback(
    async (projectId: number) => {
      if (!conversation) return
      const updated = await aiApi.patchConversation(conversation.id, { projectId })
      setConversation(updated)
      await applyWorkspace()
    },
    [applyWorkspace, conversation],
  )

  const archiveConversation = useCallback(
    async (archived: boolean) => {
      if (!conversation) return
      await aiApi.patchConversation(conversation.id, { archived })
      await applyWorkspace()
    },
    [applyWorkspace, conversation],
  )

  const pinConversation = useCallback(async () => {
    if (!conversation) return
    const updated = await aiApi.patchConversation(conversation.id, { pinned: !conversation.pinned })
    setConversation(updated)
    setConversations((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
  }, [conversation])

  const forkConversation = useCallback(
    async (upToMessageId?: string) => {
      if (!conversation) return
      const created = await aiApi.forkConversation(conversation.id, upToMessageId)
      await applyWorkspace()
      await selectConversation(created.id)
    },
    [applyWorkspace, conversation, selectConversation],
  )

  const sendMessage = useCallback(
    async (text: string, image?: { name: string; dataUrl: string }, replaceUserMessageId?: string) => {
      if (!project) return
      const trimmed = text.trim()
      if (!trimmed && !image) return
      const userId = replaceUserMessageId || crypto.randomUUID()
      const assistantId = crypto.randomUUID()
      const quoted = quote ? `${trimmed}\n\nQuoted from canvas:\n${quote}` : trimmed
      setQuote('')
      setStreaming(true)
      setError(null)
      setRightTab('chat')
      setRightOpen(true)

      setMessages((prev) => {
        if (replaceUserMessageId) {
          const index = prev.findIndex((item) => item.id === replaceUserMessageId)
          return [
            ...prev.slice(0, index),
            { id: replaceUserMessageId, role: 'user', text: quoted, imageName: image?.name, imageData: image?.dataUrl },
            { id: assistantId, role: 'assistant', text: '' },
          ]
        }
        return [
          ...prev,
          { id: userId, role: 'user', text: quoted, imageName: image?.name, imageData: image?.dataUrl },
          { id: assistantId, role: 'assistant', text: '' },
        ]
      })

      const mentioned = team.filter((person) => quoted.toLowerCase().includes(`@${person.name.toLowerCase()}`)).map((person) => person.id)
      const context: ChatContextPayload = {
        title: canvas?.title,
        description: canvas?.description,
        trail: ancestors.map((item) => item.label),
        tab: activeTab?.label,
        subtab: activeSubtab?.label,
        viewKind,
        agentSlug,
        blocks: canvasBlocks(blocks()),
      }

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: conversation?.id,
            projectId: project.id,
            canvasSlug: selectedId,
            tabSlug,
            subtabSlug,
            agentSlug,
            title: canvas?.title,
            message: quoted,
            image,
            temporary: conversation?.temporary || false,
            context,
            replaceUserMessageId,
            mentions: mentioned,
          }),
        })
        if (!response.ok || !response.body) {
          throw new Error(await response.text())
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let liveId: string = assistantId
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const frames = buffer.split('\n\n')
          buffer = frames.pop() || ''
          for (const frame of frames) {
            const line = frame.replace(/^data:\s*/, '').trim()
            if (!line) continue
            const event = JSON.parse(line) as {
              type: string
              text?: string
              conversationId?: string
              messageId?: string
              artifacts?: AiArtifact[]
            }
            if (event.type === 'meta') {
              liveId = event.messageId || liveId
              if (event.conversationId && event.conversationId !== conversation?.id) {
                const detail = await aiApi.conversation(event.conversationId)
                setConversation(detail.conversation)
                setConversations((prev) => {
                  if (prev.some((item) => item.id === detail.conversation.id)) return prev
                  return [detail.conversation, ...prev]
                })
              }
            }
            if (event.type === 'delta' && event.text) {
              const target = liveId
              setMessages((prev) =>
                prev.map((item) => (item.id === target || item.id === assistantId ? { ...item, id: target, text: item.text + event.text } : item)),
              )
            }
            if (event.type === 'done') {
              if (event.artifacts) {
                setArtifacts((prev) => {
                  const ids = new Set(prev.map((item) => item.id))
                  return [...prev, ...event.artifacts!.filter((item) => !ids.has(item.id))]
                })
                if (event.artifacts[0]) {
                  setActiveArtifact(event.artifacts[0])
                  setRightTab('artifacts')
                }
              }
              if (mentioned.length) void reload()
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Chat failed')
        setMessages((prev) => prev.filter((item) => item.id !== assistantId))
      } finally {
        setStreaming(false)
      }
    },
    [
      activeSubtab?.label,
      activeTab?.label,
      ancestors,
      blocks,
      canvas?.description,
      canvas?.title,
      conversation,
      project,
      quote,
      selectedId,
      setRightOpen,
      setRightTab,
      viewKind,
      tabSlug,
      subtabSlug,
      agentSlug,
      team,
      reload,
    ],
  )

  const setAgent = useCallback(
    async (slug: string) => {
      setAgentSlug(slug)
      if (conversation) {
        const updated = await aiApi.patchConversation(conversation.id, { agentSlug: slug })
        setConversation(updated)
      }
    },
    [conversation],
  )

  const saveArtifact = useCallback(
    async (id: string) => {
      const hasDoc = Boolean(canvas?.tabs.some((tab) => tab.kind === 'doc'))
      const targetKind = hasDoc ? 'doc' : viewKind
      const result = await aiApi.saveArtifact(id, {
        menuItemId: selectedItem?.dbId ?? null,
        viewKind: targetKind,
      })
      setArtifacts((prev) => prev.map((item) => (item.id === id ? result.artifact : item)))
      await reload()
    },
    [canvas?.tabs, reload, selectedItem?.dbId, viewKind],
  )

  const searchConversations = useCallback((q: string) => aiApi.search(q), [])

  const createProject = useCallback(
    async (name: string) => {
      await aiApi.createProject({ name, kind: 'programme' })
      await applyWorkspace()
    },
    [applyWorkspace, conversation?.id],
  )

  const savePrefs = useCallback(
    async (next: AiPrefs) => {
      await api.saveSettings(prefsToSettings(next))
      await reload()
    },
    [reload],
  )

  const value = useMemo<AiContextValue>(
    () => ({
      status,
      prefs,
      savePrefs,
      projects,
      project,
      trail,
      conversations,
      conversation,
      messages,
      artifacts,
      activeArtifact,
      setActiveArtifact,
      fullscreenArtifact,
      setFullscreenArtifact,
      streaming,
      error,
      quote,
      setQuote,
      showArchived,
      setShowArchived,
      loadWorkspace,
      selectConversation,
      newChat,
      moveConversation,
      archiveConversation,
      pinConversation,
      forkConversation,
      sendMessage,
      saveArtifact,
      searchConversations,
      createProject,
      agents,
      team,
      agentSlug,
      setAgent,
      binding,
    }),
    [
      activeArtifact,
      archiveConversation,
      artifacts,
      agentSlug,
      agents,
      binding,
      conversation,
      conversations,
      createProject,
      error,
      forkConversation,
      fullscreenArtifact,
      loadWorkspace,
      messages,
      moveConversation,
      newChat,
      pinConversation,
      prefs,
      project,
      projects,
      quote,
      saveArtifact,
      savePrefs,
      searchConversations,
      selectConversation,
      sendMessage,
      setAgent,
      showArchived,
      status,
      streaming,
      team,
      trail,
    ],
  )

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>
}

export function useAi() {
  const ctx = useContext(AiContext)
  if (!ctx) throw new Error('useAi must be used within AiProvider')
  return ctx
}