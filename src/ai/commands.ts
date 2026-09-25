export type WorkbenchAction = 'save' | 'remove' | 'speak-last' | 'stop-speak' | 'all-chats' | 'new-chat' | 'artifacts' | 'help' | 'dashboard'

export type ParsedCommand =
  | { kind: 'ask'; message: string }
  | { kind: 'action'; action: WorkbenchAction }

const HELP = [
  'Say or type a command. The reply follows that command.',
  '',
  '**Make** — pie chart / bar chart / line chart / echart / panel / process diagram / board summary',
  '**Keep** — save (Save to canvas) · remove',
  '**Voice** — speak (read last reply) · stop',
  '**Open** — all chats · artifacts · new chat',
  '**Help** — help / commands',
  '',
  'Shortcuts in the box:',
  '**@** who (Agent or teammate) · **$** how (Skill) · **#** what (canvas) · **/** action (`/pie` `/save` `/voice`)',
].join('\n')

export function commandHelp() {
  return HELP
}

function norm(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/g, '')
    .replace(/\s+/g, ' ')
}

export function parseCommand(raw: string): ParsedCommand {
  const text = norm(raw)
  if (!text) return { kind: 'ask', message: raw }

  const slash = text.match(/^\/([a-z0-9-]+)\b/)
  if (slash) {
    const token = slash[1]
    if (token === 'help') return { kind: 'action', action: 'help' }
    if (token === 'stop') return { kind: 'action', action: 'stop-speak' }
    if (token === 'voice' || token === 'speak') return { kind: 'action', action: 'speak-last' }
    if (token === 'save') return { kind: 'action', action: 'save' }
    if (token === 'remove' || token === 'delete') return { kind: 'action', action: 'remove' }
    if (token === 'chats') return { kind: 'action', action: 'all-chats' }
    if (token === 'artifacts') return { kind: 'action', action: 'artifacts' }
    if (token === 'dashboard') return { kind: 'action', action: 'dashboard' }
  }

  if (/^(help|commands?)\b/.test(text) || text === '/help') {
    return { kind: 'action', action: 'help' }
  }
  if (/^(stop|quiet)\b/.test(text)) {
    return { kind: 'action', action: 'stop-speak' }
  }
  if (/^(speak|read\s+(it|the\s+reply))\b/.test(text)) {
    return { kind: 'action', action: 'speak-last' }
  }
  if (/^(save|save\s+to\s+canvas)\b/.test(text)) {
    return { kind: 'action', action: 'save' }
  }
  if (/^(remove|delete\s+artifact)\b/.test(text)) {
    return { kind: 'action', action: 'remove' }
  }
  if (/^all\s+chats?\b/.test(text)) {
    return { kind: 'action', action: 'all-chats' }
  }
  if (/^new\s+chat\b/.test(text)) {
    return { kind: 'action', action: 'new-chat' }
  }
  if (/^artifacts?\b/.test(text)) {
    return { kind: 'action', action: 'artifacts' }
  }

  return { kind: 'ask', message: rewriteAsk(raw, text) }
}

function rewriteAsk(original: string, text: string) {
  if (/\b(panel|dashboard\s+of\s+charts|chart\s+panel|echart\s+panel)\b/.test(text)) {
    return 'Show me an echart panel'
  }
  if (/\b(pie|donut|doughnut)\b/.test(text) && /\b(chart|graph|plot)\b/.test(text)) {
    return 'pie chart of this canvas'
  }
  if (/\b(bar|column)\b/.test(text) && /\b(chart|graph)\b/.test(text)) {
    return 'bar chart of this canvas'
  }
  if (/\b(line|trend)\b/.test(text) && /\b(chart|graph)\b/.test(text)) {
    return 'line chart of this canvas'
  }
  if (/\bradar\b/.test(text)) return 'radar chart of this canvas'
  if (/\bfunnel\b/.test(text)) return 'funnel chart of this canvas'
  if (/\bgauge\b/.test(text)) return 'gauge chart of this canvas'
  if (/\bheatmap\b/.test(text)) return 'heatmap of this canvas'
  if (/\bscatter\b/.test(text)) return 'scatter chart of this canvas'
  if (/\b(echart|e-chart|visuali[sz]e)\b/.test(text) || /^(chart|graph)$/.test(text)) {
    return 'Show me an echart'
  }
  if (/\b(process\s+diagram|flowchart|mermaid|architecture|bpmn)\b/.test(text)) {
    return 'process diagram of this canvas'
  }
  if (/\b(board\s+summary|report|executive|write-?up)\b/.test(text)) {
    return 'Write a board summary of this canvas'
  }
  return original.trim()
}
