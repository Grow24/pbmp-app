import { AdminApp } from './admin/AdminApp'
import { Canvas } from './components/canvas/Canvas'
import { Footer } from './components/layout/Footer'
import { Header } from './components/layout/Header'
import { RightPanel } from './components/layout/RightPanel'
import { Sidebar } from './components/layout/Sidebar'
import { WorkbenchProvider, useWorkbench } from './context/WorkbenchContext'

function Shell() {
  const { rightOpen, setRightOpen, loading, error } = useWorkbench()

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
    <div className="flex h-full flex-col bg-[#f5f7fa]">
      <Header />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="flex min-w-0 flex-1">
          <Canvas />
          <div className={`${rightOpen ? 'fixed inset-y-0 right-0 z-30 w-[min(100%,340px)] shadow-lg xl:static xl:z-0 xl:shadow-none' : 'hidden xl:block'}`}>
            <RightPanel />
          </div>
        </main>
      </div>
      {rightOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/20 xl:hidden"
          aria-label="Close side panel"
          onClick={() => setRightOpen(false)}
        />
      )}
      <Footer />
    </div>
  )
}

export default function App() {
  if (window.location.pathname.startsWith('/admin')) {
    return <AdminApp />
  }

  return (
    <WorkbenchProvider>
      <Shell />
    </WorkbenchProvider>
  )
}
