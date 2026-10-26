import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { pool } from './db.js'
import {
  STATIC_RESOURCES,
  charterText,
  ensureBusinessRecords,
  getProject,
  insertRequirement,
  insertRisk,
  listBenefits,
  listProjects,
  listRisks,
  listSales,
  logTool,
  projectIds,
  projectJson,
  updateProjectStatus,
  updateRisk,
} from './mcp-records.js'

const server = new McpServer({ name: 'pbmp-canvas', version: '0.2.0' })

const READ = { readOnlyHint: true, destructiveHint: false }
const WRITE = { readOnlyHint: false, destructiveHint: false }

function text(body) {
  return { content: [{ type: 'text', text: String(body).slice(0, 8000) }] }
}

function jsonText(value) {
  return text(JSON.stringify(value, null, 2))
}

function fail(error) {
  return { isError: true, content: [{ type: 'text', text: error.message || 'Query failed' }] }
}

function missingProject(projectId) {
  return {
    isError: true,
    content: [{
      type: 'text',
      text: `No project found for id "${projectId}". Call list_projects and use an id from that list. Do not guess a similar name.`,
    }],
  }
}

function needsConfirm() {
  return text('Not saved. Ask the user to confirm this change, then call the tool again with confirmed set to true.')
}

async function run(name, args, fn) {
  try {
    const result = await fn()
    const body = result?.content?.[0]?.text || ''
    await logTool(name, args, body, Boolean(result?.isError))
    return result
  } catch (error) {
    await logTool(name, args, error.message || 'Query failed', true)
    return fail(error)
  }
}

server.registerTool(
  'list_canvases',
  {
    title: 'List canvases',
    description: 'List PBMP workbench canvases. Use when the user asks which pages, menus, or canvases exist. Do not use this for project budget or risk.',
    annotations: READ,
  },
  async () => run('list_canvases', {}, async () => {
    const [rows] = await pool.query(
      `SELECT slug, label, canvas_title, canvas_description
       FROM menu_items
       ORDER BY sort_order, id
       LIMIT 40`,
    )
    if (!rows.length) return text('No canvases are stored yet.')
    const lines = rows.map((row) => {
      const title = row.canvas_title || row.label
      const about = row.canvas_description ? ` — ${String(row.canvas_description).slice(0, 180)}` : ''
      return `${row.slug}: ${title}${about}`
    })
    return text(lines.join('\n'))
  }),
)

server.registerTool(
  'read_canvas',
  {
    title: 'Read canvas',
    description: 'Read one PBMP canvas by menu slug, including cards, KPIs, and notes. Use the slug from list_canvases. Do not use a project id here.',
    inputSchema: {
      slug: z.string().describe('Menu slug returned by list_canvases'),
    },
    annotations: READ,
  },
  async ({ slug }) => run('read_canvas', { slug }, async () => {
    const [items] = await pool.query(
      'SELECT id, slug, label, canvas_title, canvas_description FROM menu_items WHERE slug = ? LIMIT 1',
      [String(slug || '').trim()],
    )
    if (!items[0]) {
      return {
        isError: true,
        content: [{ type: 'text', text: `No canvas found for slug "${slug}". Call list_canvases. Do not guess a similar slug.` }],
      }
    }
    const item = items[0]
    const [blocks] = await pool.query(
      `SELECT view_kind, block_type, title, subtitle, body, value_text
       FROM content_items
       WHERE menu_item_id = ?
       ORDER BY sort_order, id
       LIMIT 30`,
      [item.id],
    )
    const lines = [
      `${item.slug}: ${item.canvas_title || item.label}`,
      item.canvas_description || '',
      '',
      ...blocks.map((block) => {
        const bits = [block.view_kind, block.block_type, block.title, block.subtitle, block.value_text, block.body]
          .filter(Boolean)
          .map((part) => String(part).replace(/\s+/g, ' ').slice(0, 240))
        return `- ${bits.join(' · ')}`
      }),
    ]
    return text(lines.filter((line) => line !== undefined).join('\n'))
  }),
)

