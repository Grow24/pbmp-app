import { applyFilters } from '../filter/applyFilter'
import type { FilterQuery, FilterRecord } from '../filter/types'

type ChartRow = { index: number; name: string; value: number }

type AnyOption = Record<string, unknown>

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function seriesList(option: AnyOption): AnyOption[] {
  const series = option.series
  if (Array.isArray(series)) return series as AnyOption[]
  if (series && typeof series === 'object') return [series as AnyOption]
  return []
}

function categoryNames(option: AnyOption): string[] {
  const axis = option.xAxis
  const first = Array.isArray(axis) ? axis[0] : axis
  const data = first && typeof first === 'object' ? (first as AnyOption).data : null
  return Array.isArray(data) ? data.map((item) => String(item)) : []
}

export function extractChartRows(option: AnyOption): ChartRow[] {
  const series = seriesList(option)
  const first = series[0]
  if (!first) return []

  if (first.type === 'pie' || first.type === 'funnel' || first.type === 'gauge') {
    const data = Array.isArray(first.data) ? first.data : []
    return data.map((item, index) => {
      const row = item && typeof item === 'object' ? (item as { name?: string; value?: number }) : { value: Number(item) }
      return { index, name: String(row.name || `Item ${index + 1}`), value: Number(row.value) || 0 }
    })
  }

  if (first.type === 'radar') {
    const radar = option.radar
    const radarObj = Array.isArray(radar) ? radar[0] : radar
    const indicator = radarObj && typeof radarObj === 'object' ? (radarObj as AnyOption).indicator : null
    const names = Array.isArray(indicator)
      ? indicator.map((item) => String((item as { name?: string }).name || ''))
      : []
    const values = Array.isArray((first.data as { value?: number[] }[] | undefined)?.[0]?.value)
      ? ((first.data as { value: number[] }[])[0].value as number[])
      : []
    return names.map((name, index) => ({ index, name, value: Number(values[index]) || 0 }))
  }

  const names = categoryNames(option)
  const seriesData = Array.isArray(first.data) ? (first.data as unknown[]) : []
  if (names.length && seriesData.length && first.type !== 'scatter') {
    return names.map((name, index) => {
      const cell = seriesData[index]
      const value =
        cell && typeof cell === 'object' && 'value' in (cell as object)
          ? Number((cell as { value: number }).value)
          : Number(cell)
      return { index, name, value: Number.isFinite(value) ? value : 0 }
    })
  }

  if (first.type === 'scatter' && seriesData.length) {
    return seriesData.map((cell, index) => {
      const pair = Array.isArray(cell) ? cell : [index + 1, cell]
      return { index, name: `Item ${pair[0]}`, value: Number(pair[1]) || 0 }
    })
  }

  return []
}

function nameMatches(name: string, keep: string[]) {
  const left = name.trim().toLowerCase()
  if (!left) return false
  return keep.some((item) => {
    const right = item.trim().toLowerCase()
    return right && (left === right || left.includes(right) || right.includes(left))
  })
}

function rebuildOption(option: AnyOption, kept: ChartRow[]): AnyOption {
  const next = clone(option)
  const keptIndex = new Set(kept.map((row) => row.index))
  const series = seriesList(next)

  for (const item of series) {
    if (item.type === 'pie' || item.type === 'funnel' || item.type === 'gauge') {
      item.data = (Array.isArray(item.data) ? item.data : []).filter((_, index) => keptIndex.has(index))
      continue
    }
    if (item.type === 'radar') {
      const radar = next.radar
      const radarObj = (Array.isArray(radar) ? radar[0] : radar) as AnyOption | undefined
      if (radarObj && Array.isArray(radarObj.indicator)) {
        radarObj.indicator = radarObj.indicator.filter((_, index) => keptIndex.has(index))
      }
      if (Array.isArray(item.data)) {
        item.data = item.data.map((row) => {
          const values = Array.isArray((row as { value?: number[] }).value) ? (row as { value: number[] }).value : []
          return { ...(row as object), value: values.filter((_, index) => keptIndex.has(index)) }
        })
      }
      continue
    }
    if (item.type === 'heatmap' && Array.isArray(item.data)) {
      const remap = new Map(kept.map((row, nextIndex) => [row.index, nextIndex]))
      item.data = item.data
        .filter((cell) => Array.isArray(cell) && remap.has(Number(cell[0])))
        .map((cell) => {
          const tuple = cell as [number, number, number]
          return [remap.get(tuple[0]), tuple[1], tuple[2]]
        })
    } else if (Array.isArray(item.data) && item.type !== 'scatter') {
      item.data = item.data.filter((_, index) => keptIndex.has(index))
    } else if (item.type === 'scatter' && Array.isArray(item.data)) {
      item.data = item.data.filter((_, index) => keptIndex.has(index))
    }
  }

  const axis = next.xAxis
  const applyAxis = (target: AnyOption) => {
    if (Array.isArray(target.data)) {
      target.data = target.data.filter((_, index) => keptIndex.has(index))
    }
  }
  if (Array.isArray(axis)) axis.forEach((item) => applyAxis(item as AnyOption))
  else if (axis && typeof axis === 'object') applyAxis(axis as AnyOption)

  next.series = Array.isArray(next.series) ? series : series[0]
  return next
}

export function filterEchartsOption(
  option: AnyOption,
  keepNames: string[] | null,
  queries: FilterQuery[] = [],
  allowedFields?: string[],
  workspace = '',
): { option: AnyOption; total: number; shown: number; filtered: boolean } {
  const rows = extractChartRows(option)
  if (!rows.length || (!keepNames && !queries.length)) {
    return { option, total: rows.length, shown: rows.length, filtered: false }
  }

  let kept = rows
  if (keepNames) {
    const named = rows.filter((row) => nameMatches(row.name, keepNames))
    if (named.length) kept = named
    else if (!keepNames.length) kept = []
  }
  if (queries.length) {
    const records: FilterRecord[] = kept.map((row) => ({
      id: row.index,
      title: row.name,
      owner: '',
      status: '',
      workspace,
      items: row.value,
      updated: '',
      body: '',
    }))
    const after = applyFilters(records, queries, allowedFields)
    const ids = new Set(after.map((row) => Number(row.id)))
    if (keepNames && kept.length && !ids.size) {
      // Canvas-name match already applied; do not wipe it with a status filter that chart rows cannot satisfy.
    } else if (ids.size || !keepNames) {
      kept = kept.filter((row) => ids.has(row.index))
    }
  }

  return {
    option: rebuildOption(option, kept),
    total: rows.length,
    shown: kept.length,
    filtered: kept.length !== rows.length,
  }
}
