import { useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts'

function parseOption(body: string): echarts.EChartsOption | null {
  try {
    const option = JSON.parse(body) as echarts.EChartsOption
    if (!option || typeof option !== 'object' || Array.isArray(option)) return null
    return option
  } catch {
    return null
  }
}

export function EChartView({ optionJson, height = 380 }: { optionJson: string; height?: number }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  const option = useMemo(() => parseOption(optionJson), [optionJson])

  useEffect(() => {
    const host = hostRef.current
    if (!option) {
      setError('This EChart option is not valid JSON.')
      return
    }
    if (!host) return
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
  }, [option, height])

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">{error}</p>
      )}
      <div
        ref={hostRef}
        className={`w-full rounded border border-slate-200 bg-white ${error ? 'hidden' : ''}`}
        style={{ height }}
      />
    </div>
  )
}
