import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../lib/api'
import { applyFilters } from '../components/filter/applyFilter'
import { fieldIdsForPage } from '../components/filter/catalog'
import { blockToRecord } from '../components/filter/records'
import { filtersForPage } from '../components/filter/scope'
import type { SavedFilter } from '../components/filter/types'
import type {
  AppSettings,
  BootstrapData,
  CanvasTab,
  ChatMessage,
  ContentBlock,
  HighlightItem,
  MenuItem,
  MenuSection,
  SubTab,
  ViewKind,
} from '../types'

type RightTab = 'chat' | 'highlight'

type WorkbenchContextValue = {
  loading: boolean
  error: string | null
  settings: AppSettings
  menuSections: MenuSection[]
  selectedId: string
  selectedItem: MenuItem | undefined
  ancestors: MenuItem[]
  canvas: MenuItem['canvas']
  activeTab: CanvasTab | undefined
  activeSubtab: SubTab | undefined
  viewKind: ViewKind
  expandedIds: string[]
  sidebarCollapsed: boolean
  mobileNavOpen: boolean
  rightOpen: boolean
  rightTab: RightTab
  search: string
  chat: ChatMessage[]
  highlights: HighlightItem[]
  blocks: (kind?: string) => ContentBlock[]
  reload: () => Promise<BootstrapData>
  selectItem: (id: string) => void
  setTab: (id: string) => void
  setSubtab: (id: string) => void
  toggleExpanded: (id: string) => void
  setSidebarCollapsed: (value: boolean) => void
  setMobileNavOpen: (value: boolean) => void
  setRightOpen: (value: boolean) => void
  setRightTab: (value: RightTab) => void
  setSearch: (value: string) => void
  sendChat: (text: string) => void
  savedFilters: SavedFilter[]
  activeFilterIds: number[]
  toggleFilter: (id: number) => void
  filterItems: <T extends ContentBlock>(items: T[]) => T[]
}

const WorkbenchContext = createContext<WorkbenchContextValue | null>(null)

function flattenItems(items: MenuItem[]): MenuItem[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenItems(item.children) : [])])
}

function findItem(id: string, sections: MenuSection[]) {
  return flattenItems(sections.flatMap((section) => section.items)).find((item) => item.id === id)
}

