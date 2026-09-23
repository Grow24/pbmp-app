import type { ReactNode } from 'react'
import { EChartView } from '../components/ai/EChartView'

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="rounded bg-slate-100 px-1 text-[12px]">
          {part.slice(1, -1)}
        </code>
      )
    }
    return <span key={index}>{part}</span>
  })
}

export function MarkdownView({ text }: { text: string }) {
  const lines = text.split('\n')
  const nodes: ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const body: string[] = []
      i += 1
      while (i < lines.length && !lines[i].startsWith('```')) {
        body.push(lines[i])
        i += 1
      }
      if (lang === 'echarts' || lang === 'echart') {
        nodes.push(
          <div key={`c-${i}`} className="my-2">
            <EChartView optionJson={body.join('\n')} height={300} />
          </div>,
        )
      } else {
        nodes.push(
          <pre key={`c-${i}`} className="my-2 overflow-x-auto rounded bg-slate-900 p-3 text-[11px] text-slate-100">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-400">{lang || 'code'}</div>
            {body.join('\n')}
          </pre>,
        )
      }
      i += 1
      continue
    }
    if (line.startsWith('# ')) {
      nodes.push(
        <h3 key={i} className="mt-3 text-sm font-semibold text-slate-900">
          {inline(line.slice(2))}
        </h3>,
      )
    } else if (line.startsWith('## ')) {
      nodes.push(
        <h4 key={i} className="mt-2 text-[13px] font-semibold text-slate-800">
          {inline(line.slice(3))}
        </h4>,
      )
    } else if (line.startsWith('### ')) {
      nodes.push(
        <h5 key={i} className="mt-2 text-[12px] font-semibold text-slate-700">
          {inline(line.slice(4))}
        </h5>,
      )
    } else if (line.startsWith('- ')) {
      nodes.push(
        <li key={i} className="ml-4 list-disc text-[13px] leading-relaxed">
          {inline(line.slice(2))}
        </li>,
      )
    } else if (line.trim() === '') {
      nodes.push(<div key={i} className="h-2" />)
    } else {
      nodes.push(
        <p key={i} className="text-[13px] leading-relaxed">
          {inline(line)}
        </p>,
      )
    }
    i += 1
  }
  return <div className="space-y-0.5">{nodes}</div>
}