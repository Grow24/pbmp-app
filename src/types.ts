export type ViewKind =
  | 'dashboard'
  | 'filter'
  | 'assess'
  | 'maps'
  | 'inquiry'
  | 'market'
  | 'swot'
  | 'doc'
  | 'tool'
  | 'account'
  | 'about'
  | 'highlight'

export type SubTab = {
  id: string
  dbId?: number
  label: string
  kind: ViewKind
}

export type CanvasTab = {
  id: string
  dbId?: number
  label: string
  kind: ViewKind
  subtabs?: SubTab[]
}

export type CanvasConfig = {
  title: string
  eyebrow: string
  description: string
  tabs: CanvasTab[]
}

export type MenuItem = {
  id: string
  dbId?: number
  label: string
  icon: string
  children?: MenuItem[]
  canvas?: CanvasConfig
}

export type MenuSection = {
  id: string
  dbId?: number
  label: string
  items: MenuItem[]
}

export type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  text: string
}

export type HighlightItem = {
  id: string
  title: string
  note: string
  author: string
  time: string
  tone: 'insight' | 'risk' | 'action'
}

export type ContentBlock = {
  id: number
  menuItemId: number | null
  viewKind: string
  blockType: string
  title: string | null
  subtitle: string | null
  body: string | null
  value: string | null
  extra: Record<string, unknown>
  sortOrder: number
}

export type AppSettings = Record<string, string>

export type BootstrapData = {
  settings: AppSettings
  settingRows: SettingRow[]
  sections: MenuSection[]
  content: Record<string, Record<string, ContentBlock[]>>
}

export type SettingRow = {
  setting_key: string
  setting_value: string
  group_name: string
  label: string
  input_type: string
  sort_order: number
}

export type DbSection = {
  id: number
  slug: string
  label: string
  sort_order: number
}

export type DbItem = {
  id: number
  slug: string
  section_id: number
  parent_id: number | null
  label: string
  icon: string
  sort_order: number
  canvas_title: string | null
  canvas_eyebrow: string | null
  canvas_description: string | null
}

export type DbTab = {
  id: number
  slug: string
  menu_item_id: number
  label: string
  view_kind: string
  sort_order: number
}

export type DbSubtab = {
  id: number
  slug: string
  tab_id: number
  label: string
  view_kind: string
  sort_order: number
}

export type DbContent = {
  id: number
  menu_item_id: number | null
  view_kind: string
  block_type: string
  title: string | null
  subtitle: string | null
  body: string | null
  value_text: string | null
  extra_json: Record<string, unknown>
  sort_order: number
}
