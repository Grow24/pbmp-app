import { defaultOperator, operatorNeedsValue } from './operators'
import type { FilterCondition, FilterField, FilterQuery } from './types'

export function createCondition(fields: FilterField[], fieldId?: string): FilterCondition {
  const field = fields.find((item) => item.id === fieldId) ?? fields[0]
  return {
    id: crypto.randomUUID(),
    field: field?.id ?? '',
    operator: field ? defaultOperator(field.type) : 'contains',
    value: '',
  }
}

export function emptyQuery(fields: FilterField[] = []): FilterQuery {
  return {
    combinator: 'and',
    conditions: fields.length ? [createCondition(fields)] : [],
  }
}

export function isConditionActive(condition: FilterCondition) {
  if (!condition.field) return false
  if (!operatorNeedsValue(condition.operator)) return true
  return String(condition.value ?? '').trim() !== ''
}

export function isQueryEmpty(query: FilterQuery) {
  return !query.conditions.some(isConditionActive)
}
