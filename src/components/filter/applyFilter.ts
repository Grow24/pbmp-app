import { isConditionActive, isQueryEmpty } from './query'
import { operatorNeedsValue } from './operators'
import type { FilterCondition, FilterQuery, FilterRecord } from './types'

function cellText(value: unknown) {
  if (value == null) return ''
  return String(value)
}

function isBlank(value: unknown) {
  return value == null || cellText(value).trim() === ''
}

function match(cell: unknown, condition: FilterCondition) {
  const operator = condition.operator
  if (operator === 'is_empty') return isBlank(cell)
  if (operator === 'is_not_empty') return !isBlank(cell)
  if (!operatorNeedsValue(operator)) return true

  const left = cellText(cell)
  const right = cellText(condition.value)
  const leftNum = Number(left)
  const rightNum = Number(right)
  const bothNumeric = left !== '' && right !== '' && !Number.isNaN(leftNum) && !Number.isNaN(rightNum)

  switch (operator) {
    case 'contains':
      return left.toLowerCase().includes(right.toLowerCase())
    case 'not_contains':
      return !left.toLowerCase().includes(right.toLowerCase())
    case 'equals':
      return bothNumeric ? leftNum === rightNum : left.toLowerCase() === right.toLowerCase()
    case 'not_equals':
      return bothNumeric ? leftNum !== rightNum : left.toLowerCase() !== right.toLowerCase()
    case 'starts_with':
      return left.toLowerCase().startsWith(right.toLowerCase())
    case 'gt':
      return bothNumeric && leftNum > rightNum
    case 'gte':
      return bothNumeric && leftNum >= rightNum
    case 'lt':
      return bothNumeric && leftNum < rightNum
    case 'lte':
      return bothNumeric && leftNum <= rightNum
    case 'before':
      return left !== '' && right !== '' && left < right
    case 'after':
      return left !== '' && right !== '' && left > right
    default:
      return true
  }
}

export function applyFilter<T extends FilterRecord>(
  rows: T[],
  query: FilterQuery,
  allowedFields?: string[],
): T[] {
  if (isQueryEmpty(query)) return rows
  const active = query.conditions.filter(
    (condition) =>
      isConditionActive(condition) && (!allowedFields || allowedFields.includes(condition.field)),
  )
  if (!active.length) return rows

  return rows.filter((row) => {
    const hits = active.map((condition) => match(row[condition.field], condition))
    return query.combinator === 'or' ? hits.some(Boolean) : hits.every(Boolean)
  })
}

export function applyFilters<T extends FilterRecord>(
  rows: T[],
  queries: FilterQuery[],
  allowedFields?: string[],
): T[] {
  return queries.reduce((acc, query) => applyFilter(acc, query, allowedFields), rows)
}