server.registerTool(
  'list_filters',
  {
    title: 'List filters',
    description: 'List saved PBMP page filters. Use when the user asks which filters exist. Do not use this for project or sales numbers.',
    annotations: READ,
  },
  async () => run('list_filters', {}, async () => {
    const [rows] = await pool.query(
      `SELECT slug, name, description, scope, is_active
       FROM saved_filters
       ORDER BY sort_order, id
       LIMIT 40`,
    )
    if (!rows.length) return text('No saved filters.')
    const lines = rows.map((row) => {
      const state = row.is_active ? 'active' : 'off'
      const about = row.description ? ` — ${String(row.description).slice(0, 160)}` : ''
      return `${row.slug} (${row.scope}, ${state}): ${row.name}${about}`
    })
    return text(lines.join('\n'))
  }),
)

server.registerTool(
  'list_projects',
  {
    title: 'List projects',
    description: 'List stored PBMP projects with project_id, name, and status. Use this before guessing an id. Returns limit, offset, and total for the next page.',
    inputSchema: {
      limit: z.number().int().min(1).max(20).optional().describe('Page size. Default 5.'),
      offset: z.number().int().min(0).optional().describe('Rows to skip. Default 0.'),
    },
    annotations: READ,
  },
  async ({ limit, offset }) => run('list_projects', { limit, offset }, async () => jsonText(await listProjects(limit, offset))),
)

server.registerTool(
  'get_project',
  {
    title: 'Get project',
    description: 'Read one project by project_id, including status, owner, summary, budget, actual cost, schedule variance, and data_as_of. Use list_projects first if the id is not known. Do not invent a project when this returns not found.',
    inputSchema: {
      project_id: z.string().describe('Project id, such as alpha'),
    },
    annotations: READ,
  },
  async ({ project_id }) => run('get_project', { project_id }, async () => {
    const project = await getProject(project_id)
    if (!project) return missingProject(project_id)
    return jsonText(projectJson(project))
  }),
)

server.registerTool(
  'get_project_actuals',
  {
    title: 'Get project actuals',
    description: 'Return budget, actual_cost, budget_consumed_pct, schedule_variance_pct, currency, and data_as_of for one project. Use this for spend questions. Do not use get_sales for a project budget.',
    inputSchema: {
      project_id: z.string().describe('Project id, such as alpha'),
    },
    annotations: READ,
  },
  async ({ project_id }) => run('get_project_actuals', { project_id }, async () => {
    const project = await getProject(project_id)
    if (!project) return missingProject(project_id)
    const view = projectJson(project)
    return jsonText({
      project_id: view.project_id,
      budget: view.budget,
      actual_cost: view.actual_cost,
      budget_consumed_pct: view.budget_consumed_pct,
      schedule_variance_pct: view.schedule_variance_pct,
      currency: view.currency,
      data_as_of: view.data_as_of,
    })
  }),
)

server.registerTool(
  'get_project_risks',
  {
    title: 'Get project risks',
    description: 'Return stored risks for one project, highest severity first. Use this when the user asks for risks. Do not invent a risk that is not in the result.',
    inputSchema: {
      project_id: z.string().describe('Project id, such as alpha'),
      limit: z.number().int().min(1).max(20).optional().describe('Maximum risks to return. Default 5.'),
    },
    annotations: READ,
  },
  async ({ project_id, limit }) => run('get_project_risks', { project_id, limit }, async () => {
    const project = await getProject(project_id)
    if (!project) return missingProject(project_id)
    const risks = await listRisks(project.slug, limit)
    return jsonText({ project_id: project.slug, risks })
  }),
)

server.registerTool(
  'get_project_benefits',
  {
    title: 'Get project benefits',
    description: 'Return stored benefits for one project. Amounts are the stored case, not a live finance feed.',
    inputSchema: {
      project_id: z.string().describe('Project id, such as alpha'),
    },
    annotations: READ,
  },
  async ({ project_id }) => run('get_project_benefits', { project_id }, async () => {
    const project = await getProject(project_id)
    if (!project) return missingProject(project_id)
    return jsonText({ project_id: project.slug, benefits: await listBenefits(project.slug) })
  }),
)

