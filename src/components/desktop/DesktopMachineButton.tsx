import { Cpu } from 'lucide-react'
import { useState } from 'react'
import {
  formatBytes,
  getDesktopSystemInfo,
  isPbmpDesktop,
  type DesktopSystemInfo,
} from '../../lib/desktop'

export function DesktopMachineButton() {
  const [open, setOpen] = useState(false)
  const [info, setInfo] = useState<DesktopSystemInfo | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isPbmpDesktop()) return null

  async function load() {
    setLoading(true)
    setError('')
    try {
      setInfo(await getDesktopSystemInfo())
      setOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex h-8 items-center gap-1 rounded px-2 text-xs text-slate-600 hover:bg-slate-100"
        onClick={() => {
          if (open) {
            setOpen(false)
            return
          }
          void load()
        }}
        aria-label="This computer"
        title="This computer"
      >
        <Cpu className="h-3.5 w-3.5" />
        {loading ? 'Reading…' : 'Desktop'}
      </button>
      {open ? (
        <div className="absolute right-0 top-9 z-30 w-80 rounded border border-slate-200 bg-white p-3 shadow-lg">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">This computer</p>
          {error ? <p className="mt-2 text-[12px] text-red-600">{error}</p> : null}
          {info ? (
            <dl className="mt-2 space-y-1.5 text-[12px] text-slate-700">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Host</dt>
                <dd className="text-right">{info.hostName || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">OS</dt>
                <dd className="text-right">{info.os || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">CPU</dt>
                <dd className="text-right">{info.cpuModel || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Cores</dt>
                <dd className="text-right">
                  {info.logicalCores}
                  {info.physicalCores ? ` logical / ${info.physicalCores} physical` : ''}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">RAM</dt>
                <dd className="text-right">
                  {formatBytes(info.availableMemoryBytes)} free / {formatBytes(info.totalMemoryBytes)}
                </dd>
              </div>
              {info.disks.slice(0, 3).map((disk) => (
                <div key={disk.mountPoint} className="flex justify-between gap-3">
                  <dt className="text-slate-400">{disk.mountPoint}</dt>
                  <dd className="text-right">
                    {formatBytes(disk.availableBytes)} free / {formatBytes(disk.totalBytes)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          <p className="mt-2 text-[11px] text-slate-400">Stage 3 native host — online services still use the PBMP API.</p>
        </div>
      ) : null}
    </div>
  )
}
