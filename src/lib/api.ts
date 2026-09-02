import type { BootstrapData, DbContent, DbItem, DbSection, DbSubtab, DbTab, SettingRow } from '../types'

const API = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || response.statusText)
  }
  return response.json() as Promise<T>
}

export const api = {
  bootstrap: () => request<BootstrapData>('/bootstrap'),
  settings: () => request<SettingRow[]>('/settings'),
  saveSettings: (values: Record<string, string>) =>
    request<SettingRow[]>('/settings', { method: 'PUT', body: JSON.stringify(values) }),
  sections: () => request<DbSection[]>('/sections'),
  saveSection: (payload: Partial<DbSection> & { slug: string; label: string }, id?: number) =>
    request<DbSection>(id ? `/sections/${id}` : '/sections', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    }),
  deleteSection: (id: number) => request(`/sections/${id}`, { method: 'DELETE' }),
  items: () => request<DbItem[]>('/items'),
  saveItem: (payload: Partial<DbItem>, id?: number) =>
    request<DbItem>(id ? `/items/${id}` : '/items', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    }),
  deleteItem: (id: number) => request(`/items/${id}`, { method: 'DELETE' }),
  tabs: (itemId?: number) => request<DbTab[]>(itemId ? `/tabs?itemId=${itemId}` : '/tabs'),
  saveTab: (payload: Partial<DbTab>, id?: number) =>
    request<DbTab>(id ? `/tabs/${id}` : '/tabs', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    }),
  deleteTab: (id: number) => request(`/tabs/${id}`, { method: 'DELETE' }),
  subtabs: (tabId?: number) => request<DbSubtab[]>(tabId ? `/subtabs?tabId=${tabId}` : '/subtabs'),
  saveSubtab: (payload: Partial<DbSubtab>, id?: number) =>
    request<DbSubtab>(id ? `/subtabs/${id}` : '/subtabs', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    }),
  deleteSubtab: (id: number) => request(`/subtabs/${id}`, { method: 'DELETE' }),
  content: (itemId?: number | 'null', viewKind?: string) => {
    const params = new URLSearchParams()
    if (itemId !== undefined) params.set('itemId', String(itemId))
    if (viewKind) params.set('viewKind', viewKind)
    return request<DbContent[]>(`/content?${params.toString()}`)
  },
  saveContent: (payload: Partial<DbContent>, id?: number) =>
    request<DbContent>(id ? `/content/${id}` : '/content', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    }),
  deleteContent: (id: number) => request(`/content/${id}`, { method: 'DELETE' }),
}
