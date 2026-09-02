import { useWorkbench } from '../../context/WorkbenchContext'
import { AboutView } from './views/AboutView'
import { AccountView } from './views/AccountView'
import { AssessView } from './views/AssessView'
import { DashboardView } from './views/DashboardView'
import { DocView } from './views/DocView'
import { FilterView } from './views/FilterView'
import { InquiryView } from './views/InquiryView'
import { MapsView } from './views/MapsView'
import { MarketView } from './views/MarketView'
import { SwotView } from './views/SwotView'
import { ToolView } from './views/ToolView'

export function CanvasBody() {
  const { viewKind } = useWorkbench()

  switch (viewKind) {
    case 'dashboard':
      return <DashboardView />
    case 'filter':
      return <FilterView />
    case 'assess':
      return <AssessView />
    case 'maps':
      return <MapsView />
    case 'inquiry':
      return <InquiryView />
    case 'market':
      return <MarketView />
    case 'swot':
      return <SwotView />
    case 'doc':
      return <DocView />
    case 'account':
      return <AccountView />
    case 'about':
      return <AboutView />
    default:
      return <ToolView />
  }
}
