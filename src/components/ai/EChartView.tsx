import { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts'

function parseOption(body: string): echarts.EChartsOption | null {
  try {
    const option = JSON.parse(body) as echarts.EChartsOption
    if (!option || typeof option !== 'object') return null
    return option
  } catch {
    return null
  }
}

export function EChartView({ optionJson, height = 380 }: { optionJson: string; height?: number }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const option = parseOption(optionJson)
    if (!option) {
      setError('This EChart option is not valid JSON.')
      return
    }
    setError('')
    const chart = echarts.init(host)
    chart.setOption(option, true)
    const resize = () => chart.resize()
    window.addEventListener('resize', resize)
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    return () => {
      window.removeEventListener('resize', resize)
      observer.disconnect()
      chart.dispose()
    }
  }, [optionJson, height])

  if (error) {
    return (
      <div className="space-y-2">
        <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">{error}</p>
        <pre className="overflow-x-auto rounded bg-slate-50 p-2 text-[11px] text-slate-600">{optionJson}</pre>
      </div>
    )
  }

  return <div ref={hostRef} className="w-full rounded border border-slate-200 bg-white" style={{ height }} />
}
