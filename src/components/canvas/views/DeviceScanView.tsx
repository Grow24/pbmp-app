import { Copy, Download, Loader2, ScanSearch } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { scanDevice } from '../../../device-capability/scan'
import type { DeviceScanProfile } from '../../../device-capability/types'

function Row({ label, value }: { label: string; value: string | number | boolean | null | undefined }) {
  const text = value === null || value === undefined || value === '' ? 'Not exposed' : String(value)
  return (
    <div className="grid grid-cols-[minmax(140px,38%)_1fr] gap-2 border-b border-slate-100 py-1.5 text-[13px]">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{text}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ui-card p-4">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <dl>{children}</dl>
    </section>
  )
}

function yesNo(value: boolean) {
  return value ? 'Yes' : 'No'
}

export function DeviceScanView() {
  const [profile, setProfile] = useState<DeviceScanProfile | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState('')
  const [error, setError] = useState('')

  const run = async (requestMedia = false) => {
    setBusy(true)
    setError('')
    try {
      setProfile(await scanDevice({ requestMedia }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setBusy(false)
    }
  }

  const json = profile ? JSON.stringify(profile, null, 2) : ''

  const copyJson = async () => {
    await navigator.clipboard.writeText(json)
    setCopied('Copied JSON.')
    window.setTimeout(() => setCopied(''), 2000)
  }

  const downloadJson = () => {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pbmp-device-scan-${new Date().toISOString().slice(0, 19)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <article className="ui-card p-5">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">Foundational service</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">Device capability profile</h2>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-slate-600">
          One button reads what this browser is allowed to see: CPU threads, approximate RAM, display, storage quota,
          network estimates, media devices, WebGL/WebGPU, WASM, and interface support. It cannot list printers, drivers,
          Wi-Fi card model, SSD model, or installed software. That needs a later PBMP Local Agent.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" className="ui-btn-primary" onClick={() => void run(false)} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
            Scan this device
          </button>
          <button type="button" className="ui-btn" onClick={() => void run(true)} disabled={busy}>
            Scan + camera/mic names
          </button>
          {profile ? (
            <>
              <button type="button" className="ui-btn" onClick={() => void copyJson()}>
                <Copy className="h-4 w-4" />
                Copy JSON
              </button>
              <button type="button" className="ui-btn" onClick={downloadJson}>
                <Download className="h-4 w-4" />
                Download JSON
              </button>
            </>
          ) : null}
          {copied ? <span className="text-[12px] text-emerald-600">{copied}</span> : null}
        </div>
        {error ? <p className="mt-3 text-[13px] text-rose-600">{error}</p> : null}
      </article>

      {profile ? (
        <>
          <section className="ui-card p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">PBMP compute profile</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-5">
              {(['cpu', 'memory', 'gpu', 'wasm', 'network'] as const).map((key) => (
                <div key={key} className="rounded border border-slate-200 px-3 py-2">
                  <p className="text-[10px] uppercase text-slate-400">{key}</p>
                  <p className="text-sm font-semibold text-slate-900">{profile.pbmpCapabilities[key]}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-1 text-[13px] text-slate-700">
              {Object.entries(profile.pbmpCapabilities.recommended).map(([workload, route]) => (
                <div key={workload} className="flex justify-between gap-3 border-b border-slate-100 py-1">
                  <span>{workload}</span>
                  <span className="font-medium">{route}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-3 lg:grid-cols-2">
            <Section title="Device">
              <Row label="Device type" value={profile.device.type} />
              <Row label="Operating system" value={profile.device.operatingSystem} />
              <Row label="Architecture" value={profile.device.architecture} />
              <Row label="Browser" value={`${profile.browser.name} ${profile.browser.version}`} />
              <Row label="PWA installed" value={yesNo(profile.device.pwaInstalled)} />
              <Row label="Touch support" value={yesNo(profile.device.touchSupport)} />
              <Row label="Time zone" value={profile.device.timeZone} />
              <Row label="Language" value={profile.device.languages.join(', ')} />
            </Section>
            <Section title="Processing">
              <Row label="Logical CPU threads" value={profile.cpu.logicalThreads} />
              <Row label="Web Workers" value={yesNo(profile.cpu.webWorkers)} />
              <Row label="SharedArrayBuffer" value={yesNo(profile.cpu.sharedArrayBuffer)} />
              <Row label="Cross-origin isolated" value={yesNo(profile.cpu.crossOriginIsolated)} />
              <Row label="WebAssembly" value={yesNo(profile.wasm.webAssembly)} />
              <Row label="WASM SIMD" value={yesNo(profile.wasm.simd)} />
              <Row label="WASM threads" value={yesNo(profile.wasm.threads)} />
            </Section>
            <Section title="Memory & storage">
              <Row label="Reported RAM" value={profile.memory.reportedRamGB ? `~${profile.memory.reportedRamGB} GB` : null} />
              <Row label="JS heap used" value={profile.memory.jsHeapUsedMB ? `${profile.memory.jsHeapUsedMB} MB` : null} />
              <Row label="PWA storage quota" value={profile.storage.quotaGB ? `${profile.storage.quotaGB} GB` : null} />
              <Row label="PWA storage used" value={profile.storage.usageGB ? `${profile.storage.usageGB} GB` : null} />
            </Section>
            <Section title="GPU">
              <Row label="WebGPU" value={yesNo(profile.gpu.webgpu)} />
              <Row label="WebGL 2" value={yesNo(profile.gpu.webgl2)} />
              <Row label="GPU vendor" value={profile.gpu.vendor || profile.gpu.adapterVendor} />
              <Row label="GPU renderer" value={profile.gpu.renderer || profile.gpu.adapterName} />
              <Row label="Max texture size" value={profile.gpu.maxTextureSize} />
              <Row label="Compute shaders" value={yesNo(profile.gpu.computeShaders)} />
            </Section>
            <Section title="Display">
              <Row label="Resolution" value={`${profile.display.width} × ${profile.display.height}`} />
              <Row label="Device pixel ratio" value={profile.display.pixelRatio} />
              <Row label="Colour depth" value={`${profile.display.colorDepth}-bit`} />
              <Row label="Orientation" value={profile.display.orientation} />
            </Section>
            <Section title="Network">
              <Row label="Online" value={yesNo(profile.network.online)} />
              <Row label="Connection type" value={profile.network.type} />
              <Row label="Effective type" value={profile.network.effectiveType} />
              <Row label="Downlink estimate" value={profile.network.downlinkMbps != null ? `${profile.network.downlinkMbps} Mbps` : null} />
              <Row label="Latency estimate" value={profile.network.rttMs != null ? `${profile.network.rttMs} ms` : null} />
            </Section>
            <Section title="Media">
              <Row label="Cameras" value={profile.media.cameras.length} />
              <Row label="Microphones" value={profile.media.microphones.length} />
              <Row label="Speakers" value={profile.media.speakers.length} />
              <p className="pt-2 text-[12px] leading-relaxed text-slate-500">{profile.media.permissionNote}</p>
              {[...profile.media.cameras, ...profile.media.microphones, ...profile.media.speakers].slice(0, 8).map((item) => (
                <Row key={item.id} label="Device" value={item.label} />
              ))}
            </Section>
            <Section title="Interfaces">
              <Row label="Bluetooth API" value={yesNo(profile.interfaces.bluetooth)} />
              <Row label="WebUSB" value={yesNo(profile.interfaces.usb)} />
              <Row label="WebHID" value={yesNo(profile.interfaces.hid)} />
              <Row label="Web Serial" value={yesNo(profile.interfaces.serial)} />
              <Row label="Battery API" value={profile.battery.available ? `${profile.battery.levelPercent}%${profile.battery.charging ? ' charging' : ''}` : 'Not exposed'} />
            </Section>
          </div>

          <section className="ui-card p-4 text-[12px] leading-relaxed text-slate-500">
            <p className="font-medium text-slate-700">What this scan cannot see</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {profile.limits.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <p className="text-[13px] text-slate-500">Press Scan this device. The report is generated entirely in this browser — nothing is sent to ChatGPT or Zeabur for the scan itself.</p>
      )}
    </div>
  )
}
