import { AppWindow, ExternalLink, Library, PanelRight } from 'lucide-react'
import { useAi } from '../../context/AiContext'
import { ArtifactPreview } from './ArtifactPreview'

export function ArtifactsPane() {
  const { artifacts, activeArtifact, setActiveArtifact, canvasArtifact, setCanvasArtifact, addToLibrary, error } = useAi()

  if (!artifacts.length) {
    return (
      <div className="p-4 text-[13px] leading-relaxed text-slate-500">
        Ask in Chat for a chart, a process diagram, an HTML page, or a script. It shows up here, and you can open it in this panel, on the main canvas, or in a new window. Add to Library keeps a copy that is not tied to this page.
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="max-h-40 space-y-1 overflow-y-auto border-b border-slate-100 p-2">
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
              {item.inLibrary ? ' · in library' : ''}
              {canvasArtifact?.id === item.id ? ' · on canvas' : ''}
            </div>
          </button>
        ))}
      </div>
      {activeArtifact && (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <h3 className="mb-2 text-[13px] font-medium text-slate-800">{activeArtifact.title}</h3>
          <div className="mb-3 grid grid-cols-2 gap-1">
            <button
              type="button"
              className="ui-btn h-8 px-2 text-[11px]"
              title="Preview in this panel"
              onClick={() => setActiveArtifact(activeArtifact)}
            >
              <PanelRight className="h-3 w-3" />
              Open here
            </button>
            <button
              type="button"
              className="ui-btn h-8 px-2 text-[11px]"
              title="Replace the page visual until you close it"
              onClick={() => {
                setActiveArtifact(activeArtifact)
                setCanvasArtifact(activeArtifact)
              }}
            >
              <AppWindow className="h-3 w-3" />
              Open in main canvas
            </button>
            <button
              type="button"
              className="ui-btn h-8 px-2 text-[11px]"
              title="Open in a new browser window"
              onClick={() => window.open(`/artifact/${activeArtifact.id}`, '_blank', 'noopener')}
            >
              <ExternalLink className="h-3 w-3" />
              Open in new window
            </button>
            <button
              type="button"
              className="ui-btn h-8 px-2 text-[11px] disabled:cursor-default disabled:opacity-60 disabled:hover:border-slate-200 disabled:hover:text-slate-700"
              disabled={Boolean(activeArtifact.inLibrary)}
              title="Keep a copy that is not tied to this page"
              onClick={() => void addToLibrary(activeArtifact.id)}
            >
              <Library className="h-3 w-3" />
              {activeArtifact.inLibrary ? 'In library' : 'Add to Library'}
            </button>
          </div>
          {error && <p className="mb-2 text-[12px] text-rose-600">{error}</p>}
          <ArtifactPreview artifact={activeArtifact} />
        </div>
      )}
    </div>
  )
}
