export type CapabilityLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' | 'UNKNOWN'

export type DeviceScanProfile = {
  scannedAt: string
  source: 'pwa-browser'
  limits: string[]
  device: {
    type: string
    operatingSystem: string
    architecture: string
    platform: string
    userAgent: string
    brands: { brand: string; version: string }[]
    mobileHint: boolean | null
    languages: string[]
    timeZone: string
    pwaInstalled: boolean
    touchSupport: boolean
    maxTouchPoints: number
  }
  browser: {
    name: string
    version: string
    vendor: string
    cookiesEnabled: boolean
    doNotTrack: string | null
    pdfViewer: boolean
    serviceWorker: boolean
    notifications: boolean
  }
  cpu: {
    logicalThreads: number | null
    webWorkers: boolean
    sharedArrayBuffer: boolean
    crossOriginIsolated: boolean
  }
  memory: {
    reportedRamGB: number | null
    jsHeapUsedMB: number | null
    jsHeapLimitMB: number | null
  }
  display: {
    width: number
    height: number
    availWidth: number
    availHeight: number
    colorDepth: number
    pixelRatio: number
    orientation: string
    innerWidth: number
    innerHeight: number
  }
  storage: {
    quotaGB: number | null
    usageGB: number | null
    persisted: boolean | null
  }
  network: {
    online: boolean
    type: string | null
    effectiveType: string | null
    downlinkMbps: number | null
    rttMs: number | null
    saveData: boolean | null
  }
  gpu: {
    webgpu: boolean
    webgl: boolean
    webgl2: boolean
    vendor: string | null
    renderer: string | null
    adapterName: string | null
    adapterVendor: string | null
    features: string[]
    maxTextureSize: number | null
    computeShaders: boolean
  }
  wasm: {
    webAssembly: boolean
    simd: boolean
    threads: boolean
    bulkMemory: boolean
  }
  media: {
    cameras: { label: string; id: string }[]
    microphones: { label: string; id: string }[]
    speakers: { label: string; id: string }[]
    permissionNote: string
  }
  battery: {
    available: boolean
    charging: boolean | null
    levelPercent: number | null
  }
  interfaces: {
    bluetooth: boolean
    usb: boolean
    hid: boolean
    serial: boolean
    webgpu: boolean
    gamepad: boolean
    midi: boolean
    wakeLock: boolean
  }
  codecs: { mime: string; supported: boolean }[]
  pbmpCapabilities: {
    cpu: CapabilityLevel
    memory: CapabilityLevel
    gpu: CapabilityLevel
    wasm: CapabilityLevel
    network: CapabilityLevel
    recommended: Record<string, string>
  }
}
