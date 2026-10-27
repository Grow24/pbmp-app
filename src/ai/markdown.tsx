import type { ReactNode } from 'react'
import { CodeRunner } from '../components/ai/CodeRunner'
import { EChartPanel, parsePanelSpec } from '../components/ai/EChartPanel'
import { EChartView } from '../components/ai/EChartView'
import { HtmlFrame } from '../components/ai/HtmlFrame'
import { MermaidView } from '../components/ai/MermaidView'
import { ProgramRunner } from '../components/ai/ProgramRunner'
import { TableView } from '../components/ai/TableView'

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
      const lang = line.slice(3).trim().toLowerCase()
      const body: string[] = []
      i += 1
      while (i < lines.length && !lines[i].startsWith('```')) {
        body.push(lines[i])
        i += 1
      }
      const looksMermaid = lang === 'mermaid' || (!lang && /^(graph|flowchart|sequenceDiagram|classDiagram|erDiagram|stateDiagram|journey|gantt|pie|mindmap)\b/.test(body[0] || ''))
      if (looksMermaid) {
        nodes.push(
          <div key={`c-${i}`} className="my-2">
            <MermaidView source={body.join('\n')} compact />
          </div>,
        )
      } else if (lang === 'echarts' || lang === 'echart' || lang === 'echarts-panel' || lang === 'echart-panel') {
        const json = body.join('\n')
        nodes.push(
          <div key={`c-${i}`} className="my-2">
            {lang === 'echarts-panel' || lang === 'echart-panel' || parsePanelSpec(json) ? (
              <EChartPanel specJson={json} height={260} />
            ) : (
              <EChartView optionJson={json} height={300} />
            )}
          </div>,
        )
      } else if (lang === 'html') {
        nodes.push(
          <div key={`c-${i}`} className="my-2">
            <HtmlFrame title="HTML artifact" html={body.join('\n')} />
          </div>,
        )
      } else if (lang === 'svg') {
        nodes.push(
          <div key={`c-${i}`} className="my-2">
            <HtmlFrame
              title="SVG artifact"
              html={`<!DOCTYPE html><html><body style="margin:12px">${body.join('\n')}</body></html>`}
            />
          </div>,
        )
      } else if (lang === 'javascript' || lang === 'js') {
        nodes.push(
          <div key={`c-${i}`} className="my-2">
            <CodeRunner title="Script" source={body.join('\n')} />
          </div>,
        )
      } else if (lang === 'python' || lang === 'php' || lang === 'java') {
        nodes.push(
          <div key={`c-${i}`} className="my-2">
            <ProgramRunner language={lang} title={lang === 'php' ? 'PHP' : lang === 'java' ? 'Java' : 'Python'} source={body.join('\n')} />
          </div>,
        )
      } else if (lang === 'csv' || lang === 'table') {
        nodes.push(
          <div key={`c-${i}`} className="my-2">
            <TableView body={body.join('\n')} />
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
    } else if (line.trim().startsWith('|') && line.includes('|')) {
      const table: string[] = [line]
      i += 1
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        table.push(lines[i])
        i += 1
      }
      nodes.push(
        <div key={`t-${i}`} className="my-2">
          <TableView body={table.join('\n')} />
        </div>,
      )
      continue
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