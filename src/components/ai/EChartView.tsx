import { useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts'
import { fieldIdsForPage } from '../filter/catalog'
import { filtersForPage } from '../filter/scope'
import { useWorkbench } from '../../context/WorkbenchContext'
import { filterEchartsOption } from './filterEcharts'

function parseOption(body: string): echarts.EChartsOption | null {
  try {
    const option = JSON.parse(body) as echarts.EChartsOption
    if (!option || typeof option !== 'object' || Array.isArray(option)) return null
    return option
  } catch {
    return null
  }
}

export type PanelChart = {
  type?: string
  title?: string
  option: Record<string, unknown>
}

export type PanelSpec = {
  panel?: boolean
  title?: string
  charts: PanelChart[]
}

export function EChartView({
  optionJson,
  height = 380,
  showFilters = true,
}: {
  optionJson: string
  height?: number
  showFilters?: boolean
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  const { viewKind, blocks, filterItems, savedFilters, activeFilterIds, toggleFilter } = useWorkbench()

  const assigned = useMemo(
    () => filtersForPage(savedFilters, viewKind).filter((filter) => activeFilterIds.includes(filter.id)),
    [activeFilterIds, savedFilters, viewKind],
  )
  const pageFilters = useMemo(() => filtersForPage(savedFilters, viewKind), [savedFilters, viewKind])

  const parsed = useMemo(() => parseOption(optionJson), [optionJson])
  const filtered = useMemo(() => {
    if (!parsed) return null
    const keepNames = assigned.length ? filterItems(blocks()).map((item) => item.title || '').filter(Boolean) : null
    return filterEchartsOption(
      parsed as Record<string, unknown>,
      keepNames,
      assigned.map((filter) => filter.query),
      fieldIdsForPage(viewKind),
      viewKind,
    )
  }, [assigned, blocks, filterItems, parsed, viewKind])

  const option = filtered?.option as echarts.EChartsOption | undefined

  useEffect(() => {
    const host = hostRef.current
    if (!parsed) {
      setError('This EChart option is not valid JSON.')
      return
    }
    if (!host || !option) return
    setError('')
    let chart: echarts.ECharts | undefined
    try {
      chart = echarts.init(host)
      chart.setOption(option, true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not render this EChart.')
      return
    }
    const resize = () => chart?.resize()
    const frame = window.requestAnimationFrame(resize)
    window.addEventListener('resize', resize)
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      observer.disconnect()
      chart?.dispose()
    }
  }, [option, parsed, height])

  const emptyFiltered = Boolean(parsed && filtered && filtered.total > 0 && filtered.shown === 0)

  return (
    <div className="space-y-2">
      {showFilters && pageFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Filters</span>
          {pageFilters.map((filter) => {
            const on = activeFilterIds.includes(filter.id)
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => toggleFilter(filter.id)}
                className={`rounded border px-2 py-0.5 text-[11px] ${
                  on
                    ? 'border-brand-500 bg-brand-50 font-medium text-brand-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-brand-400'
                }`}
              >
                {filter.name}
              </button>
            )
          })}
          {assigned.length > 0 && filtered && (
            <span className="text-[11px] text-slate-400">
              {filtered.shown} of {filtered.total} rows
            </span>
          )}
        </div>
      )}
      {error && (
        <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">{error}</p>
      )}
      {emptyFiltered && (
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
          No chart rows match the ON filters. Turn a filter off to see the full series.
        </p>
      )}
      <div
        ref={hostRef}
        className={`w-full rounded border border-slate-200 bg-white ${error || emptyFiltered ? 'hidden' : ''}`}
        style={{ height }}
      />
    </div>
  )
}
