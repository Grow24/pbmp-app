import { pool } from './db.js'

export const DEFAULT_AGENTS = [
  {
    slug: 'general',
    name: 'General assistant',
    role: 'Default copilot for the open canvas',
    useWhen: 'Everyday questions, walk the current tab, or you are not sure which lens to pick.',
    ask: 'What does this canvas already show, and what should we open next?',
    instruction: 'Answer as a general workbench copilot. Stay on the open canvas. Offer a short next step.',
  },
  {
    slug: 'executive-analyst',
    name: 'Executive Analyst',
    role: 'Board summaries, KPIs, and decisions',
    useWhen: 'Steering or leadership needs a short read: what matters, what is at risk, what to decide.',
    ask: 'Give a board-ready summary of this canvas in five lines.',
    instruction: 'Answer as an Executive Analyst. Prefer KPIs, decisions, risks, and a one-line recommendation. Skip process detail unless asked.',
  },
  {
    slug: 'business-analyst',
    name: 'Business Analyst',
    role: 'AS-IS, process, and requirements',
    useWhen: 'You are on Assess, Maps, or Inquiry and need the current-state story or a requirement.',
    ask: 'Walk the AS-IS process and name the binding constraint.',
    instruction: 'Answer as a Business Analyst. Focus on AS-IS process, ownership, requirements, and gaps on this canvas.',
  },
  {
    slug: 'finance-analyst',
    name: 'Finance Analyst',
    role: 'Pricing, cost, and cycle time',
    useWhen: 'The question is about price, margin, cycle time, or a number on the canvas.',
    ask: 'Why is pricing the weak score, and what does that do to cycle time?',
    instruction: 'Answer as a Finance Analyst. Ground every point in numbers on the canvas: price, cost, cycle time, leakage.',
  },
  {
    slug: 'project-manager',
    name: 'Project Manager',
    role: 'Owners, risks, and next steps',
    useWhen: 'You need who owns the work, what is blocked, and the next action this week.',
    ask: 'Who owns the next step, and what is at risk if we miss Friday?',
    instruction: 'Answer as a Project Manager. Name owners, dates, risks, and a concrete next step. Do not write strategy essays.',
  },
]

export const DEFAULT_SKILLS = [
  {
    slug: 'board-summary',
    label: 'Board summary',
    hint: 'Short leadership read',
    prompt: 'Give a board-ready summary of this canvas in five lines. What matters, what is at risk, what to decide.',
    intent: 'report',
  },
  {
    slug: 'risk-analysis',
    label: 'Risk analysis',
    hint: 'Risks and next action',
    prompt: 'List the top risks on this canvas, who owns them, and one next action for each.',
    intent: 'risk',
  },
  {
    slug: 'as-is',
    label: 'AS-IS walkthrough',
    hint: 'Current-state process',
    prompt: 'Walk the AS-IS process on this canvas and name the binding constraint.',
    intent: 'as-is',
  },
  {
    slug: 'pricing',
    label: 'Pricing lens',
    hint: 'Numbers and leakage',
    prompt: 'Explain pricing and related scores on this canvas. Ground every point in the numbers shown.',
    intent: 'pricing',
  },
  {
    slug: 'chart-panel',
    label: 'Chart panel',
    hint: 'Bar, pie and radar together',
    prompt: 'Show me an echart panel',
    intent: 'chart',
  },
  {
    slug: 'process-map',
    label: 'Process map',
    hint: 'Mermaid flowchart',
    prompt: 'process diagram of this canvas',
    intent: 'diagram',
  },
]

export const DEFAULT_TEAM = [
  { id: 'priya', name: 'Priya Shah', role: 'Strategy lead' },
  { id: 'arjun', name: 'Arjun Mehta', role: 'Growth' },
  { id: 'nisha', name: 'Nisha Rao', role: 'Studio' },
]

const INTENTS = ['ask', 'report', 'diagram', 'chart', 'risk', 'as-is', 'pricing']

let cache = {
  agents: DEFAULT_AGENTS,
  skills: DEFAULT_SKILLS,
  team: DEFAULT_TEAM,
}

const runtime = { base: '', key: '', model: '' }

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

function mapAgent(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    role: row.role || '',
    useWhen: row.use_when || '',
    ask: row.ask_text || '',
    instruction: row.instruction || '',
    isActive: Boolean(row.is_active),
  }
}

function mapSkill(row) {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    hint: row.hint || '',
    prompt: row.prompt || '',
    intent: INTENTS.includes(row.intent) ? row.intent : 'ask',
    isActive: Boolean(row.is_active),
  }
}

function mapTeam(row) {
  return {
    id: row.slug,
    dbId: row.id,
    name: row.name,
    role: row.role || '',
    isActive: Boolean(row.is_active),
  }
}

export function catalogSnapshot() {
  return cache
}

export function runtimeOverrides() {
  return runtime
}

export async function refreshCatalog() {
  const [agents] = await pool.query('SELECT * FROM ai_agents ORDER BY sort_order, id')
  const [skills] = await pool.query('SELECT * FROM ai_skills ORDER BY sort_order, id')
  const [team] = await pool.query('SELECT * FROM ai_teammates ORDER BY sort_order, id')
  cache = {
    agents: agents.length ? agents.map(mapAgent) : DEFAULT_AGENTS,
    skills: skills.length ? skills.map(mapSkill) : DEFAULT_SKILLS,
    team: team.length ? team.map(mapTeam) : DEFAULT_TEAM,
  }
  const [config] = await pool.query('SELECT setting_key, setting_value FROM ai_runtime_config')
  const map = Object.fromEntries(config.map((row) => [row.setting_key, row.setting_value]))
  runtime.base = map.AI_BASE_URL || ''
  runtime.key = map.AI_API_KEY || ''
  runtime.model = map.AI_MODEL || ''
  return cache
}

