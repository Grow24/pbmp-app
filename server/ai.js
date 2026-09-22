import { randomUUID } from 'node:crypto'
import { pool } from './db.js'

const PBMP_AGENTS = [
  { slug: 'general', name: 'General assistant', role: 'Default copilot for the open canvas' },
  { slug: 'executive-analyst', name: 'Executive Analyst', role: 'Board summaries, KPIs, and decisions' },
  { slug: 'business-analyst', name: 'Business Analyst', role: 'AS-IS, process, and requirements' },
  { slug: 'finance-analyst', name: 'Finance Analyst', role: 'Pricing, cost, and cycle time' },
  { slug: 'project-manager', name: 'Project Manager', role: 'Owners, risks, and next steps' },
]

const PBMP_TEAM = [
  { id: 'priya', name: 'Priya Shah', role: 'Strategy lead' },
  { id: 'arjun', name: 'Arjun Mehta', role: 'Growth' },
  { id: 'nisha', name: 'Nisha Rao', role: 'Studio' },
]

function agentBySlug(slug) {
  return PBMP_AGENTS.find((item) => item.slug === slug) || PBMP_AGENTS[0]
}

function envFirst(...keys) {
  for (const key of keys) {
    const value = process.env[key]
    if (value == null) continue
    const trimmed = String(value).trim()
    if (!trimmed || trimmed.includes('${')) continue
    return trimmed
  }
  return ''
}

function aiConfig() {
  const base = envFirst('AI_BASE_URL', 'OPENAI_BASE_URL', 'LIBRECHAT_BASE_URL').replace(/\/$/, '')
  const key = envFirst('AI_API_KEY', 'OPENAI_API_KEY', 'LIBRECHAT_API_KEY')
  const model = envFirst('AI_MODEL', 'OPENAI_MODEL') || 'gpt-4o-mini'
  return {
    base: base || 'https://api.openai.com/v1',
    key,
    model,
    configured: Boolean(key),
  }
}

function mapProject(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    kind: row.kind,
    menuItemId: row.menu_item_id,
    description: row.description || '',
  }
}

function mapConversation(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    canvasSlug: row.canvas_slug,
    tabSlug: row.tab_slug || '',
    subtabSlug: row.subtab_slug || '',
    agentSlug: row.agent_slug || 'general',
    title: row.title,
    archived: Boolean(row.archived),
    pinned: Boolean(row.pinned),
    temporary: Boolean(row.temporary),
    updatedAt: row.updated_at,
  }
}

function mapMessage(row) {
  return {
    id: row.id,
    role: row.role,
    text: row.text,
    imageName: row.image_name,
    imageData: row.image_data,
    createdAt: row.created_at,
  }
}

function mapArtifact(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    messageId: row.message_id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    savedContentId: row.saved_content_id,
  }
}