function findAncestors(id: string, items: MenuItem[], trail: MenuItem[] = []): MenuItem[] | null {
  for (const item of items) {
    if (item.id === id) return [...trail, item]
    if (item.children) {
      const found = findAncestors(id, item.children, [...trail, item])
      if (found) return found
    }
  }
  return null
}

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BootstrapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [tabId, setTabId] = useState('')
  const [subtabId, setSubtabId] = useState('')
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth >= 1280,
  )
  const [rightTab, setRightTab] = useState<RightTab>('chat')
  const [search, setSearch] = useState('')
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [activeFilterIds, setActiveFilterIds] = useState<number[]>(() => {
    try {
      const raw = window.sessionStorage.getItem('pbmp-active-filters')
      return raw ? (JSON.parse(raw) as number[]) : []
    } catch {
      return []
    }
  })

  const reload = useCallback(async () => {
    const next = await api.bootstrap()
    setData(next)
    setError(null)
    return next
  }, [])

  useEffect(() => {
    reload()
      .then((next) => {
        const defaultId =
          next.settings.default_menu ||
          next.sections[0]?.items.find((item) => item.id === 'dashboard')?.id ||
          next.sections[0]?.items[0]?.id ||
          ''
        setSelectedId((prev) => prev || defaultId)
        const trail =
          findAncestors(defaultId, next.sections.flatMap((section) => section.items)) ?? []
        setExpandedIds(trail.slice(0, -1).map((node) => node.id))
        if (next.settings.chat_welcome) {
          setChat((prev) =>
            prev.length
              ? prev
              : [{ id: 'welcome', role: 'assistant', text: next.settings.chat_welcome }],
          )
        }
      })
      .catch((err: Error) => setError(err.message || 'Could not load configuration'))
      .finally(() => setLoading(false))
  }, [reload])

  useEffect(() => {
    const onFocus = () => {
      reload().catch(() => undefined)
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [reload])

  const settings = data?.settings ?? {}
  const menuSections = data?.sections ?? []
  const selectedItem = useMemo(() => findItem(selectedId, menuSections), [menuSections, selectedId])
  const ancestors = useMemo(
    () => findAncestors(selectedId, menuSections.flatMap((section) => section.items)) ?? [],
    [menuSections, selectedId],
  )
  const canvas = selectedItem?.canvas
  const activeTab = canvas?.tabs.find((tab) => tab.id === tabId) ?? canvas?.tabs[0]
  const activeSubtab =
    activeTab?.subtabs?.find((tab) => tab.id === subtabId) ?? activeTab?.subtabs?.[0]
  const viewKind = (activeSubtab?.kind ?? activeTab?.kind ?? 'dashboard') as ViewKind

  const selectItem = useCallback(
    (id: string) => {
      const item = findItem(id, menuSections)
      if (!item?.canvas) return
      setSelectedId(id)
      const firstTab = item.canvas.tabs[0]
      setTabId(firstTab?.id ?? '')
      setSubtabId(firstTab?.subtabs?.[0]?.id ?? '')
      const trail = findAncestors(id, menuSections.flatMap((section) => section.items)) ?? []
      setExpandedIds((prev) => Array.from(new Set([...prev, ...trail.map((node) => node.id)])))
      setMobileNavOpen(false)
    },
    [menuSections],
  )

  const setTab = useCallback(
    (id: string) => {
      setTabId(id)
      const next = canvas?.tabs.find((tab) => tab.id === id)
      setSubtabId(next?.subtabs?.[0]?.id ?? '')
    },
    [canvas],
  )

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }, [])

  const sendChat = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const title = canvas?.title ?? 'this workspace'
      setChat((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'user', text: trimmed },
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: `Noted on ${title}. I will keep this against the ${activeTab?.label ?? 'current'} view so the team can pick it up in highlights.`,
        },
      ])
    },
    [activeTab?.label, canvas?.title],
  )

  const blocks = useCallback(
    (kind?: string) => {
      const view = kind ?? viewKind
      return data?.content?.[selectedId]?.[view] ?? []
    },
    [data, selectedId, viewKind],
  )

  const highlights: HighlightItem[] = useMemo(
    () =>
      (data?.content?._global?.highlight ?? []).map((item) => ({
        id: String(item.id),
        title: item.title || '',
        note: item.body || '',
        author: item.subtitle || '',
        time: item.value || '',
        tone: (String(item.extra.tone || 'insight') as HighlightItem['tone']),
      })),
    [data],
  )

  const savedFilters = data?.filters ?? []

  useEffect(() => {
    window.sessionStorage.setItem('pbmp-active-filters', JSON.stringify(activeFilterIds))
  }, [activeFilterIds])

  const toggleFilter = useCallback((id: number) => {
    setActiveFilterIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }, [])

  const filterItems = useCallback(
    <T extends ContentBlock>(items: T[]) => {
      const assigned = filtersForPage(savedFilters, viewKind).filter((filter) => activeFilterIds.includes(filter.id))
      if (!assigned.length) return items
      const allowed = fieldIdsForPage(viewKind)
      const records = items.map((item) => blockToRecord(item, viewKind))
      const kept = new Set(
        applyFilters(
          records,
          assigned.map((filter) => filter.query),
          allowed,
        ).map((row) => Number(row.id)),
      )
      return items.filter((item) => kept.has(item.id))
    },
    [activeFilterIds, savedFilters, viewKind],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const value = useMemo<WorkbenchContextValue>(
    () => ({
      loading,
      error,
      settings,
      menuSections,
      selectedId,
      selectedItem,
      ancestors,
      canvas,
      activeTab,
      activeSubtab,
      viewKind,
      expandedIds,
      sidebarCollapsed,
      mobileNavOpen,
      rightOpen,
      rightTab,
      search,
      chat,
      highlights,
      blocks,
      reload,
      selectItem,
      setTab,
      setSubtab: setSubtabId,
      toggleExpanded,
      setSidebarCollapsed,
      setMobileNavOpen,
      setRightOpen,
      setRightTab,
      setSearch,
      sendChat,
      savedFilters,
      activeFilterIds,
      toggleFilter,
      filterItems,
    }),
    [
      activeSubtab,
      activeTab,
      ancestors,
      blocks,
      canvas,
      chat,
      error,
      expandedIds,
      highlights,
      loading,
      menuSections,
      mobileNavOpen,
      reload,
      rightOpen,
      rightTab,
      search,
      selectItem,
      selectedId,
      selectedItem,
      sendChat,
      setTab,
      settings,
      sidebarCollapsed,
      toggleExpanded,
      toggleFilter,
      viewKind,
      savedFilters,
      activeFilterIds,
      filterItems,
    ],
  )

  return <WorkbenchContext.Provider value={value}>{children}</WorkbenchContext.Provider>
}

export function useWorkbench() {
  const ctx = useContext(WorkbenchContext)
  if (!ctx) throw new Error('useWorkbench must be used within WorkbenchProvider')
  return ctx
}
