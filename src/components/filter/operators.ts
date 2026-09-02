import type { FilterFieldType, FilterOperator } from './types'

type OperatorMeta = {
  value: FilterOperator
  label: string
}

const TEXT_OPS: OperatorMeta[] = [
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'equals', label: 'is' },
  { value: 'not_equals', label: 'is not' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
]

const NUMBER_OPS: OperatorMeta[] = [
  { value: 'equals', label: '=' },
  { value: 'not_equals', label: '≠' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
]

const SELECT_OPS: OperatorMeta[] = [
  { value: 'equals', label: 'is' },
  { value: 'not_equals', label: 'is not' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
]

const DATE_OPS: OperatorMeta[] = [
  { value: 'equals', label: 'is' },
  { value: 'before', label: 'is before' },
  { value: 'after', label: 'is after' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
]

export function operatorsFor(type: FilterFieldType): OperatorMeta[] {
  if (type === 'number') return NUMBER_OPS
  if (type === 'select') return SELECT_OPS
  if (type === 'date') return DATE_OPS
  return TEXT_OPS
}

export function defaultOperator(type: FilterFieldType): FilterOperator {
  return operatorsFor(type)[0].value
}

export function operatorNeedsValue(operator: FilterOperator) {
  return operator !== 'is_empty' && operator !== 'is_not_empty'
}
