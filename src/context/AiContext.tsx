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
import type { AiArtifact, AiConversation, AiMessage, AiPrefs, AiProject, AiStatus } from '../ai/types'
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
  const conversationRef = useRef<AiConversation | null>(null)
  conversationRef.current = conversation

  const prefs = useMemo(() => prefsFromSettings(settings), [settings])

  const applyWorkspace = useCallback(async (keepConversationId?: string) => {
    const data = await aiApi.workspace(selectedId, showArchived)
    setStatus(data.status)
    setProjects(data.projects)
    setProject(data.project)
    setTrail(data.trail)
    setConversations(data.conversations)
    const keep =
      (keepConversationId && data.conversations.find((item) => item.id === keepConversationId)) ||
      data.conversations.find((item) => item.canvasSlug === selectedId) ||
      data.conversations[0]
    if (keep) {
      const detail = await aiApi.conversation(keep.id)
      setConversation(detail.conversation)
      setMessages(detail.messages)
      setArtifacts(detail.artifacts)
    } else {
      setConversation(null)
      setMessages([])
      setArtifacts([])
    }
  }, [selectedId, showArchived])

  const loadWorkspace = useCallback(async () => {
    try {
      await applyWorkspace(conversationRef.current?.id)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load AI workspace')
    }
  }, [applyWorkspace])

  useEffect(() => {
    if (!selectedId) return
    applyWorkspace().catch((err: Error) => setError(err.message))
  }, [selectedId, showArchived, applyWorkspace])

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
    [project, selectedId, setRightOpen, setRightTab],
  )

  const moveConversation = useCallback(
    async (projectId: number) => {
      if (!conversation) return
      const updated = await aiApi.patchConversation(conversation.id, { projectId })
      setConversation(updated)
      await applyWorkspace(updated.id)
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
      await applyWorkspace(created.id)
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

      const context: ChatContextPayload = {
        title: canvas?.title,
        description: canvas?.description,
        trail: ancestors.map((item) => item.label),
        tab: activeTab?.label,
        subtab: activeSubtab?.label,
        viewKind,
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
            title: canvas?.title,
            message: quoted,
            image,
            temporary: conversation?.temporary || false,
            context,
            replaceUserMessageId,
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
    ],
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
      await applyWorkspace(conversation?.id)
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
    }),
    [
      activeArtifact,
      archiveConversation,
      artifacts,
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
      showArchived,
      status,
      streaming,
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