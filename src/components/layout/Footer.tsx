import { Download, Link2, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useWorkbench } from '../../context/WorkbenchContext'

function favKey(id: string) {
  return `pbmp-fav:${id}`
}

export function Footer() {
  const { canvas, activeTab, activeSubtab, settings, selectedId } = useWorkbench()
  const trail = [canvas?.title, activeTab?.label, activeSubtab?.label].filter(Boolean).join(' / ')
  const [starred, setStarred] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!selectedId) {
      setStarred(false)
      return
    }
    setStarred(window.localStorage.getItem(favKey(selectedId)) === '1')
  }, [selectedId])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2200)
    return () => window.clearTimeout(timer)
  }, [notice])

  const flash = (text: string) => setNotice(text)

  const copyLink = async () => {
    const url = `${window.location.origin}/?menu=${encodeURIComponent(selectedId || 'dashboard')}`
    try {
      await navigator.clipboard.writeText(url)
      flash('Canvas link copied')
    } catch {
      flash('Could not copy link')
    }
  }

  const toggleStar = () => {
    if (!selectedId) return
    const next = !starred
    setStarred(next)
    window.localStorage.setItem(favKey(selectedId), next ? '1' : '0')
    flash(next ? `Starred ${canvas?.title || selectedId}` : 'Removed from starred')
  }

  const exportSnapshot = () => {
    const payload = {
      menu: selectedId,
      title: canvas?.title || '',
      tab: activeTab?.label || '',
      subtab: activeSubtab?.label || '',
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedId || 'canvas'}-snapshot.json`
    link.click()
    URL.revokeObjectURL(url)
    flash('Snapshot downloaded')
  }

  return (
    <footer className="flex h-8 shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 text-[11px] text-slate-500">
      <div className="min-w-0 truncate">{trail || 'Workbench'}</div>
      <div className="flex items-center gap-2">
        {notice && <span className="hidden max-w-[180px] truncate text-[10px] text-brand-600 sm:inline">{notice}</span>}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title="Copy canvas link"
            aria-label="Copy canvas link"
            onClick={() => void copyLink()}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-violet-500 hover:bg-violet-50"
          >
            <Link2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title={starred ? 'Unstar this canvas' : 'Star this canvas'}
            aria-label={starred ? 'Unstar this canvas' : 'Star this canvas'}
            onClick={toggleStar}
            className={`inline-flex h-6 w-6 items-center justify-center rounded hover:bg-orange-50 ${
              starred ? 'text-orange-500' : 'text-orange-400'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${starred ? 'fill-orange-500' : ''}`} />
          </button>
          <button
            type="button"
            title="Download canvas snapshot"
            aria-label="Download canvas snapshot"
            onClick={exportSnapshot}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-teal-500 hover:bg-teal-50"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
        <span className="hidden sm:inline">{settings.footer_org}</span>
        <span className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">
          {settings.footer_status}
        </span>
      </div>
    </footer>
  )
}
