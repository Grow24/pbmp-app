import { Maximize2, Save } from 'lucide-react'
import { useAi } from '../../context/AiContext'
import { ArtifactPreview } from './ArtifactPreview'

export function ArtifactsPane() {
  const { artifacts, activeArtifact, setActiveArtifact, setFullscreenArtifact, saveArtifact } = useAi()

  if (!artifacts.length) {
    return (
      <div className="p-4 text-[13px] leading-relaxed text-slate-500">
        Ask for a board summary or a process diagram in Chat. Generated reports and Mermaid diagrams will appear here, then you can save them onto the open PBMP canvas.
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-1 overflow-y-auto border-b border-slate-100 p-2">
        {artifacts.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveArtifact(item)}
            className={`w-full rounded border px-2 py-1.5 text-left ${
              activeArtifact?.id === item.id ? 'border-brand-400 bg-brand-50' : 'border-slate-200'
            }`}
          >
            <div className="truncate text-[12px] font-medium text-slate-800">{item.title}</div>
            <div className="text-[10px] uppercase text-slate-400">
              {item.kind}
              {item.savedContentId ? ' · saved to canvas' : ''}
            </div>
          </button>
        ))}
      </div>
      {activeArtifact && (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-[13px] font-medium text-slate-800">{activeArtifact.title}</h3>
            <div className="flex gap-1">
              <button
                type="button"
                className="ui-btn h-7 px-2"
                title="Open larger resizable window"
                onClick={() => setFullscreenArtifact(true)}
              >
                <Maximize2 className="h-3 w-3" />
                Resize
              </button>
              <button
                type="button"
                className="ui-btn-primary h-7 px-2"
                disabled={Boolean(activeArtifact.savedContentId)}
                onClick={() => void saveArtifact(activeArtifact.id)}
              >
                <Save className="h-3 w-3" />
                {activeArtifact.savedContentId ? 'Saved' : 'Save to canvas'}
              </button>
            </div>
          </div>
          <ArtifactPreview artifact={activeArtifact} />
        </div>
      )}
    </div>
  )
}