const salesInput = {
  product_id: z.string().describe('Product id, such as PBMP-CORE'),
  geography: z.string().describe('Geography code, such as IN'),
  start_date: z.string().describe('Range start, YYYY-MM-DD'),
  end_date: z.string().describe('Range end, YYYY-MM-DD'),
}

server.registerTool(
  'get_sales',
  {
    title: 'Get sales actuals',
    description: 'Return stored sales actuals for a product, geography, and date range. Use only for actuals. Do not use this for a forecast. If no row overlaps the range, say there is no stored actual.',
    inputSchema: salesInput,
    annotations: READ,
  },
  async (args) => run('get_sales', args, async () => jsonText({
    kind: 'actual',
    rows: await listSales({
      productId: args.product_id,
      geography: args.geography,
      startDate: args.start_date,
      endDate: args.end_date,
      kind: 'actual',
    }),
  })),
)

server.registerTool(
  'get_sales_forecast',
  {
    title: 'Get sales forecast',
    description: 'Return stored sales forecast rows. Use this for a forecast. Do not present these rows as actuals.',
    inputSchema: salesInput,
    annotations: READ,
  },
  async (args) => run('get_sales_forecast', args, async () => jsonText({
    kind: 'forecast',
    rows: await listSales({
      productId: args.product_id,
      geography: args.geography,
      startDate: args.start_date,
      endDate: args.end_date,
      kind: 'forecast',
    }),
  })),
)

server.registerTool(
  'evaluate_project_status',
  {
    title: 'Evaluate project status',
    description: 'Apply the PBMP status rule to numbers you already have. Red when actual_cost is above budget * 1.10 and variance_approved is false. Amber when actual_cost is above budget but not above that line, or when variance is approved. Green otherwise. Do not invent the inputs.',
    inputSchema: {
      actual_cost: z.number().describe('Actual cost from get_project_actuals'),
      budget: z.number().describe('Budget from get_project_actuals'),
      variance_approved: z.boolean().describe('True only when the user or a stored decision says the variance is approved'),
    },
    annotations: READ,
  },
  async ({ actual_cost, budget, variance_approved }) => run('evaluate_project_status', { actual_cost, budget, variance_approved }, async () => {
    let status = 'Green'
    if (actual_cost > budget * 1.1 && !variance_approved) status = 'Red'
    else if (actual_cost > budget) status = 'Amber'
    return jsonText({
      status,
      actual_cost,
      budget,
      variance_approved,
      rule: 'Red if actual_cost > budget * 1.10 and variance is not approved. Amber if actual_cost > budget. Otherwise Green.',
    })
  }),
)

server.registerTool(
  'read_resource',
  {
    title: 'Read resource',
    description: 'Read one PBMP resource by URI. Use pbmp://standards/company-policy, pbmp://standards/business-case-template, pbmp://standards/architecture, pbmp://algorithms/customer-profitability/v3, or pbmp://projects/{project_id}/charter.',
    inputSchema: {
      uri: z.string().describe('Resource URI'),
    },
    annotations: READ,
  },
  async ({ uri }) => run('read_resource', { uri }, async () => {
    const body = await resourceText(uri)
    if (body == null) {
      return {
        isError: true,
        content: [{ type: 'text', text: `No resource at ${uri}.` }],
      }
    }
    return text(body)
  }),
)

