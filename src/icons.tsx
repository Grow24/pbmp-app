import type { LucideIcon } from 'lucide-react'
import {
  BriefcaseBusiness,
  Compass,
  Database,
  FlipHorizontal2,
  GitBranch,
  Info,
  LayoutDashboard,
  Map,
  Megaphone,
  Move,
  Network,
  PencilRuler,
  SlidersHorizontal,
  Table2,
  TrendingUp,
  UserRound,
  Workflow,
} from 'lucide-react'

export const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  filter: SlidersHorizontal,
  strategy: Compass,
  business: BriefcaseBusiness,
  marketing: Megaphone,
  sales: TrendingUp,
  map: Map,
  sheet: Table2,
  lucid: Network,
  flip: FlipHorizontal2,
  bpmn: Workflow,
  graph: GitBranch,
  drag: Move,
  gds: Database,
  drawio: PencilRuler,
  account: UserRound,
  about: Info,
}

export const iconKeys = Object.keys(iconMap)

export function getIcon(name?: string): LucideIcon {
  return iconMap[name || ''] || LayoutDashboard
}
