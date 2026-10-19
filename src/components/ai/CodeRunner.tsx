import { useState } from 'react'
import { HtmlFrame } from './HtmlFrame'

export function runnableHtml(source: string) {
  const safe = source.replace(/<\/script/gi, '<\\/script')
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  html,body{margin:0;background:#fff;color:#0f172a}
  body{font:13px/1.45 ui-sans-serif,system-ui,sans-serif}
  #pbmp-app{padding:12px}
  #pbmp-log{margin:0;padding:8px 12px;white-space:pre-wrap;font:12px/1.4 ui-monospace,monospace;color:#334155;background:#f8fafc;border-top:1px solid #e2e8f0}
  #pbmp-log:empty{display:none}
</style>
</head>
<body>
<div id="pbmp-app"></div>
<pre id="pbmp-log"></pre>
<script>
const __app = document.getElementById('pbmp-app');
const __logEl = document.getElementById('pbmp-log');
const __lines = [];
const __write = (...args) => {
  __lines.push(args.map((item) => {
    if (typeof item === 'string') return item;
    try { return JSON.stringify(item); } catch (error) { return String(item); }
  }).join(' '));
  __logEl.textContent = __lines.join('\\n');
};
console.log = __write;
console.info = __write;
console.warn = __write;
console.error = __write;
try {
  const __result = (function () {
${safe}
  })();
  if (__result !== undefined && __app.childNodes.length === 0) {
    __app.textContent = typeof __result === 'string' ? __result : JSON.stringify(__result, null, 2);
  }
} catch (error) {
  __app.textContent = error && error.stack ? error.stack : String(error);
}
</script>
</body>
</html>`
}

export function CodeRunner({ title, source }: { title: string; source: string }) {
  const [runId, setRunId] = useState(0)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Runs in this canvas</p>
        <button type="button" className="ui-btn h-7 px-2" onClick={() => setRunId((value) => value + 1)}>
          Run again
        </button>
      </div>
      <HtmlFrame key={runId} title={title} html={runnableHtml(source)} minHeight={96} />
      <details className="rounded border border-slate-200 bg-slate-50 px-2 py-1">
        <summary className="cursor-pointer text-[11px] text-slate-500">Source</summary>
        <pre className="mt-1 overflow-x-auto text-[11px] text-slate-700">{source}</pre>
      </details>
    </div>
  )
}
