import { invoke } from '@tauri-apps/api/core'

export type DesktopDiskInfo = {
  mountPoint: string
  fileSystem: string
  totalBytes: number
  availableBytes: number
}

export type DesktopSystemInfo = {
  hostName: string | null
  os: string | null
  cpuModel: string | null
  logicalCores: number
  physicalCores: number | null
  totalMemoryBytes: number
  availableMemoryBytes: number
  disks: DesktopDiskInfo[]
}

export function isPbmpDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export function getDesktopSystemInfo(): Promise<DesktopSystemInfo> {
  return invoke<DesktopSystemInfo>('system_info')
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`
}
