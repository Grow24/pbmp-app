export const VIEW_KINDS = [
  'dashboard',
  'filter',
  'assess',
  'maps',
  'inquiry',
  'market',
  'swot',
  'doc',
  'tool',
  'account',
  'about',
  'highlight',
] as const

export const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  filter: 'Saved filters',
  assess: 'Assess AS IS',
  maps: 'Maps',
  inquiry: 'Inquiry',
  market: 'Market Dynamics',
  swot: 'SWOT',
  doc: 'Strategy Doc',
  tool: 'Studio workspace',
  account: 'Account',
  about: 'About',
  highlight: 'Highlights',
}

export type FieldDef = {
  key: 'title' | 'subtitle' | 'body' | 'value_text' | `extra.${string}`
  label: string
  hint?: string
  type?: 'text' | 'textarea' | 'select' | 'number'
  options?: { value: string; label: string }[]
}

export const BLOCK_META: Record<string, { label: string; views: string[]; fields: FieldDef[] }> = {
  kpi: {
    label: 'KPI card',
    views: ['dashboard'],
    fields: [
      { key: 'title', label: 'Label', hint: 'e.g. Strategy health' },
      { key: 'value_text', label: 'Number' },
      { key: 'extra.suffix', label: 'Suffix', hint: 'e.g. /100 or d' },
      { key: 'extra.delta', label: 'Trend text', hint: 'e.g. +6 pts' },
      { key: 'extra.tone', label: 'Tone', type: 'select', options: [{ value: 'good', label: 'Good (green)' }, { value: 'warn', label: 'Warning (amber)' }] },
    ],
  },
  work_row: {
    label: 'Continue-working row',
    views: ['dashboard'],
    fields: [
      { key: 'title', label: 'Item' },
      { key: 'subtitle', label: 'Owner' },
      { key: 'value_text', label: 'Status' },
    ],
  },
  sprint: {
    label: 'Sprint card',
    views: ['dashboard'],
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'body', label: 'Description', type: 'textarea' },
    ],
  },
  sprint_stat: {
    label: 'Sprint stat',
    views: ['dashboard'],
    fields: [
      { key: 'title', label: 'Label' },
      { key: 'value_text', label: 'Value' },
    ],
  },
  assess_summary: {
    label: 'Current-state summary',
    views: ['assess'],
    fields: [
      { key: 'title', label: 'Kicker', hint: 'e.g. Current state' },
      { key: 'subtitle', label: 'Heading' },
      { key: 'body', label: 'Summary', type: 'textarea' },
    ],
  },
  assess_metric: {
    label: 'Current-state metric',
    views: ['assess'],
    fields: [
      { key: 'title', label: 'Label' },
      { key: 'value_text', label: 'Value' },
    ],
  },
  assess_alert: {
    label: 'Steering alert',
    views: ['assess'],
    fields: [
      { key: 'body', label: 'Message', type: 'textarea' },
      { key: 'extra.tone', label: 'Color', type: 'select', options: [
        { value: 'rose', label: 'Red / risk' },
        { value: 'amber', label: 'Amber / warning' },
        { value: 'emerald', label: 'Green / good' },
      ] },
    ],
  },
  capability: {
    label: 'Capability score',
    views: ['assess'],
    fields: [
      { key: 'title', label: 'Capability' },
      { key: 'value_text', label: 'Score (0-100)', type: 'number' },
      { key: 'body', label: 'Note' },
    ],
  },
  inquiry_intro: {
    label: 'Inquiry intro',
    views: ['inquiry'],
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'body', label: 'Description', type: 'textarea' },
    ],
  },
  inquiry: {
    label: 'Inquiry Q&A',
    views: ['inquiry'],
    fields: [
      { key: 'title', label: 'Question', type: 'textarea' },
      { key: 'body', label: 'Answer', type: 'textarea' },
    ],
  },
  market_signal: {
    label: 'Market signal',
    views: ['market'],
    fields: [
      { key: 'title', label: 'Label' },
      { key: 'value_text', label: 'Value' },
      { key: 'body', label: 'Detail', type: 'textarea' },
    ],
  },
  market_narrative: {
    label: 'Market narrative',
    views: ['market'],
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'body', label: 'Narrative', type: 'textarea' },
    ],
  },
  swot: {
    label: 'SWOT item',
    views: ['swot'],
    fields: [
      { key: 'title', label: 'Quadrant', type: 'select', options: [
        { value: 'Strengths', label: 'Strengths' },
        { value: 'Weaknesses', label: 'Weaknesses' },
        { value: 'Opportunities', label: 'Opportunities' },
        { value: 'Threats', label: 'Threats' },
      ] },
      { key: 'body', label: 'Point' },
    ],
  },
  doc_meta: {
    label: 'Document header',
    views: ['doc'],
    fields: [
      { key: 'title', label: 'Kicker' },
      { key: 'subtitle', label: 'Meta line' },
    ],
  },
  doc_section: {
    label: 'Document section',
    views: ['doc'],
    fields: [
      { key: 'title', label: 'Heading' },
      { key: 'body', label: 'Paragraph', type: 'textarea' },
      { key: 'extra.items', label: 'Bullet list (one per line)', type: 'textarea', hint: 'Used as numbered moves' },
    ],
  },
  map_meta: {
    label: 'Map header',
    views: ['maps'],
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'subtitle', label: 'Subtitle' },
      { key: 'value_text', label: 'Badge', hint: 'e.g. 5 stages' },
    ],
  },
  map_node: {
    label: 'Map node',
    views: ['maps'],
    fields: [
      { key: 'title', label: 'Node id' },
      { key: 'subtitle', label: 'Label' },
      { key: 'extra.x', label: 'X position %', type: 'number' },
      { key: 'extra.y', label: 'Y position %', type: 'number' },
    ],
  },
  filter_intro: {
    label: 'Filter intro',
    views: ['filter'],
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'body', label: 'Description', type: 'textarea' },
    ],
  },
  filter_view: {
    label: 'Saved view',
    views: ['filter'],
    fields: [
      { key: 'title', label: 'View name' },
      { key: 'subtitle', label: 'Scope' },
      { key: 'body', label: 'Owner' },
      { key: 'value_text', label: 'Item count' },
    ],
  },
  highlight: {
    label: 'Highlight',
    views: ['highlight'],
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'body', label: 'Note', type: 'textarea' },
      { key: 'subtitle', label: 'Author' },
      { key: 'value_text', label: 'Time' },
      { key: 'extra.tone', label: 'Tone', type: 'select', options: [
        { value: 'insight', label: 'Insight' },
        { value: 'risk', label: 'Risk' },
        { value: 'action', label: 'Action' },
      ] },
    ],
  },
  account_field: {
    label: 'Account field',
    views: ['account'],
    fields: [
      { key: 'title', label: 'Field label' },
      { key: 'value_text', label: 'Value' },
    ],
  },
  about_intro: {
    label: 'About intro',
    views: ['about'],
    fields: [
      { key: 'title', label: 'Kicker' },
      { key: 'subtitle', label: 'Heading' },
      { key: 'body', label: 'Description', type: 'textarea' },
    ],
  },
  about_feature: {
    label: 'About feature',
    views: ['about'],
    fields: [{ key: 'title', label: 'Feature' }],
  },
  tool_action: {
    label: 'Studio button',
    views: ['tool'],
    fields: [
      { key: 'title', label: 'Button label' },
      { key: 'extra.primary', label: 'Primary button', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ] },
    ],
  },
  tool_slot: {
    label: 'Studio slot',
    views: ['tool'],
    fields: [{ key: 'title', label: 'Slot label' }],
  },
}

export const BLOCK_TYPES = Object.keys(BLOCK_META)

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function blocksForView(view: string) {
  return Object.entries(BLOCK_META)
    .filter(([, meta]) => meta.views.includes(view))
    .map(([type, meta]) => ({ type, ...meta }))
}
