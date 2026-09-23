export type AiRole = 'user' | 'assistant' | 'system'

export type InfoPathStep = {
  n: number
  title: string
  detail: string
}

export type InfoPath = {
  used: string
  provider?: string
  steps: InfoPathStep[]
}

export type AiMessage = {
  id: string
  role: AiRole
  text: string
  imageName?: string | null
  imageData?: string | null
  createdAt?: string
  path?: InfoPath | null
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
  useWhen?: string
  ask?: string
  instruction?: string
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
  kind: 'markdown' | 'mermaid' | 'html' | 'svg' | 'echarts' | 'echarts-panel' | string
  title: string
  body: string
  savedContentId: number | null
}

export type AiStatus = {
  configured: boolean
  model: string
  provider: string
}

export type AiTheme = 'light' | 'dark' | 'slate' | 'warm'
export type AiLayout = 'fixed' | 'movable'
export type AiStartupEvent = 'none' | 'open-chat' | 'quote-canvas' | 'speak-title'

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
  theme: AiTheme
  layout: AiLayout
  startupEvent: AiStartupEvent
  compactChat: boolean
}

export type AiImage = {
  name: string
  dataUrl: string
}

export type RightAiTab = 'chat' | 'projects' | 'artifacts' | 'agents' | 'highlight'