export async function seedAiCatalog() {
  for (const [index, agent] of DEFAULT_AGENTS.entries()) {
    await pool.query(
      `INSERT IGNORE INTO ai_agents (slug, name, role, use_when, ask_text, instruction, sort_order, is_active)
       VALUES (?,?,?,?,?,?,?,1)`,
      [agent.slug, agent.name, agent.role, agent.useWhen, agent.ask, agent.instruction, index + 1],
    )
  }
  for (const [index, skill] of DEFAULT_SKILLS.entries()) {
    await pool.query(
      `INSERT IGNORE INTO ai_skills (slug, label, hint, prompt, intent, sort_order, is_active)
       VALUES (?,?,?,?,?,?,1)`,
      [skill.slug, skill.label, skill.hint, skill.prompt, skill.intent, index + 1],
    )
  }
  for (const [index, person] of DEFAULT_TEAM.entries()) {
    await pool.query(
      `INSERT IGNORE INTO ai_teammates (slug, name, role, sort_order, is_active) VALUES (?,?,?,?,1)`,
      [person.id, person.name, person.role, index + 1],
    )
  }
  await refreshCatalog()
}

function active(list) {
  return list.filter((item) => item.isActive !== false)
}

export function publicCatalog() {
  return {
    agents: active(cache.agents).map(({ isActive, ...item }) => item),
    skills: active(cache.skills).map(({ isActive, ...item }) => item),
    team: active(cache.team).map(({ isActive, dbId, ...item }) => item),
  }
}

export async function saveAgent(body, id) {
  const name = String(body.name || '').trim()
  if (!name) throw new Error('name is required')
  const slug = slugify(body.slug || name) || `agent-${Date.now()}`
  const fields = [slug, name, body.role || '', body.useWhen || '', body.ask || '', body.instruction || '', body.isActive === false ? 0 : 1]
  if (id) {
    await pool.query(
      'UPDATE ai_agents SET slug=?, name=?, role=?, use_when=?, ask_text=?, instruction=?, is_active=? WHERE id=?',
      [...fields, id],
    )
  } else {
    const [sort] = await pool.query('SELECT COALESCE(MAX(sort_order), 0) AS sort FROM ai_agents')
    await pool.query(
      `INSERT INTO ai_agents (slug, name, role, use_when, ask_text, instruction, is_active, sort_order)
       VALUES (?,?,?,?,?,?,?,?)`,
      [...fields, Number(sort[0].sort) + 1],
    )
  }
  await refreshCatalog()
}

export async function deleteAgent(id) {
  await pool.query('DELETE FROM ai_agents WHERE id = ?', [id])
  await refreshCatalog()
}

export async function saveSkill(body, id) {
  const label = String(body.label || '').trim()
  const prompt = String(body.prompt || '').trim()
  if (!label || !prompt) throw new Error('label and prompt are required')
  const slug = slugify(body.slug || label) || `skill-${Date.now()}`
  const intent = INTENTS.includes(body.intent) ? body.intent : 'ask'
  const fields = [slug, label, body.hint || '', prompt, intent, body.isActive === false ? 0 : 1]
  if (id) {
    await pool.query('UPDATE ai_skills SET slug=?, label=?, hint=?, prompt=?, intent=?, is_active=? WHERE id=?', [...fields, id])
  } else {
    const [sort] = await pool.query('SELECT COALESCE(MAX(sort_order), 0) AS sort FROM ai_skills')
    await pool.query(
      'INSERT INTO ai_skills (slug, label, hint, prompt, intent, is_active, sort_order) VALUES (?,?,?,?,?,?,?)',
      [...fields, Number(sort[0].sort) + 1],
    )
  }
  await refreshCatalog()
}

export async function deleteSkill(id) {
  await pool.query('DELETE FROM ai_skills WHERE id = ?', [id])
  await refreshCatalog()
}

export async function saveTeammate(body, id) {
  const name = String(body.name || '').trim()
  if (!name) throw new Error('name is required')
  const slug = slugify(body.slug || name) || `mate-${Date.now()}`
  const fields = [slug, name, body.role || '', body.isActive === false ? 0 : 1]
  if (id) {
    await pool.query('UPDATE ai_teammates SET slug=?, name=?, role=?, is_active=? WHERE id=?', [...fields, id])
  } else {
    const [sort] = await pool.query('SELECT COALESCE(MAX(sort_order), 0) AS sort FROM ai_teammates')
    await pool.query('INSERT INTO ai_teammates (slug, name, role, is_active, sort_order) VALUES (?,?,?,?,?)', [
      ...fields,
      Number(sort[0].sort) + 1,
    ])
  }
  await refreshCatalog()
}

export async function deleteTeammate(id) {
  await pool.query('DELETE FROM ai_teammates WHERE id = ?', [id])
  await refreshCatalog()
}

async function upsertRuntime(key, value) {
  await pool.query(
    `INSERT INTO ai_runtime_config (setting_key, setting_value) VALUES (?,?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [key, value],
  )
}

export async function saveRuntime(body) {
  if (body.base != null) await upsertRuntime('AI_BASE_URL', String(body.base || '').trim())
  if (body.model != null) await upsertRuntime('AI_MODEL', String(body.model || '').trim())
  if (body.clearKey) await upsertRuntime('AI_API_KEY', '')
  else if (body.apiKey) await upsertRuntime('AI_API_KEY', String(body.apiKey).trim())
  await refreshCatalog()
}

export function runtimePublic() {
  const key = runtime.key || ''
  return {
    base: runtime.base || '',
    model: runtime.model || '',
    hasKey: Boolean(key),
    keyHint: key ? `${key.slice(0, 3)}…${key.slice(-4)}` : '',
  }
}
