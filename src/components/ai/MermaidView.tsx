import { useEffect, useId, useRef, useState } from 'react'
import mermaid from 'mermaid'

let started = false

function ensureMermaid() {
  if (started) return
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'neutral',
    fontFamily: 'inherit',
  })
  started = true
}

function cleanSource(source: string) {
  return source
    .replace(/^\s*```(?:mermaid)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
}

export function MermaidView({ source, compact = false }: { source: string; compact?: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  const reactId = useId().replace(/:/g, '')
  const [error, setError] = useState('')

  useEffect(() => {
    const code = cleanSource(source)
    const el = host.current
    if (!el || !code) return
    let cancelled = false
    setError('')
    el.innerHTML = ''
    ensureMermaid()
    const id = `pbmp-mmd-${reactId}-${Math.random().toString(36).slice(2, 8)}`
    mermaid
      .render(id, code)
      .then(({ svg }) => {
        if (cancelled || !host.current) return
        host.current.innerHTML = svg
        const svgEl = host.current.querySelector('svg')
        if (svgEl) {
          svgEl.removeAttribute('height')
          svgEl.style.maxWidth = '100%'
          svgEl.style.height = 'auto'
        }
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Could not render this diagram.')
      })
    return () => {
      cancelled = true
    }
  }, [reactId, source])

  return (
    <div className="space-y-2">
      {error ? <p className="text-[12px] leading-relaxed text-rose-600">{error}</p> : null}
      <div
        ref={host}
        className={`overflow-x-auto rounded border border-slate-200 bg-white p-3 ${compact ? 'max-h-[280px]' : 'max-h-[480px]'}`}
      />
    </div>
  )
}
