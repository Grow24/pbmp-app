import { MarkdownView } from '../../ai/markdown'
import type { AiArtifact } from '../../ai/types'
import type { ContentBlock } from '../../types'
import { EChartPanel, parsePanelSpec } from './EChartPanel'
import { EChartView } from './EChartView'

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

function mermaidSrc(body: string) {
  try {
    const bytes = new TextEncoder().encode(body)
    let binary = ''
    bytes.forEach((code) => {
      binary += String.fromCharCode(code)
    })
    return `https://mermaid.ink/svg/${btoa(binary)}`
  } catch {
    return ''
  }
}

export function ArtifactPreview({ artifact, compact = false }: { artifact: AiArtifact; compact?: boolean }) {
  if (artifact.kind === 'mermaid') {
    const src = mermaidSrc(artifact.body)
    return (
      <div className="space-y-2">
        {src && (
          <img
            src={src}
            alt={artifact.title}
            className="max-h-[420px] w-full rounded border border-slate-200 bg-white object-contain"
          />
        )}
        {!compact && (
          <pre className="overflow-x-auto rounded bg-slate-50 p-2 text-[11px] text-slate-600">{artifact.body}</pre>
        )}
      </div>
    )
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
    return (
      <iframe
        title={artifact.title}
        sandbox=""
        srcDoc={artifact.body}
        className="h-[360px] w-full rounded border border-slate-200 bg-white"
      />
    )
  }

  if (artifact.kind === 'svg') {
    return (
      <div
        className="rounded border border-slate-200 bg-white p-3"
        dangerouslySetInnerHTML={{ __html: artifact.body }}
      />
    )
  }

  return <MarkdownView text={artifact.body} />
}