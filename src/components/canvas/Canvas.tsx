import { ChevronRight, Link2, Maximize2, MessageSquare, Minimize2, Quote, X } from 'lucide-react'
import { useState } from 'react'
import { useAi } from '../../context/AiContext'
import { useWorkbench } from '../../context/WorkbenchContext'
import { usePointerDelta } from '../../hooks/usePointerDelta'
import { ArtifactPreview, artifactFromContent } from '../ai/ArtifactPreview'
import { PageFilters } from '../filter/PageFilters'
import { CanvasBody } from './CanvasBody'

export function Canvas() {
  const {
    canvas,
    ancestors,
    activeTab,
    activeSubtab,
    setTab,
    setSubtab,
    rightOpen,
    setRightOpen,
    setRightTab,
    viewKind,
    blocks,
  } = useWorkbench()
  const { setQuote, activeArtifact, fullscreenArtifact, setFullscreenArtifact, artifacts, binding, conversation } = useAi()
  const [artifactMax, setArtifactMax] = useState(false)
  const [artifactSize, setArtifactSize] = useState({ w: 760, h: 540 })
  const resizeArtifact = usePointerDelta((dx, dy) => {
    setArtifactSize((prev) => ({
      w: Math.min(window.innerWidth - 48, Math.max(420, prev.w + dx)),
      h: Math.min(window.innerHeight - 48, Math.max(280, prev.h + dy)),
    }))
  })

  if (!canvas) {
    return (
      <section className="flex flex-1 items-center justify-center bg-[#f5f7fa] text-sm text-slate-500">
        Select a menu item to open its workspace.
      </section>
    )
  }

  const isDiagram = viewKind === 'maps' || viewKind === 'tool'
  const saved = [...blocks('doc'), ...blocks()].filter((item) => item.blockType === 'ai_artifact')
  const uniqueSaved = saved.filter((item, index) => saved.findIndex((row) => row.id === item.id) === index)

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-white">
      <div className="border-b border-slate-200 px-4 pt-3 sm:px-5">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          {ancestors.map((item, index) => (
            <span key={item.id} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3 w-3" />}
              {item.label}
            </span>
          ))}
        </div>

        <div className="mt-1.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900">{canvas.title}</h1>
            <p className="mt-0.5 max-w-2xl text-[13px] text-slate-500">{canvas.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="ui-btn"
              title="Open the chat that is bound to this menu + tab"
              onClick={() => {
                setRightTab('chat')
                setRightOpen(true)
              }}
            >
              <Link2 className="h-3.5 w-3.5" />
              Bound chat
            </button>
            <button
              type="button"
              className="ui-btn"
              onClick={() => {
                setQuote([canvas.title, canvas.description, activeTab?.label].filter(Boolean).join(' — '))
                setRightTab('chat')
                setRightOpen(true)
              }}
            >
              <Quote className="h-3.5 w-3.5" />
              Quote canvas
            </button>
            {!rightOpen && (
              <button type="button" className="ui-btn xl:hidden" onClick={() => setRightOpen(true)}>
                <MessageSquare className="h-3.5 w-3.5" />
                Panel
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex gap-0 overflow-x-auto">
          {canvas.tabs.map((tab) => {
            const selected = activeTab?.id === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-[13px] ${
                  selected
                    ? 'border-brand-500 font-medium text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab?.subtabs && (
        <div className="flex gap-1 border-b border-slate-200 bg-[#fafafa] px-4 sm:px-5">
          {activeTab.subtabs.map((tab) => {
            const selected = activeSubtab?.id === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubtab(tab.id)}
                className={`-mb-px border-b-2 px-3 py-2 text-xs ${
                  selected
                    ? 'border-brand-500 font-medium text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-b border-sky-100 bg-sky-50 px-4 py-2 sm:px-5">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-sky-700">Chat binding</p>
          <p className="truncate text-[13px] text-sky-950">
            <span className="font-medium">{binding || canvas.title}</span>
            <span className="text-sky-800">
              {conversation?.temporary
                ? ' · scratch (not saved)'
                : conversation
                  ? ` · saved as “${conversation.title}”`
                  : ' · new chat for this level'}
            </span>
          </p>
          <p className="mt-0.5 text-[11px] text-sky-800/80">
            This conversation belongs only to this menu + tab. Switch Dashboard, SWOT, or a subtab and a different chat opens. Saved history is not overwritten.
          </p>
        </div>
        <button
          type="button"
          className="ui-btn shrink-0"
          onClick={() => {
            setRightTab('chat')
            setRightOpen(true)
          }}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Open this chat
        </button>
      </div>

      <div className={`min-h-0 flex-1 overflow-auto p-4 sm:p-5 ${isDiagram ? 'canvas-grid' : 'bg-[#f5f7fa]'}`}>
        {viewKind !== 'filter' && <PageFilters page={viewKind} />}
        <CanvasBody />
        {(uniqueSaved.length > 0 || artifacts.length > 0) && (
          <div className="mt-4 ui-card p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Saved AI artifacts on this workspace</p>
            {!uniqueSaved.length ? (
              <p className="mt-2 text-[12px] text-slate-400">Nothing saved yet — generate a report, diagram, or EChart, then Save to canvas.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {uniqueSaved.map((item) => (
                  <article key={item.id} className="overflow-hidden rounded border border-slate-200 bg-white p-3">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      {String(item.value || 'artifact')} · saved from conversation
                    </p>
                    <h3 className="mb-2 text-sm font-semibold text-slate-900">{item.title}</h3>
                    <ArtifactPreview artifact={artifactFromContent(item, uniqueSaved)} compact />
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {fullscreenArtifact && activeArtifact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div
            className="relative flex max-h-full max-w-full flex-col rounded border border-slate-200 bg-white shadow-2xl"
            style={
              artifactMax
                ? { width: 'min(100%, 1120px)', height: 'min(100%, 860px)' }
                : { width: artifactSize.w, height: artifactSize.h }
            }
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
              <div>
                <p className="text-[11px] uppercase text-slate-400">Artifact · drag the corner to resize</p>
                <h2 className="text-sm font-semibold text-slate-900">{activeArtifact.title}</h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="ui-btn"
                  title={artifactMax ? 'Restore size' : 'Larger'}
                  onClick={() => setArtifactMax((value) => !value)}
                >
                  {artifactMax ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  className="ui-btn"
                  onClick={() => {
                    setArtifactMax(false)
                    setFullscreenArtifact(false)
                  }}
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-5">
              <ArtifactPreview artifact={activeArtifact} />
            </div>
            {!artifactMax && (
              <div
                role="separator"
                aria-label="Resize artifact"
                title="Drag to resize"
                className="absolute bottom-1 right-1 h-4 w-4 cursor-se-resize rounded-sm border-b-2 border-r-2 border-slate-400"
                {...resizeArtifact}
              />
            )}
          </div>
        </div>
      )}
    </section>
  )
}
