import type { CapabilityLevel, DeviceScanProfile } from './types'

type NavigatorPlus = Navigator & {
  deviceMemory?: number
  connection?: {
    type?: string
    effectiveType?: string
    downlink?: number
    rtt?: number
    saveData?: boolean
  }
  gpu?: {
    requestAdapter: () => Promise<unknown>
  }
  userAgentData?: {
    brands?: { brand: string; version: string }[]
    mobile?: boolean
    platform?: string
    getHighEntropyValues?: (hints: string[]) => Promise<{
      architecture?: string
      bitness?: string
      model?: string
      platform?: string
      platformVersion?: string
      uaFullVersion?: string
      fullVersionList?: { brand: string; version: string }[]
    }>
  }
  getBattery?: () => Promise<{ charging: boolean; level: number }>
  standalone?: boolean
  usb?: unknown
  serial?: unknown
  hid?: unknown
  bluetooth?: unknown
  wakeLock?: unknown
  keyboard?: unknown
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function bytesToGb(bytes?: number) {
  if (!bytes || !Number.isFinite(bytes)) return null
  return round(bytes / 1024 / 1024 / 1024, 2)
}

function detectBrowser(ua: string, brands: { brand: string; version: string }[]) {
  const chromium = brands.find((item) => /not.a.brand/i.test(item.brand) === false && item.brand !== 'Chromium')
  if (chromium) return { name: chromium.brand, version: chromium.version }
  if (/Edg\//.test(ua)) return { name: 'Edge', version: ua.match(/Edg\/([\d.]+)/)?.[1] || '' }
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return { name: 'Chrome', version: ua.match(/Chrome\/([\d.]+)/)?.[1] || '' }
  if (/Firefox\//.test(ua)) return { name: 'Firefox', version: ua.match(/Firefox\/([\d.]+)/)?.[1] || '' }
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return { name: 'Safari', version: ua.match(/Version\/([\d.]+)/)?.[1] || '' }
  return { name: 'Unknown', version: '' }
}

function detectOs(platform: string, ua: string, uaPlatform?: string) {
  if (uaPlatform) return uaPlatform
  if (/Win/.test(platform) || /Windows/.test(ua)) return /Windows NT 10/.test(ua) ? 'Windows 10/11' : 'Windows'
  if (/Mac/.test(platform) || /Mac OS/.test(ua)) return 'macOS'
  if (/Linux/.test(platform) || /Linux/.test(ua)) return /Android/.test(ua) ? 'Android' : 'Linux'
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS'
  if (/CrOS/.test(ua)) return 'ChromeOS'
  return platform || 'Unknown'
}

function deviceType(ua: string, mobileHint: boolean | null, touch: boolean) {
  if (mobileHint) return 'Mobile'
  if (/Mobi|Android|iPhone/.test(ua)) return 'Mobile'
  if (/iPad|Tablet/.test(ua)) return 'Tablet'
  if (touch && /Macintosh/.test(ua)) return 'Laptop / tablet (touch)'
  return 'Desktop / laptop'
}

function wasmSupports(bytes: number[]) {
  try {
    return WebAssembly.validate(new Uint8Array(bytes))
  } catch {
    return false
  }
}

function levelFrom(score: number): CapabilityLevel {
  if (score >= 3) return 'HIGH'
  if (score >= 2) return 'MEDIUM'
  if (score >= 1) return 'LOW'
  return 'NONE'
}

function classify(profile: Omit<DeviceScanProfile, 'pbmpCapabilities'>): DeviceScanProfile['pbmpCapabilities'] {
  const cpuScore = (profile.cpu.logicalThreads || 0) >= 12 ? 3 : (profile.cpu.logicalThreads || 0) >= 6 ? 2 : (profile.cpu.logicalThreads || 0) >= 2 ? 1 : 0
  const ram = profile.memory.reportedRamGB || 0
  const memScore = ram >= 16 ? 3 : ram >= 8 ? 2 : ram > 0 ? 1 : 1
  const gpuScore = profile.gpu.webgpu ? 3 : profile.gpu.webgl2 ? 2 : profile.gpu.webgl ? 1 : 0
  const wasmScore = profile.wasm.simd && profile.wasm.threads ? 3 : profile.wasm.webAssembly ? 2 : 0
  const net = profile.network.effectiveType || ''
  const netScore = /4g|5g/i.test(net) || (profile.network.downlinkMbps || 0) >= 10 ? 3 : /3g/i.test(net) ? 2 : profile.network.online ? 1 : 0

  const cpu = levelFrom(cpuScore)
  const memory = ram ? levelFrom(memScore) : 'UNKNOWN'
  const gpu = levelFrom(gpuScore)
  const wasm = levelFrom(wasmScore)
  const network = levelFrom(netScore)

  const localGpu = gpu === 'HIGH' || gpu === 'MEDIUM'
  const localCpu = cpu === 'HIGH' || cpu === 'MEDIUM'

  return {
    cpu,
    memory,
    gpu,
    wasm,
    network,
    recommended: {
      'Image processing': localGpu ? 'WebGPU' : 'WASM / cloud',
      'Computer vision': localGpu ? 'WebGPU / WASM' : 'Cloud',
      'Graph algorithms': 'Rust / WASM',
      'Audio processing': wasm !== 'NONE' ? 'WASM' : 'Cloud',
      'LLM 3B': localCpu && (memory === 'HIGH' || memory === 'MEDIUM') ? 'Local possible' : 'Cloud',
      'LLM 7B': memory === 'HIGH' && localGpu ? 'Local possible but constrained' : 'Cloud',
      'Large LLM': 'Cloud',
      MediaPipe: localGpu ? 'Client' : 'WASM / cloud',
      OpenCV: 'WASM',
      FFmpeg: 'WASM',
    },
  }
}

async function readGpu(nav: NavigatorPlus) {
  const canvas = document.createElement('canvas')
  const gl2 = canvas.getContext('webgl2')
  const gl = gl2 || canvas.getContext('webgl')
  let vendor: string | null = null
  let renderer: string | null = null
  let maxTextureSize: number | null = null
  if (gl) {
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    vendor = ext ? String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || '') : String(gl.getParameter(gl.VENDOR) || '')
    renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '') : String(gl.getParameter(gl.RENDERER) || '')
    maxTextureSize = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0) || null
  }

  let webgpu = false
  let adapterName: string | null = null
  let adapterVendor: string | null = null
  const features: string[] = []
  let computeShaders = false
  if (nav.gpu) {
    try {
      const adapter = (await nav.gpu.requestAdapter()) as {
        features?: Set<string>
        limits?: { maxTextureDimension2D?: number }
        info?: { vendor?: string; architecture?: string; device?: string; description?: string }
        requestAdapterInfo?: () => Promise<{ vendor?: string; architecture?: string; device?: string; description?: string }>
      } | null
      if (adapter) {
        webgpu = true
        if (adapter.features) features.push(...[...adapter.features])
        computeShaders = true
        if (adapter.limits?.maxTextureDimension2D) maxTextureSize = adapter.limits.maxTextureDimension2D
        const info = adapter.info || (adapter.requestAdapterInfo ? await adapter.requestAdapterInfo() : null)
        if (info) {
          adapterVendor = info.vendor || null
          adapterName = info.description || info.device || info.architecture || null
        }
      }
    } catch {
      webgpu = false
    }
  }

  return {
    webgpu,
    webgl: Boolean(gl),
    webgl2: Boolean(gl2),
    vendor,
    renderer,
    adapterName,
    adapterVendor,
    features,
    maxTextureSize,
    computeShaders,
  }
}

