import type { FilterField, FilterGroup, FilterPage } from './types'

export const SHARED_FILTER_FIELDS: FilterField[] = [
  { id: 'title', label: 'Item', type: 'text' },
  {
    id: 'workspace',
    label: 'Workspace',
    type: 'select',
    options: [
      { value: 'Strategy', label: 'Strategy' },
      { value: 'Business', label: 'Business' },
      { value: 'Studio', label: 'Studio' },
      { value: 'Dashboard', label: 'Dashboard' },
    ],
  },
  { id: 'owner', label: 'Owner', type: 'text' },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'Draft', label: 'Draft' },
      { value: 'In review', label: 'In review' },
      { value: 'Shared', label: 'Shared' },
      { value: 'Open', label: 'Open' },
    ],
  },
  { id: 'items', label: 'Item count', type: 'number' },
  { id: 'updated', label: 'Updated', type: 'date' },
]

export const FILTER_PAGES: FilterPage[] = [
  { key: 'dashboard', label: 'Dashboard manager', group: 'workspace', fields: ['title', 'workspace', 'owner', 'status', 'items', 'updated'] },
  { key: 'filter', label: 'Filter manager', group: 'workspace', fields: ['title', 'workspace', 'owner', 'status', 'items', 'updated'] },
  { key: 'assess', label: 'Assess AS IS', group: 'workspace', fields: ['title', 'owner', 'status'] },
  { key: 'maps', label: 'Maps', group: 'workspace', fields: ['title'] },
  { key: 'inquiry', label: 'Inquiry', group: 'workspace', fields: ['title', 'owner'] },
  { key: 'swot', label: 'SWOT', group: 'workspace', fields: ['title'] },
  { key: 'market', label: 'Market Dynamics', group: 'reports', fields: ['title', 'workspace', 'status'] },
  { key: 'doc', label: 'Strategy Doc', group: 'reports', fields: ['title', 'owner', 'status'] },
  { key: 'tool', label: 'Studio tools', group: 'studio', fields: ['title', 'workspace'] },
  { key: 'account', label: 'Account', group: 'account', fields: ['title'] },
  { key: 'about', label: 'About', group: 'account', fields: ['title'] },
]

export const FILTER_GROUPS: FilterGroup[] = [
  { key: 'workspace', label: 'Workspace pages', hint: 'Dashboard, Filter, Assess, Maps, Inquiry, SWOT' },
  { key: 'reports', label: 'Report manager', hint: 'Market Dynamics and Strategy Doc' },
  { key: 'studio', label: 'Studio pages', hint: 'Map, Sheet, BPMN and other tools' },
  { key: 'account', label: 'Account pages', hint: 'Account and About' },
]

export function pageByKey(pageKey: string) {
  return FILTER_PAGES.find((page) => page.key === pageKey)
}

export function pagesInGroup(groupKey: string) {
  return FILTER_PAGES.filter((page) => page.group === groupKey)
}

export function fieldsForPage(pageKey: string): FilterField[] {
  const allowed = new Set(pageByKey(pageKey)?.fields ?? SHARED_FILTER_FIELDS.map((field) => field.id))
  return SHARED_FILTER_FIELDS.filter((field) => allowed.has(field.id))
}

export function fieldIdsForPage(pageKey: string) {
  return fieldsForPage(pageKey).map((field) => field.id)
}
