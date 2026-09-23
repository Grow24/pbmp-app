import type { PanelChart, PanelSpec } from '../components/ai/EChartView'

function stripFence(text: string) {
  return String(text || '')
    .trim()
    .replace(/^```(?:json|javascript|js|echarts|echart|echarts-panel|echart-panel)?\s*/i, '')
    .replace(/```$/i, '')
    .trim()
}

function stripCommentsAndCommas(text: string) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:\\\s])\/\/.*$/gm, '$1')
    .replace(/,\s*([}\]])/g, '$1')
}

function sliceBalanced(text: string, start: number, open: '{' | '[') {
  const close = open === '{' ? '}' : ']'
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i]
    if (inStr) {
      if (esc) {
        esc = false
        continue
      }
      if (ch === '\\') {
        esc = true
        continue
      }
      if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') {
      inStr = true
      continue
    }
    if (ch === open) depth += 1
    if (ch === close) {
      depth -= 1
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return ''
}

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

export function parseLooseJson(raw: string): unknown {
  const cleaned = stripCommentsAndCommas(stripFence(raw))
  const direct = tryParse(cleaned)
  if (direct !== undefined) return direct

  const start = cleaned.indexOf('{')
  if (start >= 0) {
    const sliced = sliceBalanced(cleaned, start, '{')
    const parsed = sliced ? tryParse(sliced) : undefined
    if (parsed !== undefined) return parsed
  }
  return undefined
}

const CHART_TYPES = new Set(['bar', 'line', 'pie', 'radar', 'funnel', 'gauge', 'scatter', 'heatmap'])

function inferSeriesType(option: Record<string, unknown>) {
  const series = option.series
  const first = Array.isArray(series) ? series[0] : series
  return first && typeof first === 'object' && !Array.isArray(first)
    ? String((first as { type?: string }).type || '')
    : ''
}

function asChart(item: unknown): PanelChart | null {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null
  const row = item as Record<string, unknown>
  const type = typeof row.type === 'string' ? row.type : undefined
  const title = typeof row.title === 'string' ? row.title : undefined
  if (row.option && typeof row.option === 'object' && !Array.isArray(row.option)) {
    return { type: type || inferSeriesType(row.option as Record<string, unknown>) || undefined, title, option: row.option as Record<string, unknown> }
  }
  if (row.series && type && CHART_TYPES.has(type)) {
    const { type: _type, title: _title, ...option } = row
    return { type, title, option }
  }
  return null
}

function recoverCharts(text: string): PanelChart[] {
  const cleaned = stripCommentsAndCommas(stripFence(text))
  const charts: PanelChart[] = []
  let cursor = 0
  while (cursor < cleaned.length) {
    const start = cleaned.indexOf('{', cursor)
    if (start < 0) break
    const sliced = sliceBalanced(cleaned, start, '{')
    if (!sliced) {
      cursor = start + 1
      continue
    }
    const parsed = tryParse(sliced)
    const chart = asChart(parsed)
    if (chart) charts.push(chart)
    cursor = start + 1
  }
  return charts
}

export function parseEchartsOptionJson(raw: string): Record<string, unknown> | null {
  const parsed = parseLooseJson(raw)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
  const option = parsed as Record<string, unknown>
  if (Array.isArray(option.charts)) return null
  const series = option.series
  if (Array.isArray(series) ? series.length > 0 : Boolean(series && typeof series === 'object')) return option
  return null
}

export function parseEchartsPanelJson(raw: string): PanelSpec | null {
  const parsed = parseLooseJson(raw)
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const data = parsed as Record<string, unknown>
    const list = Array.isArray(data.charts) ? data.charts.map(asChart).filter((item): item is PanelChart => Boolean(item)) : []
    if (list.length) {
      return {
        panel: true,
        title: typeof data.title === 'string' ? data.title : undefined,
        charts: list,
      }
    }
  }
  const recovered = recoverCharts(raw)
  if (!recovered.length) return null
  const titleMatch = String(raw).match(/"title"\s*:\s*"([^"]+)"/)
  return { panel: true, title: titleMatch?.[1], charts: recovered }
}