const CODEC_MIMES = [
  'video/mp4; codecs="avc1.42E01E"',
  'video/webm; codecs="vp9"',
  'video/webm; codecs="av01.0.04M.08"',
  'audio/webm; codecs="opus"',
  'audio/mp4; codecs="mp4a.40.2"',
  'audio/mpeg',
]

export async function scanDevice(options?: { requestMedia?: boolean }): Promise<DeviceScanProfile> {
  const nav = navigator as NavigatorPlus
  const limits = [
    'Browsers hide exact CPU model, RAM modules, SSD/HDD model, Wi-Fi adapter, printers, drivers, BIOS, and installed software.',
    'Values such as RAM and network speed are often rounded to reduce fingerprinting.',
    'A later PBMP Local Agent (Rust/Tauri) can add OS-level inventory if the user installs it.',
  ]

  let uaData: Awaited<ReturnType<NonNullable<NonNullable<NavigatorPlus['userAgentData']>['getHighEntropyValues']>>> | null = null
  try {
    uaData = (await nav.userAgentData?.getHighEntropyValues?.(['architecture', 'bitness', 'model', 'platform', 'platformVersion', 'uaFullVersion', 'fullVersionList'])) || null
  } catch {
    uaData = null
  }

  const brands = uaData?.fullVersionList || nav.userAgentData?.brands || []
  const browser = detectBrowser(nav.userAgent, brands)
  const os = detectOs(nav.platform, nav.userAgent, uaData?.platform || nav.userAgentData?.platform)
  const architecture = uaData?.architecture
    ? `${uaData.architecture}${uaData.bitness ? ` ${uaData.bitness}-bit` : ''}`
    : /WOW64|Win64|x86_64|amd64/i.test(nav.userAgent)
      ? 'x86-64'
      : /aarch64|arm/i.test(nav.userAgent)
        ? 'ARM'
        : nav.platform || 'Unknown'

  const touch = nav.maxTouchPoints > 0 || 'ontouchstart' in window
  const pwaInstalled = window.matchMedia('(display-mode: standalone)').matches || Boolean(nav.standalone)

  let mediaNote = 'Labels stay hidden until camera/microphone permission is granted.'
  if (options?.requestMedia) {
    try {
      const stream = await nav.mediaDevices.getUserMedia({ audio: true, video: true })
      stream.getTracks().forEach((track) => track.stop())
      mediaNote = 'Camera and microphone permission granted for this scan. Labels below are from the browser, not Windows Device Manager.'
    } catch {
      mediaNote = 'Camera/microphone permission was denied or no device is available. Presence can still be inferred from device ids.'
    }
  }

  let cameras: { label: string; id: string }[] = []
  let microphones: { label: string; id: string }[] = []
  let speakers: { label: string; id: string }[] = []
  try {
    const devices = await nav.mediaDevices?.enumerateDevices()
    for (const device of devices || []) {
      const row = { label: device.label || '(permission needed for name)', id: device.deviceId || device.kind }
      if (device.kind === 'videoinput') cameras.push(row)
      if (device.kind === 'audioinput') microphones.push(row)
      if (device.kind === 'audiooutput') speakers.push(row)
    }
  } catch {
    // ignore
  }

  let quotaGB: number | null = null
  let usageGB: number | null = null
  let persisted: boolean | null = null
  try {
    const estimate = await nav.storage?.estimate()
    quotaGB = bytesToGb(estimate?.quota)
    usageGB = bytesToGb(estimate?.usage)
    persisted = nav.storage?.persisted ? await nav.storage.persisted() : null
  } catch {
    // ignore
  }

  const conn = nav.connection
  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory

  let battery = { available: false, charging: null as boolean | null, levelPercent: null as number | null }
  try {
    if (nav.getBattery) {
      const info = await nav.getBattery()
      battery = { available: true, charging: info.charging, levelPercent: Math.round(info.level * 100) }
    }
  } catch {
    // ignore
  }

  const gpu = await readGpu(nav)
  const simd = wasmSupports([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11])
  const bulkMemory = wasmSupports([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 5, 3, 1, 0, 1, 10, 14, 1, 12, 0, 65, 0, 65, 0, 65, 0, 252, 8, 0, 0, 11])

  const profileWithoutCaps: Omit<DeviceScanProfile, 'pbmpCapabilities'> = {
    scannedAt: new Date().toISOString(),
    source: 'pwa-browser',
    limits,
    device: {
      type: deviceType(nav.userAgent, nav.userAgentData?.mobile ?? null, touch),
      operatingSystem: uaData?.platformVersion ? `${os} ${uaData.platformVersion}` : os,
      architecture,
      platform: nav.platform,
      userAgent: nav.userAgent,
      brands,
      mobileHint: nav.userAgentData?.mobile ?? null,
      languages: [...(nav.languages || [nav.language])],
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      pwaInstalled,
      touchSupport: touch,
      maxTouchPoints: nav.maxTouchPoints || 0,
    },
    browser: {
      name: browser.name,
      version: uaData?.uaFullVersion || browser.version,
      vendor: nav.vendor,
      cookiesEnabled: nav.cookieEnabled,
      doNotTrack: nav.doNotTrack,
      pdfViewer: Boolean((nav as NavigatorPlus & { pdfViewerEnabled?: boolean }).pdfViewerEnabled),
      serviceWorker: 'serviceWorker' in nav,
      notifications: 'Notification' in window,
    },
    cpu: {
      logicalThreads: nav.hardwareConcurrency || null,
      webWorkers: typeof Worker !== 'undefined',
      sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      crossOriginIsolated: Boolean(window.crossOriginIsolated),
    },
    memory: {
      reportedRamGB: nav.deviceMemory ?? null,
      jsHeapUsedMB: memory ? round(memory.usedJSHeapSize / 1024 / 1024) : null,
      jsHeapLimitMB: memory ? round(memory.jsHeapSizeLimit / 1024 / 1024) : null,
    },
    display: {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      orientation: screen.orientation?.type || 'unknown',
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    },
    storage: { quotaGB, usageGB, persisted },
    network: {
      online: nav.onLine,
      type: conn?.type || null,
      effectiveType: conn?.effectiveType || null,
      downlinkMbps: conn?.downlink ?? null,
      rttMs: conn?.rtt ?? null,
      saveData: conn?.saveData ?? null,
    },
    gpu,
    wasm: {
      webAssembly: typeof WebAssembly !== 'undefined',
      simd,
      threads: typeof SharedArrayBuffer !== 'undefined' && Boolean(window.crossOriginIsolated),
      bulkMemory,
    },
    media: { cameras, microphones, speakers, permissionNote: mediaNote },
    battery,
    interfaces: {
      bluetooth: 'bluetooth' in nav,
      usb: 'usb' in nav,
      hid: 'hid' in nav,
      serial: 'serial' in nav,
      webgpu: 'gpu' in nav,
      gamepad: 'getGamepads' in nav,
      midi: 'requestMIDIAccess' in nav,
      wakeLock: 'wakeLock' in nav,
    },
    codecs: CODEC_MIMES.map((mime) => ({
      mime,
      supported: typeof MediaSource !== 'undefined' && MediaSource.isTypeSupported(mime),
    })),
  }

  return { ...profileWithoutCaps, pbmpCapabilities: classify(profileWithoutCaps) }
}
