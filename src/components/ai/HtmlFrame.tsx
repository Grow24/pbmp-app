import { useEffect, useId, useRef, useState } from 'react'

function withSizeProbe(html: string, token: string) {
  const probe = `<script data-pbmp-probe="1">(function(){var token=${JSON.stringify(token)};function send(){var h=Math.max(document.documentElement?document.documentElement.scrollHeight:0,document.body?document.body.scrollHeight:0);parent.postMessage({type:'pbmp-frame-size',token:token,height:h},'*');}function arm(){send();if(document.body&&window.ResizeObserver){new ResizeObserver(send).observe(document.body);}window.addEventListener('load',send);}if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',arm);}else{arm();}})();</script>`
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${probe}</body>`)
  return `${html}${probe}`
}

export function documentForHtml(html: string) {
  const trimmed = html.trim()
  if (/<html[\s>]/i.test(trimmed)) return trimmed
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:12px;font:14px/1.5 ui-sans-serif,system-ui,sans-serif;color:#0f172a}img,svg{max-width:100%}</style></head><body>${trimmed}</body></html>`
}

export function HtmlFrame({
  title,
  html,
  minHeight = 160,
}: {
  title: string
  html: string
  minHeight?: number
}) {
  const token = useId()
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(minHeight)
  const srcDoc = withSizeProbe(documentForHtml(html), token)

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return
      const data = event.data as { type?: string; token?: string; height?: number }
      if (data?.type !== 'pbmp-frame-size' || data.token !== token || typeof data.height !== 'number') return
      setHeight(Math.min(840, Math.max(minHeight, Math.ceil(data.height) + 4)))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [minHeight, token])

  return (
    <iframe
      ref={frameRef}
      title={title}
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      style={{ height }}
      className="w-full rounded border border-slate-200 bg-white"
    />
  )
}
