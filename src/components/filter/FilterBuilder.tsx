import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { defaultOperator, operatorNeedsValue, operatorsFor } from './operators'
import { createCondition, emptyQuery } from './query'
import type { FilterCondition, FilterField, FilterQuery } from './types'

type FilterBuilderProps = {
  fields: FilterField[]
  value?: FilterQuery
  defaultValue?: FilterQuery
  onChange?: (query: FilterQuery) => void
  onApply?: (query: FilterQuery) => void
  onReset?: () => void
  applyOnChange?: boolean
  showApply?: boolean
  title?: string
  className?: string
}

function FieldControl({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`[&>input]:h-8 [&>input]:w-full [&>input]:rounded [&>input]:border [&>input]:border-slate-200 [&>input]:bg-white [&>input]:px-2 [&>input]:text-[13px] [&>input]:outline-none [&>input]:focus:border-brand-500 [&>select]:h-8 [&>select]:w-full [&>select]:rounded [&>select]:border [&>select]:border-slate-200 [&>select]:bg-white [&>select]:px-2 [&>select]:text-[13px] [&>select]:outline-none [&>select]:focus:border-brand-500 ${className || ''}`}>
      {children}
    </div>
  )
}

function ValueInput({
  field,
  condition,
  onChange,
}: {
  field: FilterField | undefined
  condition: FilterCondition
  onChange: (value: string) => void
}) {
  if (!operatorNeedsValue(condition.operator)) {
    return <div className="h-8 min-w-[140px] flex-1 rounded border border-dashed border-slate-200 bg-slate-50" />
  }

  if (field?.type === 'select') {
    return (
      <FieldControl className="min-w-[140px] flex-1">
        <select value={condition.value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Select…</option>
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FieldControl>
    )
  }

  const inputType = field?.type === 'number' ? 'number' : field?.type === 'date' ? 'date' : 'text'
  return (
    <FieldControl className="min-w-[140px] flex-1">
      <input
        type={inputType}
        value={condition.value}
        placeholder="Value"
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldControl>
  )
}

export function FilterBuilder({
  fields,
  value,
  defaultValue,
  onChange,
  onApply,
  onReset,
  applyOnChange = false,
  showApply = true,
  title = 'Filter',
  className = '',
}: FilterBuilderProps) {
  const [internal, setInternal] = useState<FilterQuery>(defaultValue ?? emptyQuery(fields))
  const query = value ?? internal

  const commit = (next: FilterQuery) => {
    if (value == null) setInternal(next)
    onChange?.(next)
    if (applyOnChange) onApply?.(next)
  }

  const updateCondition = (id: string, patch: Partial<FilterCondition>) => {
    commit({
      ...query,
      conditions: query.conditions.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    })
  }

  const changeField = (id: string, fieldId: string) => {
    const field = fields.find((item) => item.id === fieldId)
    updateCondition(id, {
      field: fieldId,
      operator: field ? defaultOperator(field.type) : 'contains',
      value: '',
    })
  }

  const addCondition = () => {
    commit({ ...query, conditions: [...query.conditions, createCondition(fields)] })
  }

  const removeCondition = (id: string) => {
    const nextRows = query.conditions.filter((row) => row.id !== id)
    commit({
      ...query,
      conditions: nextRows.length ? nextRows : [createCondition(fields)],
    })
  }

  const reset = () => {
    const next = emptyQuery(fields)
    commit(next)
    onReset?.()
    onApply?.(next)
  }

  const apply = () => onApply?.(query)

  const activeCount = useMemo(
    () => query.conditions.filter((row) => row.field && (row.value || !operatorNeedsValue(row.operator))).length,
    [query.conditions],
  )

  return (
    <section className={`ui-card ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-[13px] font-medium text-slate-900">{title}</h2>
          <p className="text-[11px] text-slate-400">
            {activeCount ? `${activeCount} condition${activeCount === 1 ? '' : 's'}` : 'No conditions applied'}
          </p>
        </div>
        <div className="flex items-center rounded border border-slate-200 p-0.5 text-[11px]">
          {(['and', 'or'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => commit({ ...query, combinator: item })}
              className={`rounded px-2 py-1 font-medium capitalize ${
                query.combinator === item ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Match {item === 'and' ? 'all' : 'any'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 px-4 py-3">
        {query.conditions.map((condition, index) => {
          const field = fields.find((item) => item.id === condition.field)
          const ops = operatorsFor(field?.type || 'text')
          return (
            <div key={condition.id} className="flex flex-wrap items-center gap-2">
              <span className="w-12 shrink-0 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {index === 0 ? 'Where' : query.combinator}
              </span>
              <FieldControl className="w-[150px]">
                <select value={condition.field} onChange={(event) => changeField(condition.id, event.target.value)}>
                  {fields.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </FieldControl>
              <FieldControl className="w-[150px]">
                <select
                  value={condition.operator}
                  onChange={(event) =>
                    updateCondition(condition.id, {
                      operator: event.target.value as FilterCondition['operator'],
                      value: operatorNeedsValue(event.target.value as FilterCondition['operator'])
                        ? condition.value
                        : '',
                    })
                  }
                >
                  {ops.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </FieldControl>
              <ValueInput
                field={field}
                condition={condition}
                onChange={(next) => updateCondition(condition.id, { value: next })}
              />
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-slate-50 hover:text-rose-500"
                aria-label="Remove condition"
                onClick={() => removeCondition(condition.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
        <button type="button" className="ui-btn h-8 px-2.5 text-xs" onClick={addCondition}>
          <Plus className="h-3.5 w-3.5" />
          Add condition
        </button>
        <div className="flex items-center gap-2">
          <button type="button" className="ui-btn h-8 px-2.5 text-xs" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          {showApply && (
            <button type="button" className="ui-btn-primary h-8 px-3 text-xs" onClick={apply}>
              Apply filter
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
