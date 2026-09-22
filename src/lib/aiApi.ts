import type { AiArtifact, AiConversation, AiMessage, AiProject, AiStatus } from '../ai/types'

export type WorkspacePayload = {
  status: AiStatus
  project: AiProject | null
  projects: AiProject[]
  trail: string[]
  conversations: AiConversation[]
}

export type ConversationDetail = {
  conversation: AiConversation
  messages: AiMessage[]
  artifacts: AiArtifact[]
}

export type ChatContextPayload = {
  title?: string
  description?: string
  trail?: string[]
  tab?: string
  subtab?: string
  viewKind?: string
  blocks?: Array<{ type?: string; title?: string; subtitle?: string; value?: string; body?: string }>
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || response.statusText)
  }
  return response.json() as Promise<T>
}

export const aiApi = {
  workspace: (canvasSlug: string, archived = false) =>
    fetch(`/api/ai/workspace?canvasSlug=${encodeURIComponent(canvasSlug)}&archived=${archived ? '1' : '0'}`).then((r) =>
      readJson<WorkspacePayload>(r),
    ),
  conversation: (id: string) => fetch(`/api/ai/conversations/${id}`).then((r) => readJson<ConversationDetail>(r)),
  createConversation: (payload: { projectId: number; canvasSlug?: string; title?: string; temporary?: boolean }) =>
    fetch('/api/ai/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((r) => readJson<AiConversation>(r)),
  patchConversation: (id: string, payload: Partial<{ projectId: number; title: string; archived: boolean; pinned: boolean; temporary: boolean; canvasSlug: string }>) =>
    fetch(`/api/ai/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((r) => readJson<AiConversation>(r)),
  deleteConversation: (id: string) => fetch(`/api/ai/conversations/${id}`, { method: 'DELETE' }).then((r) => readJson<{ ok: boolean }>(r)),
  forkConversation: (id: string, upToMessageId?: string) =>
    fetch(`/api/ai/conversations/${id}/fork`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upToMessageId }),
    }).then((r) => readJson<AiConversation>(r)),
  search: (q: string) => fetch(`/api/ai/search?q=${encodeURIComponent(q)}`).then((r) => readJson<AiConversation[]>(r)),
  createProject: (payload: { name: string; kind?: string; description?: string }) =>
    fetch('/api/ai/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((r) => readJson<AiProject>(r)),
  saveArtifact: (id: string, payload: { menuItemId: number | null; viewKind: string }) =>
    fetch(`/api/ai/artifacts/${id}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((r) => readJson<{ artifact: AiArtifact }>(r)),
}