server.registerTool(
  'generate_code',
  {
    title: 'Generate code contract',
    description: 'Check a code-generation contract and return a short stub. Required: language, target, name, inputs, output, rules. Language must be typescript, python, sql, or json. This returns a stub of the rule, not a full application.',
    inputSchema: {
      language: z.enum(['typescript', 'python', 'sql', 'json']),
      target: z.enum(['backend', 'frontend', 'database', 'api', 'test']),
      name: z.string().describe('Function or module name'),
      inputs: z.array(z.string()).describe('Input names'),
      output: z.string().describe('What the function returns'),
      rules: z.array(z.string()).describe('Rules the stub must follow'),
    },
    annotations: READ,
  },
  async (args) => run('generate_code', args, async () => {
    const signature = `${args.name}(${args.inputs.join(', ')})`
    const ruleLines = args.rules.map((rule) => `  - ${rule}`).join('\n')
    const stub = args.language === 'python'
      ? `def ${args.name}(${args.inputs.join(', ')}):\n    """${args.output}"""\n    raise NotImplementedError("PBMP contract stub")\n`
      : `export function ${signature}: ${args.output} {\n  throw new Error("PBMP contract stub")\n}\n`
    return text([
      `Accepted contract for ${args.target} / ${args.language}.`,
      `Name: ${args.name}`,
      'Rules:',
      ruleLines,
      '',
      'Stub:',
      args.language === 'sql' || args.language === 'json' ? `-- ${args.output}\n-- ${args.rules.join('; ')}` : stub,
    ].join('\n'))
  }),
)

function confirmed(value) {
  return value === true
}

server.registerTool(
  'create_requirement',
  {
    title: 'Create requirement',
    description: 'Save a draft requirement on a project. This writes a row. Call it with confirmed false first, ask the user, then call again with confirmed true. Do not set confirmed true unless the user agreed.',
    inputSchema: {
      project_id: z.string(),
      title: z.string(),
      body: z.string().optional(),
      confirmed: z.boolean().describe('True only after the user agrees to save'),
    },
    annotations: WRITE,
  },
  async ({ project_id, title, body, confirmed: ok }) => run('create_requirement', { project_id, title, confirmed: ok }, async () => {
    if (!confirmed(ok)) return needsConfirm()
    const project = await getProject(project_id)
    if (!project) return missingProject(project_id)
    return jsonText({ saved: true, ...(await insertRequirement({ projectId: project.slug, title, body })) })
  }),
)

server.registerTool(
  'create_risk',
  {
    title: 'Create risk',
    description: 'Save a new open risk on a project. This writes a row. Require the user to agree, then set confirmed true.',
    inputSchema: {
      project_id: z.string(),
      title: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      confirmed: z.boolean().describe('True only after the user agrees to save'),
    },
    annotations: WRITE,
  },
  async ({ project_id, title, severity, confirmed: ok }) => run('create_risk', { project_id, title, severity, confirmed: ok }, async () => {
    if (!confirmed(ok)) return needsConfirm()
    const project = await getProject(project_id)
    if (!project) return missingProject(project_id)
    return jsonText({ saved: true, ...(await insertRisk({ projectId: project.slug, title, severity })) })
  }),
)

server.registerTool(
  'update_risk',
  {
    title: 'Update risk',
    description: 'Change the status of one stored risk. This writes a row. Require the user to agree, then set confirmed true.',
    inputSchema: {
      risk_id: z.number().int(),
      status: z.enum(['open', 'mitigating', 'closed']),
      confirmed: z.boolean().describe('True only after the user agrees to save'),
    },
    annotations: WRITE,
  },
  async ({ risk_id, status, confirmed: ok }) => run('update_risk', { risk_id, status, confirmed: ok }, async () => {
    if (!confirmed(ok)) return needsConfirm()
    const changed = await updateRisk(risk_id, status)
    if (!changed) return { isError: true, content: [{ type: 'text', text: `No risk found for id ${risk_id}.` }] }
    return jsonText({ saved: true, risk_id, status })
  }),
)

