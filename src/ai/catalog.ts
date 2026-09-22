export const PBMP_AGENTS = [
  {
    slug: 'general',
    name: 'General assistant',
    role: 'Default copilot for the open canvas',
  },
  {
    slug: 'executive-analyst',
    name: 'Executive Analyst',
    role: 'Board summaries, KPIs, and decisions',
  },
  {
    slug: 'business-analyst',
    name: 'Business Analyst',
    role: 'AS-IS, process, and requirements',
  },
  {
    slug: 'finance-analyst',
    name: 'Finance Analyst',
    role: 'Pricing, cost, and cycle time',
  },
  {
    slug: 'project-manager',
    name: 'Project Manager',
    role: 'Owners, risks, and next steps',
  },
] as const

export const PBMP_TEAM = [
  { id: 'priya', name: 'Priya Shah', role: 'Strategy lead' },
  { id: 'arjun', name: 'Arjun Mehta', role: 'Growth' },
  { id: 'nisha', name: 'Nisha Rao', role: 'Studio' },
] as const

export function bindingLabel(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(' · ')
}
