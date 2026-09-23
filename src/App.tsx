import { AdminApp } from './admin/AdminApp'
import { AppManager } from './appManager/App'
import { Canvas } from './components/canvas/Canvas'
import { Footer } from './components/layout/Footer'
import { Header } from './components/layout/Header'
import { RightPanel } from './components/layout/RightPanel'
import { Sidebar } from './components/layout/Sidebar'
import { PrefsDrawer } from './components/ai/PrefsDrawer'
import { AiProvider, useAi } from './context/AiContext'
import { WorkbenchProvider, useWorkbench } from './context/WorkbenchContext'
import { usePointerDelta } from './hooks/usePointerDelta'

function Shell() {
  const { rightOpen, rightWidth, setRightWidth, loading, error } = useWorkbench()
  const { prefs } = useAi()
  const resizePanel = usePointerDelta((dx) => setRightWidth(rightWidth - dx))

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f5f7fa] text-sm text-slate-500">
        Loading configuration from MySQL…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#f5f7fa] px-6 text-center">
        <p className="text-sm font-medium text-slate-800">Could not load workbench config</p>
        <p className="max-w-md text-[13px] text-slate-500">{error}</p>
        <p className="text-[13px] text-slate-400">Check that MySQL is reachable, then refresh.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-[#f5f7fa]" data-theme={prefs.theme}>
      <Header />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="flex min-w-0 flex-1">
          <Canvas />
          {rightOpen ? (
            <div className="relative z-20 flex h-full shrink-0" style={{ width: rightWidth }}>
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize conversation panel"
                title="Drag to resize"
                className="absolute inset-y-0 left-0 z-10 w-1.5 cursor-col-resize bg-transparent hover:bg-brand-500/40"
                {...resizePanel}
              />
              <div className="min-w-0 flex-1">
                <RightPanel />
              </div>
            </div>
          ) : (
            <div className="hidden xl:block">
              <RightPanel />
            </div>
          )}
        </main>
      </div>
      <Footer />
      <PrefsDrawer />
    </div>
  )
}

export default function App() {
  if (window.location.pathname.startsWith('/app-manager')) {
    return <AppManager />
  }

  if (window.location.pathname.startsWith('/admin')) {
    return <AdminApp />
  }

  return (
    <WorkbenchProvider>
      <AiProvider>
        <Shell />
      </AiProvider>
    </WorkbenchProvider>
  )
}
