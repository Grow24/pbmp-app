import { X } from 'lucide-react'
import { useWorkbench } from '../../context/WorkbenchContext'
import { PrefsForm } from './PrefsForm'

export function PrefsDrawer() {
  const { prefsOpen, setPrefsOpen } = useWorkbench()
  if (!prefsOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <button type="button" className="flex-1 bg-black/20" aria-label="Close preferences" onClick={() => setPrefsOpen(false)} />
      <aside className="flex h-full w-[min(100%,360px)] flex-col border-l border-slate-200 bg-white shadow-xl">
        <div className="flex h-10 items-center justify-between border-b border-slate-200 px-3">
          <span className="text-[13px] font-medium text-slate-800">Personal preferences</span>
          <button type="button" className="ui-btn h-7 w-7 px-0" onClick={() => setPrefsOpen(false)} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <PrefsForm compact />
        </div>
      </aside>
    </div>
  )
}
