import { MarkdownView } from '../../ai/markdown'
import type { AiArtifact } from '../../ai/types'
import type { ContentBlock } from '../../types'
import { CodeRunner } from './CodeRunner'
import { EChartPanel, parsePanelSpec } from './EChartPanel'
import { EChartView } from './EChartView'
import { HtmlFrame } from './HtmlFrame'
import { MermaidView } from './MermaidView'
import { ProgramRunner } from './ProgramRunner'
import { TableView } from './TableView'

export function artifactKindOf(item: ContentBlock) {
  return String(item.value || (typeof item.extra.kind === 'string' ? item.extra.kind : 'markdown'))
}

export function artifactFromContent(item: ContentBlock, siblings: ContentBlock[] = []): AiArtifact {
  const kind = artifactKindOf(item)
  const othersVisual = siblings.some(
    (row) => row.id !== item.id && /^(mermaid|echarts|echart|echarts-panel)$/.test(artifactKindOf(row)),
  )
  const body =
    kind === 'markdown' && othersVisual
      ? String(item.body || '')
          .replace(/```(?:echarts-panel|echart-panel|echarts|echart|mermaid)[\s\S]*?```/g, '')
          .trim()
      : item.body || ''
  return {
    id: String(item.id),
    conversationId: '',
    messageId: '',
    kind,
    title: item.title || 'Saved artifact',
    body,
    savedContentId: item.id,
  }
}

export function ArtifactPreview({ artifact, compact = false }: { artifact: AiArtifact; compact?: boolean }) {
  if (artifact.kind === 'mermaid') {
    return <MermaidView source={artifact.body} compact={compact} />
  }

  if (artifact.kind === 'echarts-panel' || parsePanelSpec(artifact.body)) {
    return (
      <div className="space-y-2">
        <EChartPanel specJson={artifact.body} height={compact ? 240 : 280} />
        {!compact && (
          <pre className="overflow-x-auto rounded bg-slate-50 p-2 text-[11px] text-slate-600">{artifact.body}</pre>
        )}
      </div>
    )
  }

  if (artifact.kind === 'echarts' || artifact.kind === 'echart') {
    return (
      <div className="space-y-2">
        <EChartView optionJson={artifact.body} />
        {!compact && (
          <pre className="overflow-x-auto rounded bg-slate-50 p-2 text-[11px] text-slate-600">{artifact.body}</pre>
        )}
      </div>
    )
  }

  if (artifact.kind === 'html') {
    return <HtmlFrame title={artifact.title} html={artifact.body} />
  }

  if (artifact.kind === 'table' || artifact.kind === 'csv') {
    return <TableView body={artifact.body} />
  }

  if (artifact.kind === 'python' || artifact.kind === 'php' || artifact.kind === 'java') {
    return <ProgramRunner language={artifact.kind} title={artifact.title} source={artifact.body} />
  }

  if (artifact.kind === 'code' || artifact.kind === 'javascript') {
    return <CodeRunner title={artifact.title} source={artifact.body} />
  }

  if (artifact.kind === 'svg') {
    return (
      <HtmlFrame
        title={artifact.title}
        html={`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:12px">${artifact.body}</body></html>`}
      />
    )
  }

  return <MarkdownView text={artifact.body} />
}