server.registerTool(
  'update_project_status',
  {
    title: 'Update project status',
    description: 'Change a project status to active, paused, or closed. This writes a row. Require the user to agree, then set confirmed true.',
    inputSchema: {
      project_id: z.string(),
      status: z.enum(['active', 'paused', 'closed']),
      confirmed: z.boolean().describe('True only after the user agrees to save'),
    },
    annotations: WRITE,
  },
  async ({ project_id, status, confirmed: ok }) => run('update_project_status', { project_id, status, confirmed: ok }, async () => {
    if (!confirmed(ok)) return needsConfirm()
    const project = await getProject(project_id)
    if (!project) return missingProject(project_id)
    await updateProjectStatus(project.slug, status)
    return jsonText({ saved: true, project_id: project.slug, status })
  }),
)

async function resourceText(uri) {
  const value = String(uri || '')
  if (STATIC_RESOURCES[value]) return STATIC_RESOURCES[value]
  const match = value.match(/^pbmp:\/\/projects\/([^/]+)\/charter$/)
  if (!match) return null
  const project = await getProject(decodeURIComponent(match[1]))
  if (!project) return null
  const risks = await listRisks(project.slug, 20)
  const benefits = await listBenefits(project.slug)
  return charterText(project, risks, benefits)
}

for (const [uri, body] of Object.entries(STATIC_RESOURCES)) {
  const name = uri.split('/').slice(-2).join('-')
  server.registerResource(
    name,
    uri,
    { description: body.split('\n')[0], mimeType: 'text/plain' },
    async (resourceUri) => ({
      contents: [{ uri: resourceUri.href, mimeType: 'text/plain', text: body }],
    }),
  )
}

server.registerResource(
  'project-charter',
  new ResourceTemplate('pbmp://projects/{project_id}/charter', {
    list: undefined,
    complete: {
      project_id: async (value) => {
        const ids = await projectIds()
        return ids.filter((id) => id.startsWith(String(value || '')))
      },
    },
  }),
  { description: 'Charter for one project, built from stored budget, risks, and benefits.', mimeType: 'text/plain' },
  async (uri, variables) => {
    const body = await resourceText(`pbmp://projects/${variables.project_id}/charter`)
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'text/plain',
        text: body || `No project found for id "${variables.project_id}".`,
      }],
    }
  },
)

function promptResult(textBody) {
  return {
    messages: [{ role: 'user', content: { type: 'text', text: textBody } }],
  }
}

server.registerPrompt(
  'project-health-review',
  {
    title: 'Project health review',
    description: 'Ask for a health review that must call get_project, get_project_actuals, get_project_risks, and get_project_benefits.',
    argsSchema: { project_id: z.string().describe('Project id, such as alpha') },
  },
  async ({ project_id }) => promptResult(
    `Review project ${project_id}. Call get_project, get_project_actuals, get_project_risks, and get_project_benefits. Cite data_as_of. Recommend continue, pause, or stop from those results only.`,
  ),
)

server.registerPrompt(
  'prepare-business-case',
  {
    title: 'Prepare business case',
    description: 'Ask for a business case that follows the stored template and live project tools.',
    argsSchema: { project_id: z.string() },
  },
  async ({ project_id }) => promptResult(
    `Prepare a business case for ${project_id}. Read pbmp://standards/business-case-template with read_resource, then fill it from get_project, get_project_actuals, get_project_risks, and get_project_benefits.`,
  ),
)

server.registerPrompt(
  'analyse-project',
  {
    title: 'Analyse project',
    description: 'Ask for an analysis of one project using stored records only.',
    argsSchema: { project_id: z.string() },
  },
  async ({ project_id }) => promptResult(
    `Analyse project ${project_id}. Use get_project and get_project_risks. If the id is missing, stop and say it was not found.`,
  ),
)

server.registerPrompt(
  'review-requirements',
  {
    title: 'Review requirements',
    description: 'Ask for a requirement review. Do not save a new requirement unless the user agrees.',
    argsSchema: { project_id: z.string() },
  },
  async ({ project_id }) => promptResult(
    `Review requirements for ${project_id}. Read the charter with read_resource at pbmp://projects/${project_id}/charter. Propose gaps. Do not call create_requirement until the user agrees.`,
  ),
)

await ensureBusinessRecords()
const transport = new StdioServerTransport()
await server.connect(transport)
