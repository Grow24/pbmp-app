export type FilterFieldType = 'text' | 'number' | 'select' | 'date'

export type FilterOperator =
  | 'contains'
  | 'not_contains'
  | 'equals'
  | 'not_equals'
  | 'starts_with'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'before'
  | 'after'
  | 'is_empty'
  | 'is_not_empty'

export type FilterFieldOption = {
  value: string
  label: string
}

export type FilterField = {
  id: string
  label: string
  type: FilterFieldType
  options?: FilterFieldOption[]
}

export type FilterCondition = {
  id: string
  field: string
  operator: FilterOperator
  value: string
}

export type FilterCombinator = 'and' | 'or'

export type FilterQuery = {
  combinator: FilterCombinator
  conditions: FilterCondition[]
}

export type FilterRecord = Record<string, string | number | null | undefined>

export type FilterScope = 'global' | 'group' | 'pages'

export type SavedFilter = {
  id: number
  slug: string
  name: string
  description: string
  scope: FilterScope
  groupKey: string | null
  pageKeys: string[]
  query: FilterQuery
  isActive: boolean
  sortOrder: number
}

export type FilterPage = {
  key: string
  label: string
  group: string
  fields: string[]
}

export type FilterGroup = {
  key: string
  label: string
  hint: string
}
