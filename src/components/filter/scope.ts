import { pagesInGroup } from './catalog'
import type { SavedFilter } from './types'

export function targetPages(filter: SavedFilter): string[] {
  if (filter.scope === 'global') return ['*']
  if (filter.scope === 'group' && filter.groupKey) {
    return pagesInGroup(filter.groupKey).map((page) => page.key)
  }
  return filter.pageKeys
}

export function filterAppliesToPage(filter: SavedFilter, pageKey: string) {
  if (!filter.isActive) return false
  if (filter.scope === 'global') return true
  return targetPages(filter).includes(pageKey)
}

export function filtersForPage(filters: SavedFilter[], pageKey: string) {
  return filters.filter((filter) => filterAppliesToPage(filter, pageKey))
}

export function scopeLabel(filter: SavedFilter) {
  if (filter.scope === 'global') return 'All pages'
  if (filter.scope === 'group') {
    if (filter.groupKey === 'reports') return 'Report manager'
    if (filter.groupKey === 'workspace') return 'Workspace pages'
    if (filter.groupKey === 'studio') return 'Studio pages'
    if (filter.groupKey === 'account') return 'Account pages'
    return filter.groupKey || 'Group'
  }
  if (filter.pageKeys.length === 1) {
    const key = filter.pageKeys[0]
    if (key === 'dashboard') return 'Dashboard manager'
    return key
  }
  return `${filter.pageKeys.length} pages`
}