function parseArtifacts(text) {
  const artifacts = []
  const fences = [
    { kind: 'mermaid', re: /```mermaid\s*\n([\s\S]*?)```/gi, title: 'Process diagram' },
    { kind: 'html', re: /```html\s*\n([\s\S]*?)```/gi, title: 'Generated page' },
    { kind: 'svg', re: /```svg\s*\n([\s\S]*?)```/gi, title: 'SVG graphic' },
  ]
  for (const fence of fences) {
    let match
    const re = new RegExp(fence.re.source, fence.re.flags)
    while ((match = re.exec(text))) {
      artifacts.push({
        kind: fence.kind,
        title: fence.title,
        body: match[1].trim(),
      })
    }
  }
  if (/^#{1,3} /m.test(text) && text.length > 240) {
    artifacts.unshift({
      kind: 'markdown',
      title: (text.match(/^#{1,3} +(.+)$/m) || ['', 'Report'])[1].slice(0, 80),
      body: text,
    })
  }
  return artifacts
}

async function insertArtifacts(conversationId, messageId, text) {
  const parsed = parseArtifacts(text)
  const saved = []
  for (const item of parsed) {
    const id = randomUUID()
    await pool.query(
      `INSERT INTO ai_artifacts (id, conversation_id, message_id, kind, title, body)
       VALUES (?,?,?,?,?,?)`,
      [id, conversationId, messageId, item.kind, item.title, item.body],
    )
    saved.push({ id, conversationId, messageId, ...item, savedContentId: null })
  }
  return saved
}

async function syncProjectsFromMenu() {
  const [items] = await pool.query('SELECT * FROM menu_items ORDER BY sort_order, id')
  const childIds = new Set(items.filter((item) => item.parent_id).map((item) => item.parent_id))
  for (const item of items) {
    const hasChildren = childIds.has(item.id)
    const isRoot = !item.parent_id
    if (!isRoot && !hasChildren && !item.canvas_title) continue
    const kind = isRoot && hasChildren ? 'programme' : isRoot ? 'client' : hasChildren ? 'workstream' : 'canvas'
    await pool.query(
      `INSERT INTO ai_projects (slug, name, kind, menu_item_id, description)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), kind=VALUES(kind), menu_item_id=VALUES(menu_item_id), description=VALUES(description)`,
      [item.slug, item.label, kind, item.id, item.canvas_description || ''],
    )
  }
}

async function listProjects() {
  await syncProjectsFromMenu()
  const [rows] = await pool.query('SELECT * FROM ai_projects ORDER BY name')
  return rows.map(mapProject)
}

async function resolveProject(canvasSlug) {
  const projects = await listProjects()
  if (!canvasSlug) return { project: projects[0] || null, projects, trail: [] }

  const [items] = await pool.query('SELECT * FROM menu_items')
  const byId = Object.fromEntries(items.map((item) => [item.id, item]))
  const current = items.find((item) => item.slug === canvasSlug)
  const trail = []
  let walk = current
  while (walk) {
    trail.unshift(walk)
    walk = walk.parent_id ? byId[walk.parent_id] : null
  }

  for (const item of [...trail].reverse()) {
    const match = projects.find((project) => project.menuItemId === item.id)
    if (match) return { project: match, projects, trail: trail.map((row) => row.label) }
  }

  if (current) {
    await pool.query(
      `INSERT INTO ai_projects (slug, name, kind, menu_item_id, description)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE name=VALUES(name)`,
      [current.slug, current.label, 'canvas', current.id, current.canvas_description || ''],
    )
    const next = await listProjects()
    return {
      project: next.find((project) => project.slug === current.slug) || next[0] || null,
      projects: next,
      trail: trail.map((row) => row.label),
    }
  }

  return { project: projects[0] || null, projects, trail: [] }
}

async function listConversations(projectId, includeArchived = false) {
  const sql = includeArchived
    ? 'SELECT * FROM ai_conversations WHERE project_id = ? AND temporary = 0 ORDER BY pinned DESC, updated_at DESC'
    : 'SELECT * FROM ai_conversations WHERE project_id = ? AND archived = 0 AND temporary = 0 ORDER BY pinned DESC, updated_at DESC'
  const [rows] = await pool.query(sql, [projectId])
  return rows.map(mapConversation)
}

async function listMessages(conversationId) {
  const [rows] = await pool.query('SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at, id', [
    conversationId,
  ])
  return rows.map(mapMessage)
}

async function listArtifacts(conversationId) {
  const [rows] = await pool.query('SELECT * FROM ai_artifacts WHERE conversation_id = ? ORDER BY created_at', [
    conversationId,
  ])
  return rows.map(mapArtifact)
}

async function createConversation({
  projectId,
  canvasSlug,
  tabSlug = '',
  subtabSlug = '',
  agentSlug = 'general',
  title,
  temporary = false,
}) {
  const id = randomUUID()
  await pool.query(
    `INSERT INTO ai_conversations (id, project_id, canvas_slug, tab_slug, subtab_slug, agent_slug, title, temporary)
     VALUES (?,?,?,?,?,?,?,?)`,
    [id, projectId, canvasSlug || '', tabSlug || '', subtabSlug || '', agentSlug || 'general', title || 'New conversation', temporary ? 1 : 0],
  )
  const [rows] = await pool.query('SELECT * FROM ai_conversations WHERE id = ?', [id])
  return mapConversation(rows[0])
}

function summarizeContext(context = {}) {
  const blocks = Array.isArray(context.blocks) ? context.blocks : []
  const facts = blocks
    .slice(0, 24)
    .map((block) => {
      const bits = [block.type, block.title, block.subtitle, block.value, block.body]
        .filter(Boolean)
        .map((value) => String(value).slice(0, 220))
      return `- ${bits.join(' — ')}`
    })
    .join('\n')
  return [
    `Workspace: ${context.title || 'PBMP canvas'}`,
    context.trail?.length ? `Trail: ${context.trail.join(' > ')}` : '',
    context.tab ? `Tab: ${context.tab}${context.subtab ? ` / ${context.subtab}` : ''}` : '',
    context.viewKind ? `View: ${context.viewKind}` : '',
    context.description ? `Description: ${context.description}` : '',
    facts ? `Current canvas facts:\n${facts}` : 'No structured canvas facts were provided.',
  ]
    .filter(Boolean)
    .join('\n')
}

function wantsDiagram(text) {
  return /diagram|flowchart|mermaid|process map|architecture|bpmn/i.test(text)
}

function wantsReport(text) {
  return /report|board summary|executive|write up|write-up|document|markdown/i.test(text)
}

function localAssistantReply({ message, context, imageName }) {
  const title = context.title || 'this canvas'
  const view = context.tab || context.viewKind || 'current view'
  const blocks = Array.isArray(context.blocks) ? context.blocks : []
  const nodes = blocks.filter((block) => block.type === 'map_node')
  const alerts = blocks.filter((block) => /alert|risk|inquiry/i.test(String(block.type || '')))
  const capabilities = blocks.filter((block) => block.type === 'capability')
  const imageLine = imageName
    ? `I received the image **${imageName}**. ${aiConfig().configured ? '' : 'A vision-capable model is not configured, so I am reading the filename plus the open canvas rather than pixels. '}`
    : ''

  const steps = nodes.length
    ? nodes.map((node) => node.subtitle || node.title)
    : ['Intake', 'Qualify', 'Decide', 'Deliver', 'Measure']
  const mermaid = ['flowchart LR', ...steps.map((step, index) => `  S${index}["${step}"]`)].join('\n')
  const links = steps.slice(1).map((_, index) => `  S${index} --> S${index + 1}`).join('\n')
  const diagram = `${imageLine}Here is a process view grounded in **${title}** (${view}).\n\n\`\`\`mermaid\n${mermaid}\n${links}\n\`\`\`\n\nUse **Save to canvas** in Artifacts to keep this diagram with the PBMP workspace.`

  const bullets = blocks
    .filter((block) => block.title || block.body)
    .slice(0, 8)
    .map((block) => `- **${block.title || block.type}:** ${String(block.body || block.value || block.subtitle || '').slice(0, 180)}`)
  const report = [
    `# Board summary — ${title}`,
    '',
    imageLine || `Prepared from the open **${view}** canvas.`,
    '',
    '## Situation',
    context.description || `The team is working ${title} in PBMP.`,
    '',
    '## Evidence from the canvas',
    bullets.join('\n') || '- No extra blocks were attached; the conversation remains tied to this workspace.',
    '',
    '## Recommended next step',
    'Review the findings on this canvas, then save this artifact into the Strategy Doc / current view so the team shares one source of truth.',
  ].join('\n')

  if (wantsDiagram(message) && wantsReport(message)) return `${report}\n\n---\n\n${diagram}`
  if (wantsDiagram(message)) return diagram
  if (wantsReport(message)) return report

  const highlights = [...alerts, ...capabilities, ...blocks]
    .filter((block) => block.title || block.body || block.value)
    .slice(0, 5)
    .map((block) => `- ${block.title || block.type}: ${String(block.body || block.value || block.subtitle || '').slice(0, 160)}`)

  return [
    imageLine,
    `Looking at **${title}** · ${view}.`,
    '',
    highlights.length ? `What the open canvas already shows:\n${highlights.join('\n')}` : 'I have the workspace context and can draft a report, diagram, or walk the current facts.',
    '',
    `You asked: “${message.slice(0, 280)}”`,
    '',
    'I can turn this into a board summary or a Mermaid process map — ask for either, then save the artifact back into PBMP.',
  ]
    .filter(Boolean)
    .join('\n')
}

function writeEvent(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`)
}

async function streamText(res, text) {
  const chunks = text.split(/(\s+)/).filter((part) => part !== '')
  for (const chunk of chunks) {
    writeEvent(res, { type: 'delta', text: chunk })
    await new Promise((resolve) => setTimeout(resolve, 8))
  }
}

async function streamOpenAi({ messages, signal }) {
  const config = aiConfig()
  const response = await fetch(`${config.base}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      stream: true,
      messages,
    }),
    signal: signal || AbortSignal.timeout(120000),
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Model request failed (${response.status})`)
  }
  return response.body
}

function buildModelMessages({ history, context, message, imageData }) {
  const system = [
    'You are the PBMP workbench assistant. You sit beside the user\'s current canvas.',
    agentBySlug(context.agentSlug).name !== 'General assistant'
      ? `You are acting as ${agentBySlug(context.agentSlug).name}: ${agentBySlug(context.agentSlug).role}.`
      : '',
    'Ground every answer in the provided canvas context. Do not invent clients or KPIs that are not in context.',
    'When asked for a report, reply in Markdown with headings.',
    'When asked for a process map, flowchart or architecture diagram, include a mermaid fenced block.',
    'Keep everyday answers concise unless the user asks for a full write-up.',
    '',
    summarizeContext(context),
  ].join('\n')

  const prior = history
    .filter((item) => item.role === 'user' || item.role === 'assistant')
    .slice(-16)
    .map((item) => ({ role: item.role, content: item.text }))

  const userContent = imageData
    ? [
        { type: 'text', text: message },
        { type: 'image_url', image_url: { url: imageData } },
      ]
    : message

  return [{ role: 'system', content: system }, ...prior, { role: 'user', content: userContent }]
}

async function readOpenAiStream(body, onDelta) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const frames = buffer.split('\n')
    buffer = frames.pop() || ''
    for (const frame of frames) {
      const line = frame.trim()
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (!data || data === '[DONE]') continue
      try {
        const json = JSON.parse(data)
        const piece = json.choices?.[0]?.delta?.content || ''
        if (piece) {
          full += piece
          onDelta(piece)
        }
      } catch {
        // ignore keep-alives
      }
    }
  }
  return full
}

export function registerAiRoutes(app) {
  app.get('/api/ai/status', (_req, res) => {
    const config = aiConfig()
    res.json({
      configured: config.configured,
      model: config.model,
      provider: config.configured ? config.base : 'local-canvas',
    })
  })

  app.get('/api/ai/workspace', async (req, res) => {
    const canvasSlug = String(req.query.canvasSlug || '')
    const tabSlug = String(req.query.tabSlug || '')
    const subtabSlug = String(req.query.subtabSlug || '')
    const includeArchived = req.query.archived === '1'
    const resolved = await resolveProject(canvasSlug)
    const conversations = resolved.project
      ? await listConversations(resolved.project.id, includeArchived)
      : []
    const bound = conversations.find(
      (item) => item.canvasSlug === canvasSlug && item.tabSlug === tabSlug && item.subtabSlug === subtabSlug,
    )
    res.json({
      status: {
        configured: aiConfig().configured,
        model: aiConfig().model,
        provider: aiConfig().configured ? aiConfig().base : 'local-canvas',
      },
      project: resolved.project,
      projects: resolved.projects,
      trail: resolved.trail,
      conversations,
      boundConversationId: bound?.id || null,
      agents: PBMP_AGENTS,
      team: PBMP_TEAM,
    })
  })

  app.get('/api/ai/agents', (_req, res) => {
    res.json(PBMP_AGENTS)
  })

  app.get('/api/ai/team', (_req, res) => {
    res.json(PBMP_TEAM)
  })

  app.get('/api/ai/projects', async (_req, res) => {
    res.json(await listProjects())
  })

  app.post('/api/ai/projects', async (req, res) => {
    const { name, kind = 'programme', description = '', menuItemId = null } = req.body || {}
    if (!name) return res.status(400).json({ error: 'name is required' })
    const slug = String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || `project-${Date.now()}`
    const [result] = await pool.query(
      'INSERT INTO ai_projects (slug, name, kind, menu_item_id, description) VALUES (?,?,?,?,?)',
      [slug, name, kind, menuItemId, description],
    )
    const [rows] = await pool.query('SELECT * FROM ai_projects WHERE id = ?', [result.insertId])
    res.status(201).json(mapProject(rows[0]))
  })

  app.get('/api/ai/conversations', async (req, res) => {
    const projectId = Number(req.query.projectId)
    if (!projectId) return res.status(400).json({ error: 'projectId is required' })
    res.json(await listConversations(projectId, req.query.archived === '1'))
  })

  app.post('/api/ai/conversations', async (req, res) => {
    const created = await createConversation(req.body || {})
    res.status(201).json(created)
  })

  app.get('/api/ai/conversations/:id', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM ai_conversations WHERE id = ?', [req.params.id])
    if (!rows[0]) return res.status(404).json({ error: 'Conversation not found' })
    res.json({
      conversation: mapConversation(rows[0]),
      messages: await listMessages(req.params.id),
      artifacts: await listArtifacts(req.params.id),
    })
  })

  app.patch('/api/ai/conversations/:id', async (req, res) => {
    const b = req.body || {}
    const [existing] = await pool.query('SELECT * FROM ai_conversations WHERE id = ?', [req.params.id])
    if (!existing[0]) return res.status(404).json({ error: 'Conversation not found' })
    await pool.query(
      `UPDATE ai_conversations
       SET project_id=?, title=?, archived=?, pinned=?, temporary=?, canvas_slug=?, tab_slug=?, subtab_slug=?, agent_slug=?
       WHERE id=?`,
      [
        b.projectId ?? existing[0].project_id,
        b.title ?? existing[0].title,
        b.archived == null ? existing[0].archived : b.archived ? 1 : 0,
        b.pinned == null ? existing[0].pinned : b.pinned ? 1 : 0,
        b.temporary == null ? existing[0].temporary : b.temporary ? 1 : 0,
        b.canvasSlug ?? existing[0].canvas_slug,
        b.tabSlug ?? existing[0].tab_slug,
        b.subtabSlug ?? existing[0].subtab_slug,
        b.agentSlug ?? existing[0].agent_slug,
        req.params.id,
      ],
    )
    const [rows] = await pool.query('SELECT * FROM ai_conversations WHERE id = ?', [req.params.id])
    res.json(mapConversation(rows[0]))
  })

  app.delete('/api/ai/conversations/:id', async (req, res) => {
    await pool.query('DELETE FROM ai_conversations WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  })

  app.post('/api/ai/conversations/:id/fork', async (req, res) => {
    const [existing] = await pool.query('SELECT * FROM ai_conversations WHERE id = ?', [req.params.id])
    if (!existing[0]) return res.status(404).json({ error: 'Conversation not found' })
    const upTo = req.body?.upToMessageId
    const messages = await listMessages(req.params.id)
    const cut = upTo ? messages.slice(0, messages.findIndex((item) => item.id === upTo) + 1) : messages
    const created = await createConversation({
      projectId: existing[0].project_id,
      canvasSlug: existing[0].canvas_slug,
      tabSlug: existing[0].tab_slug,
      subtabSlug: existing[0].subtab_slug,
      agentSlug: existing[0].agent_slug,
      title: `Branch · ${existing[0].title}`.slice(0, 120),
    })
    for (const message of cut) {
      await pool.query(
        `INSERT INTO ai_messages (id, conversation_id, role, text, image_name, image_data)
         VALUES (?,?,?,?,?,?)`,
        [randomUUID(), created.id, message.role, message.text, message.imageName, message.imageData],
      )
    }
    res.status(201).json(created)
  })

  app.get('/api/ai/search', async (req, res) => {
    const q = `%${String(req.query.q || '').trim()}%`
    if (q === '%%') return res.json([])
    const [rows] = await pool.query(
      `SELECT DISTINCT c.*
       FROM ai_conversations c
       LEFT JOIN ai_messages m ON m.conversation_id = c.id
       WHERE c.temporary = 0 AND (c.title LIKE ? OR m.text LIKE ?)
       ORDER BY c.updated_at DESC
       LIMIT 30`,
      [q, q],
    )
    res.json(rows.map(mapConversation))
  })

  app.post('/api/ai/chat', async (req, res) => {
    const {
      conversationId,
      projectId,
      canvasSlug = '',
      tabSlug = '',
      subtabSlug = '',
      agentSlug = 'general',
      title,
      message,
      image,
      temporary = false,
      context = {},
      replaceUserMessageId,
      mentions = [],
    } = req.body || {}

    const trimmed = String(message || '').trim()
    if (!trimmed && !image?.dataUrl) {
      return res.status(400).json({ error: 'message is required' })
    }

    let convoId = conversationId
    if (!convoId) {
      if (!projectId) return res.status(400).json({ error: 'projectId is required' })
      const created = await createConversation({
        projectId,
        canvasSlug,
        tabSlug,
        subtabSlug,
        agentSlug,
        title: (title || trimmed || 'New conversation').slice(0, 80),
        temporary,
      })
      convoId = created.id
    } else if (replaceUserMessageId) {
      const [all] = await pool.query(
        'SELECT id, created_at FROM ai_messages WHERE conversation_id = ? ORDER BY created_at, id',
        [convoId],
      )
      const index = all.findIndex((row) => row.id === replaceUserMessageId)
      if (index >= 0) {
        const after = all.slice(index + 1).map((row) => row.id)
        if (after.length) {
          await pool.query(`DELETE FROM ai_artifacts WHERE message_id IN (${after.map(() => '?').join(',')})`, after)
          await pool.query(`DELETE FROM ai_messages WHERE id IN (${after.map(() => '?').join(',')})`, after)
        }
        await pool.query('UPDATE ai_messages SET text=? WHERE id=?', [trimmed, replaceUserMessageId])
      }
    }

    if (!replaceUserMessageId) {
      await pool.query(
        `INSERT INTO ai_messages (id, conversation_id, role, text, image_name, image_data)
         VALUES (?,?,?,?,?,?)`,
        [randomUUID(), convoId, 'user', trimmed, image?.name || null, image?.dataUrl || null],
      )
      const [countRows] = await pool.query('SELECT COUNT(*) AS count FROM ai_messages WHERE conversation_id = ?', [convoId])
      if (Number(countRows[0].count) <= 1) {
        await pool.query('UPDATE ai_conversations SET title=? WHERE id=?', [trimmed.slice(0, 80) || 'New conversation', convoId])
      }
      const tagged = PBMP_TEAM.filter((person) =>
        mentions.includes(person.id) || trimmed.toLowerCase().includes(`@${person.name.toLowerCase()}`),
      )
      for (const person of tagged) {
        await pool.query(
          `INSERT INTO content_items
            (menu_item_id, view_kind, block_type, title, subtitle, body, value_text, extra_json, sort_order)
           VALUES (NULL,'highlight','highlight',?,?,?,?,?,0)`,
          [
            `Tagged ${person.name}`,
            person.name,
            trimmed.slice(0, 400),
            'just now',
            JSON.stringify({ tone: 'action', mention: person.id }),
          ],
        )
      }
    }

    await pool.query(
      'UPDATE ai_conversations SET updated_at = CURRENT_TIMESTAMP, canvas_slug=?, tab_slug=?, subtab_slug=?, agent_slug=? WHERE id=?',
      [canvasSlug, tabSlug, subtabSlug, agentSlug, convoId],
    )

    const history = await listMessages(convoId)
    const assistantId = randomUUID()

    req.setTimeout(120000)
    res.setTimeout(120000)
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders?.()
    writeEvent(res, { type: 'meta', conversationId: convoId, messageId: assistantId })

    let full = ''
    try {
      const config = aiConfig()
      if (config.configured) {
        const body = await streamOpenAi({
          messages: buildModelMessages({
            history: history.filter((item) => item.id !== assistantId),
            context: { ...context, agentSlug },
            message: trimmed,
            imageData: image?.dataUrl,
          }),
        })
        full = await readOpenAiStream(body, (piece) => {
          full += ''
          writeEvent(res, { type: 'delta', text: piece })
        })
      } else {
        full = localAssistantReply({
          message: trimmed,
          context: { ...context, agentSlug },
          imageName: image?.name,
        })
        await streamText(res, full)
      }
    } catch (error) {
      const fallback = localAssistantReply({ message: trimmed, context, imageName: image?.name })
      const note = `I could not reach the configured model (${error.message}). Continuing with the canvas-aware assistant.\n\n`
      full = note + fallback
      await streamText(res, full)
    }

    await pool.query(
      `INSERT INTO ai_messages (id, conversation_id, role, text) VALUES (?,?,?,?)`,
      [assistantId, convoId, 'assistant', full],
    )
    const artifacts = await insertArtifacts(convoId, assistantId, full)
    writeEvent(res, { type: 'done', conversationId: convoId, messageId: assistantId, artifacts })
    res.end()
  })

  app.post('/api/ai/artifacts/:id/save', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM ai_artifacts WHERE id = ?', [req.params.id])
    if (!rows[0]) return res.status(404).json({ error: 'Artifact not found' })
    const artifact = rows[0]
    const { menuItemId, viewKind = 'doc' } = req.body || {}
    const [sortRows] = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) AS sort FROM content_items WHERE menu_item_id <=> ? AND view_kind = ?',
      [menuItemId || null, viewKind],
    )
    const [result] = await pool.query(
      `INSERT INTO content_items
        (menu_item_id, view_kind, block_type, title, subtitle, body, value_text, extra_json, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        menuItemId || null,
        viewKind,
        'ai_artifact',
        artifact.title,
        'Saved from conversation',
        artifact.body,
        artifact.kind,
        JSON.stringify({ kind: artifact.kind, artifactId: artifact.id }),
        Number(sortRows[0].sort) + 1,
      ],
    )
    await pool.query('UPDATE ai_artifacts SET saved_content_id = ? WHERE id = ?', [result.insertId, artifact.id])
    const [saved] = await pool.query('SELECT * FROM content_items WHERE id = ?', [result.insertId])
    res.status(201).json({
      artifact: mapArtifact({ ...artifact, saved_content_id: result.insertId }),
      content: { ...saved[0] },
    })
  })
}
