import { useEffect, useRef, useState, type FormEvent } from 'react'

type RunResult = { code?: number; stdout?: string; stderr?: string; error?: string }
type Field = { label: string; value: string }

function programFields(source: string): Field[] {
  const line = source.split('\n').find((row) => /pbmp-inputs\s*:/i.test(row))
  if (line) {
    const rest = line.split(/pbmp-inputs\s*:/i)[1] || ''
    return rest
      .split('|')
      .map((part) => {
        const [label, preset] = part.split('=')
        return { label: (label || '').trim() || 'Input', value: (preset || '').trim() }
      })
      .filter((field) => field.label)
      .slice(0, 6)
  }
  const reads = source.match(/\binput\s*\(|fgets\s*\(\s*STDIN|next(?:Double|Int|Line|Float|Long)\s*\(/g)
  return Array.from({ length: Math.min(reads?.length || 0, 6) }, (_, index) => ({
    label: `Input ${index + 1}`,
    value: '',
  }))
}

export function ProgramRunner({
  language,
  title,
  source,
}: {
  language: 'python' | 'php' | 'java'
  title: string
  source: string
}) {
  const declared = programFields(source)
  const needsInput = declared.length > 0
  const [fields, setFields] = useState<Field[]>(declared)
  const [running, setRunning] = useState(!needsInput)
  const [result, setResult] = useState<RunResult | null>(null)
  const runButton = useRef<HTMLButtonElement>(null)
  const visibleSource = source
    .split('\n')
    .filter((line) => !/pbmp-inputs\s*:/i.test(line))
    .join('\n')
    .trim()

  useEffect(() => {
    const next = programFields(source)
    setFields(next)
    setResult(null)
    if (next.length === 0) {
      setRunning(true)
      return
    }
    setRunning(false)
  }, [source])

  useEffect(() => {
    if (!needsInput) return
    runButton.current?.scrollIntoView({ block: 'nearest' })
  }, [needsInput, source])

  useEffect(() => {
    if (needsInput) return
    let cancel = false
    run('')
      .then((body) => {
        if (!cancel) setResult(body)
      })
      .catch((error: Error) => {
        if (!cancel) setResult({ code: 1, stderr: error.message })
      })
      .finally(() => {
        if (!cancel) setRunning(false)
      })
    return () => {
      cancel = true
    }
  }, [language, source, needsInput])

  async function run(stdin: string) {
    const response = await fetch('/api/ai/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, source, stdin }),
    })
    const body = (await response.json()) as RunResult
    if (!response.ok) throw new Error(body.error || 'The program could not run')
    return body
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (fields.some((field) => !field.value.trim())) return
    setRunning(true)
    setResult(null)
    try {
      setResult(await run(`${fields.map((field) => field.value.trim()).join('\n')}\n`))
    } catch (error) {
      setResult({ code: 1, stderr: error instanceof Error ? error.message : 'The program could not run' })
    } finally {
      setRunning(false)
    }
  }

  const output = [result?.stdout, result?.stderr].filter(Boolean).join('\n')
  const ready = fields.every((field) => field.value.trim())

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {title} · {language} · {running ? 'running' : result ? 'finished' : 'waiting for input'}
      </p>
      {needsInput && (
        <form className="space-y-2" onSubmit={onSubmit}>
          {fields.map((field, index) => (
            <label key={`${field.label}-${index}`} className="block text-[12px] text-slate-600">
              {field.label}
              <input
                value={field.value}
                inputMode="decimal"
                onChange={(event) => {
                  const value = event.target.value
                  setFields((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, value } : item)))
                }}
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-[13px] text-slate-900"
                placeholder="Enter a number"
              />
            </label>
          ))}
          <button
            ref={runButton}
            type="submit"
            disabled={running || !ready}
            className="rounded bg-slate-900 px-3 py-1 text-[12px] text-white disabled:opacity-40"
          >
            {running ? 'Running…' : 'Run'}
          </button>
        </form>
      )}
      <pre className="overflow-x-auto rounded border border-slate-200 bg-slate-950 p-3 text-[12px] text-slate-100">
        {running ? 'Running…' : output || (needsInput ? 'The result appears here.' : 'The program finished with no output.')}
      </pre>
      <details className="rounded border border-slate-200 bg-slate-50 px-2 py-1">
        <summary className="cursor-pointer text-[11px] text-slate-500">Program</summary>
        <pre className="mt-1 overflow-x-auto text-[11px] text-slate-700">{visibleSource}</pre>
      </details>
    </div>
  )
}
