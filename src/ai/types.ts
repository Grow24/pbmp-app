export type AiRole = 'user' | 'assistant' | 'system'

export type AiMessage = {
  id: string
  role: AiRole
  text: string
  imageName?: string | null
  imageData?: string | null
  createdAt?: string
}

export type AiProject = {
  id: number
  slug: string
  name: string
  kind: string
  menuItemId: number | null
  description: string
}

export type AiConversation = {
  id: string
  projectId: number
  canvasSlug: string
  tabSlug?: string
  subtabSlug?: string
  agentSlug?: string
  title: string
  archived: boolean
  pinned: boolean
  temporary: boolean
  updatedAt: string
}

export type AiAgent = {
  slug: string
  name: string
  role: string
}

export type AiTeammate = {
  id: string
  name: string
  role: string
}

export type AiArtifact = {
  id: string
  conversationId: string
  messageId: string
  kind: 'markdown' | 'mermaid' | 'html' | 'svg' | string
  title: string
  body: string
  savedContentId: number | null
}

export type AiStatus = {
  configured: boolean
  model: string
  provider: string
}

export type AiPrefs = {
  autoScroll: boolean
  stt: boolean
  tts: boolean
  ttsAutoplay: boolean
  speechLang: string
  autoSendMs: number
  imageResize: boolean
  longPaste: boolean
  clock24h: boolean
  weekStart: number
}

export type AiImage = {
  name: string
  dataUrl: string
}

export type RightAiTab = 'chat' | 'projects' | 'artifacts' | 'agents' | 'highlight'