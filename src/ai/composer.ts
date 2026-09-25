import type { AiAgent } from './types'
import type { MenuItem, MenuSection } from '../types'
import type { WorkbenchAction } from './commands'

export type ComposerKind = 'at' | 'dollar' | 'hash' | 'slash'

export type SlashItem = {
  token: string
  label: string
  hint: string
  ask?: string
  action?: WorkbenchAction
  open?: 'dashboard' | 'all-chats' | 'artifacts'
}

export type SkillItem = {
  slug: string
  label: string
  hint: string
  prompt: string
}

export const SLASH_COMMANDS: SlashItem[] = [
  { token: 'pie', label: 'Pie chart', hint: 'Chart from this canvas', ask: 'pie chart of this canvas' },
  { token: 'bar', label: 'Bar chart', hint: 'Chart from this canvas', ask: 'bar chart of this canvas' },
  { token: 'line', label: 'Line chart', hint: 'Trend from this canvas', ask: 'line chart of this canvas' },
  { token: 'panel', label: 'Chart panel', hint: 'Several types in one view', ask: 'Show me an echart panel' },
  { token: 'diagram', label: 'Process diagram', hint: 'Mermaid flowchart', ask: 'process diagram of this canvas' },
  { token: 'report', label: 'Board summary', hint: 'Leadership note', ask: 'Write a board summary of this canvas' },
  { token: 'save', label: 'Save to canvas', hint: 'Pin the last artifact', action: 'save' },
  { token: 'remove', label: 'Remove from canvas', hint: 'Unpin saved artifact', action: 'remove' },
  { token: 'voice', label: 'Speak reply', hint: 'Read the last answer', action: 'speak-last' },
  { token: 'stop', label: 'Stop voice', hint: 'Mute playback', action: 'stop-speak' },
  { token: 'dashboard', label: 'Open Dashboard', hint: 'Jump to Dashboard', open: 'dashboard' },
  { token: 'chats', label: 'All Chats', hint: 'Every saved thread', open: 'all-chats' },
  { token: 'artifacts', label: 'Artifacts', hint: 'Charts and diagrams', open: 'artifacts' },
  { token: 'help', label: 'Help', hint: 'List @ $ # / shortcuts', action: 'help' },
]

export const PBMP_SKILLS: SkillItem[] = [
  {
    slug: 'board-summary',
    label: 'Board summary',
    hint: 'Short leadership read',
    prompt: 'Give a board-ready summary of this canvas in five lines. What matters, what is at risk, what to decide.',
  },
  {
    slug: 'risk-analysis',
    label: 'Risk analysis',
    hint: 'Risks and next action',
    prompt: 'List the top risks on this canvas, who owns them, and one next action for each.',
  },
  {
    slug: 'as-is',
    label: 'AS-IS walkthrough',
    hint: 'Current-state process',
    prompt: 'Walk the AS-IS process on this canvas and name the binding constraint.',
  },
  {
    slug: 'pricing',
    label: 'Pricing lens',
    hint: 'Numbers and leakage',
    prompt: 'Explain pricing and related scores on this canvas. Ground every point in the numbers shown.',
  },
  {
    slug: 'chart-panel',
    label: 'Chart panel',
    hint: 'Bar, pie and radar together',
    prompt: 'Show me an echart panel',
  },
  {
    slug: 'process-map',
    label: 'Process map',
    hint: 'Mermaid flowchart',
    prompt: 'process diagram of this canvas',
  },
]

export const OPENAI_TTS_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const

export function composerTrigger(text: string): { kind: ComposerKind; query: string } | null {
  const slash = text.match(/(?:^|\s)\/([A-Za-z0-9-]*)$/)
  const dollar = text.match(/\$([A-Za-z0-9-]*)$/)
  const hash = text.match(/#([A-Za-z0-9- ]*)$/)
  const at = text.match(/@([A-Za-z]*)$/)
  const found = [
    slash ? { kind: 'slash' as const, query: slash[1], at: slash.index ?? -1 } : null,
    dollar ? { kind: 'dollar' as const, query: dollar[1], at: dollar.index ?? -1 } : null,
    hash ? { kind: 'hash' as const, query: hash[1], at: hash.index ?? -1 } : null,
    at ? { kind: 'at' as const, query: at[1], at: at.index ?? -1 } : null,
  ].filter(Boolean) as Array<{ kind: ComposerKind; query: string; at: number }>
  if (!found.length) return null
  found.sort((a, b) => b.at - a.at)
  return { kind: found[0].kind, query: found[0].query }
}

export function filterByQuery<T>(items: T[], query: string, text: (item: T) => string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return items
  return items.filter((item) => text(item).toLowerCase().includes(needle))
}

export function flattenMenu(sections: MenuSection[]): MenuItem[] {
  const walk = (items: MenuItem[]): MenuItem[] => items.flatMap((item) => [item, ...(item.children ? walk(item.children) : [])])
  return walk(sections.flatMap((section) => section.items)).filter((item) => item.canvas)
}

export function replaceComposerTrigger(text: string, kind: ComposerKind, token: string) {
  if (kind === 'at') return text.replace(/@([A-Za-z]*)$/, `@${token} `)
  if (kind === 'dollar') return text.replace(/\$([A-Za-z0-9-]*)$/, `$${token} `)
  if (kind === 'hash') return text.replace(/#([A-Za-z0-9- ]*)$/, `#${token} `)
  return text.replace(/(^|\s)\/([A-Za-z0-9-]*)$/, `$1/${token} `)
}

export function insertComposerTrigger(text: string, mark: '@' | '$' | '#' | '/') {
  if (text.endsWith(mark)) return text
  return `${text}${text && !/\s$/.test(text) ? ' ' : ''}${mark}`
}

export function applyComposerMessage(raw: string, agents: AiAgent[]) {
  let text = raw.trim()
  const skillMatch = text.match(/\$([a-z0-9-]+)/i)
  const skill = skillMatch ? PBMP_SKILLS.find((item) => item.slug === skillMatch[1].toLowerCase()) : undefined
  const slashMatch = text.match(/(?:^|\s)\/([a-z0-9-]+)\b/i)
  const slash = slashMatch ? SLASH_COMMANDS.find((item) => item.token === slashMatch[1].toLowerCase()) : undefined
  const agentHit = agents.find((agent) => text.toLowerCase().includes(`@${agent.name.toLowerCase()}`))

  if (slash?.action || slash?.open) {
    return { text, skill, slash, agent: agentHit }
  }
  if (slash?.ask) {
    text = `${slash.ask}${text.replace(slashMatch![0], ' ').trim() ? `\n\n${text.replace(slashMatch![0], ' ').trim()}` : ''}`
  }
  if (skill) {
    text = `${skill.prompt}${text.replace(skillMatch![0], ' ').trim() ? `\n\n${text.replace(skillMatch![0], ' ').trim()}` : ''}`
  }
  return { text, skill, slash, agent: agentHit }
}
