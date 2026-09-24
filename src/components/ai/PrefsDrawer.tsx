import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useWorkbench } from '../../context/WorkbenchContext'
import { PrefsForm } from './PrefsForm'

export function PrefsDrawer() {
  const { prefsOpen, setPrefsOpen } = useWorkbench()

  useEffect(() => {
    if (!prefsOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPrefsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [prefsOpen, setPrefsOpen])

  if (!prefsOpen) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close preferences"
        onClick={() => setPrefsOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prefs-dialog-title"
        className="relative z-[81] flex max-h-[min(88vh,720px)] w-full max-w-[520px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3">
          <div>
            <h2 id="prefs-dialog-title" className="text-[15px] font-semibold text-slate-900">
              Personal preferences
            </h2>
            <p className="text-[11px] text-slate-400">Applies to this user only</p>
          </div>
          <button type="button" className="ui-btn h-8 w-8 px-0" onClick={() => setPrefsOpen(false)} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <PrefsForm />
        </div>
      </div>
    </div>
  )
}
