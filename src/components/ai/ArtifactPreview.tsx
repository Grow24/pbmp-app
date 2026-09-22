import { MarkdownView } from '../../ai/markdown'
import type { AiArtifact } from '../../ai/types'

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

export function ArtifactPreview({ artifact }: { artifact: AiArtifact }) {
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
        <pre className="overflow-x-auto rounded bg-slate-50 p-2 text-[11px] text-slate-600">{artifact.body}</pre>
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