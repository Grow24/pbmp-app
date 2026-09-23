import { EChartView, type PanelSpec } from './EChartView'

export function parsePanelSpec(body: string): PanelSpec | null {
  try {
    const data = JSON.parse(body) as PanelSpec
    if (!data || typeof data !== 'object') return null
    const charts = Array.isArray(data.charts) ? data.charts : []
    const usable = charts.filter((item) => item && typeof item === 'object' && item.option)
    if (!usable.length) return null
    return { ...data, charts: usable }
  } catch {
    return null
  }
}

export function EChartPanel({ specJson, height = 260 }: { specJson: string; height?: number }) {
  const spec = parsePanelSpec(specJson)
  if (!spec) {
    return <EChartView optionJson={specJson} height={height} />
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">EChart panel</p>
          {spec.title && <h4 className="text-[13px] font-semibold text-slate-800">{spec.title}</h4>}
        </div>
        <span className="text-[11px] text-slate-400">{spec.charts.length} charts</span>
      </div>
      <div className={`grid gap-3 ${spec.charts.length > 1 ? 'sm:grid-cols-2' : ''}`}>
        {spec.charts.map((chart, index) => (
          <div key={`${chart.type || 'chart'}-${index}`} className="rounded border border-slate-200 bg-white p-2">
            <p className="mb-1 text-[11px] font-medium capitalize text-slate-600">{chart.title || chart.type || `Chart ${index + 1}`}</p>
            <EChartView
              optionJson={JSON.stringify(chart.option)}
              height={height}
              showFilters={index === 0}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
