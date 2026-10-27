import { useEffect, useState } from 'react'
import { HtmlFrame } from './HtmlFrame'

const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'

export function pythonHtml(source: string) {
  const payload = JSON.stringify(source)
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
<script src="${PYODIDE}pyodide.js"></script>
</head>
<body>
<div id="pbmp-app">Loading Python…</div>
<pre id="pbmp-log"></pre>
<script>
const __app = document.getElementById('pbmp-app');
const __logEl = document.getElementById('pbmp-log');
const __source = ${payload};
const __write = (...args) => {
  const line = args.map((item) => String(item)).join(' ');
  __logEl.textContent = (__logEl.textContent ? __logEl.textContent + '\\n' : '') + line;
};
(async () => {
  try {
    if (typeof loadPyodide !== 'function') {
      __app.textContent = 'Python runtime did not load. The canvas needs a network connection for the first run.';
      return;
    }
    const pyodide = await loadPyodide({ indexURL: ${JSON.stringify(PYODIDE)} });
    pyodide.setStdout({ batched: (text) => __write(text) });
    pyodide.setStderr({ batched: (text) => __write(text) });
    __app.textContent = '';
    await pyodide.runPythonAsync(__source);
    if (!__logEl.textContent && !__app.textContent) __app.textContent = 'Python finished with no printed output.';
    parent.postMessage({ type: 'pbmp-python-result', ok: true, text: __logEl.textContent || __app.textContent }, '*');
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    __app.textContent = message;
    parent.postMessage({ type: 'pbmp-python-result', ok: false, text: message }, '*');
  }
})();
</script>
</body>
</html>`
}

export function PythonRunner({ title, source }: { title: string; source: string }) {
  const [runId, setRunId] = useState(0)
  const [note, setNote] = useState('Running in the sandbox…')
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; ok?: boolean; text?: string }
      if (data?.type !== 'pbmp-python-result') return
      setNote(data.text || (data.ok ? 'Finished.' : 'Python failed.'))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [runId])
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Python in this canvas</p>
        <button
          type="button"
          className="ui-btn h-7 px-2"
          onClick={() => {
            setNote('Running in the sandbox…')
            setRunId((value) => value + 1)
          }}
        >
          Run again
        </button>
      </div>
      <p className="text-[12px] text-slate-600">{note}</p>
      <HtmlFrame key={runId} title={title} html={pythonHtml(source)} minHeight={96} />
      <details className="rounded border border-slate-200 bg-slate-50 px-2 py-1">
        <summary className="cursor-pointer text-[11px] text-slate-500">Source</summary>
        <pre className="mt-1 overflow-x-auto text-[11px] text-slate-700">{source}</pre>
      </details>
    </div>
  )
}
