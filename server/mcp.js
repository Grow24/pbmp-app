import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { pool } from './db.js'

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const builtinScript = path.join(rootDir, 'server', 'mcp-pbmp.js')

function parseJson(value, fallback) {
  if (value == null || value === '') return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'mcp-server'
}

function mapServer(row) {
  const headers = parseJson(row.headers_json, {})
  const token = String(headers.Authorization || '')
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    transport: row.transport,
    command: row.command || '',
    args: parseJson(row.args_json, []),
    url: row.url || '',
    hasToken: Boolean(token),
    tokenHint: token ? token.slice(-4) : '',
    isActive: Boolean(row.is_active),
    builtin: row.slug === 'pbmp-canvas',
  }
}

export async function ensureMcpServers() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mcp_servers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(64) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      transport VARCHAR(16) NOT NULL,
      command VARCHAR(255) NULL,
      args_json TEXT NULL,
      url VARCHAR(500) NULL,
      headers_json TEXT NULL,
      is_active TINYINT NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM mcp_servers')
  if (Number(rows[0].count) > 0) return
  await pool.query(
    `INSERT INTO mcp_servers (slug, name, transport, command, args_json, url, headers_json, is_active)
     VALUES (?,?,?,?,?,?,?,1)`,
    [
      'pbmp-canvas',
      'PBMP canvas',
      'stdio',
      process.execPath,
      JSON.stringify([builtinScript]),
      null,
      '{}',
    ],
  )
}

export async function listMcpServers() {
  const [rows] = await pool.query('SELECT * FROM mcp_servers ORDER BY id')
  return rows.map(mapServer)
}

export async function activeMcpCount() {
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM mcp_servers WHERE is_active = 1')
  return Number(rows[0].count)
}

async function uniqueSlug(name) {
  const base = slugify(name)
  let slug = base
  let n = 2
  while (true) {
    const [rows] = await pool.query('SELECT id FROM mcp_servers WHERE slug = ?', [slug])
    if (!rows.length) return slug
    slug = `${base.slice(0, 58)}-${n}`
    n += 1
  }
}

export async function createMcpServer(body) {
  const name = String(body?.name || '').trim()
  const transport = body?.transport === 'http' ? 'http' : 'stdio'
  if (!name) throw new Error('Name is required')
  const command = String(body?.command || '').trim()
  const args = Array.isArray(body?.args)
    ? body.args.map((item) => String(item))
    : String(body?.argsText || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
  const url = String(body?.url || '').trim()
  if (transport === 'stdio' && !command) throw new Error('A local server needs a command')
  if (transport === 'http' && !url) throw new Error('A remote server needs a URL')
  const headers = {}
  const token = String(body?.token || '').trim()
  if (token) headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`
  const slug = await uniqueSlug(name)
  const [result] = await pool.query(
    `INSERT INTO mcp_servers (slug, name, transport, command, args_json, url, headers_json, is_active)
     VALUES (?,?,?,?,?,?,?,?)`,
    [slug, name.slice(0, 120), transport, command || null, JSON.stringify(args), url || null, JSON.stringify(headers), body?.isActive === false ? 0 : 1],
  )
  const [rows] = await pool.query('SELECT * FROM mcp_servers WHERE id = ?', [result.insertId])
  return mapServer(rows[0])
}

export async function updateMcpServer(id, body) {
  const [rows] = await pool.query('SELECT * FROM mcp_servers WHERE id = ?', [id])
  if (!rows[0]) return null
  if (typeof body?.isActive === 'boolean') {
    await pool.query('UPDATE mcp_servers SET is_active = ? WHERE id = ?', [body.isActive ? 1 : 0, id])
  }
  const [next] = await pool.query('SELECT * FROM mcp_servers WHERE id = ?', [id])
  return mapServer(next[0])
}

export async function deleteMcpServer(id) {
  await pool.query('DELETE FROM mcp_servers WHERE id = ?', [id])
}

function parametersOf(schema) {
  if (!schema || typeof schema !== 'object') return { type: 'object', properties: {} }
  return {
    type: schema.type || 'object',
    properties: schema.properties || {},
    ...(Array.isArray(schema.required) && schema.required.length ? { required: schema.required } : {}),
  }
}

function toolResultText(result) {
  const parts = Array.isArray(result?.content) ? result.content : []
  const text = parts
    .map((part) => (part?.type === 'text' ? part.text : part?.type ? `[${part.type}]` : ''))
    .filter(Boolean)
    .join('\n')
  const body = text || JSON.stringify(result ?? '')
  return String(body).slice(0, 8000)
}

async function connectRow(row) {
  const client = new Client({ name: 'pbmp-workbench', version: '0.1.0' })
  let transport
  if (row.transport === 'http') {
    const headers = parseJson(row.headers_json, {})
    transport = new StreamableHTTPClientTransport(new URL(row.url), {
      requestInit: { headers },
    })
  } else {
    transport = new StdioClientTransport({
      command: row.command,
      args: parseJson(row.args_json, []),
      cwd: rootDir,
      env: process.env,
      stderr: 'inherit',
    })
  }
  await client.connect(transport)
  return client
}

async function listedNames(client, method, key) {
  try {
    const result = await client[method]()
    return result[key] || []
  } catch {
    return []
  }
}

async function probe(row) {
  const client = await connectRow(row)
  try {
    const listed = await client.listTools()
    const resources = await listedNames(client, 'listResources', 'resources')
    const templates = await listedNames(client, 'listResourceTemplates', 'resourceTemplates')
    const prompts = await listedNames(client, 'listPrompts', 'prompts')
    return {
      tools: (listed.tools || []).map((tool) => ({
        name: tool.name,
        description: tool.description || '',
      })),
      resources: resources.map((item) => ({ name: item.name, uri: item.uri })),
      templates: templates.map((item) => ({ name: item.name, uriTemplate: item.uriTemplate })),
      prompts: prompts.map((item) => ({ name: item.name, description: item.description || '' })),
    }
  } finally {
    await client.close()
  }
}

export async function testMcpServer(id) {
  const [rows] = await pool.query('SELECT * FROM mcp_servers WHERE id = ?', [id])
  if (!rows[0]) return null
  const found = await probe(rows[0])
  return { ok: true, server: mapServer(rows[0]), ...found }
}

export async function openMcpSession() {
  const [rows] = await pool.query('SELECT * FROM mcp_servers WHERE is_active = 1 ORDER BY id')
  const clients = []
  const tools = []
  const catalog = []
  const routes = new Map()
  const failures = []

  for (const row of rows) {
    try {
      const client = await connectRow(row)
      clients.push(client)
      const listed = await client.listTools()
      const resources = await listedNames(client, 'listResources', 'resources')
      const prompts = await listedNames(client, 'listPrompts', 'prompts')
      catalog.push({
        server: row.name,
        resources: resources.map((item) => item.uri).filter(Boolean),
        prompts: prompts.map((item) => item.name).filter(Boolean),
      })
      for (const tool of listed.tools || []) {
        const exposed = `${row.slug}__${tool.name}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64)
        if (routes.has(exposed)) continue
        routes.set(exposed, { client, name: tool.name, server: row.name })
        tools.push({
          type: 'function',
          function: {
            name: exposed,
            description: `[${row.name}] ${tool.description || tool.name}`,
            parameters: parametersOf(tool.inputSchema),
          },
        })
      }
    } catch (error) {
      failures.push({ name: row.name, error: error.message || 'connect failed' })
    }
  }

  return {
    tools,
    catalog,
    failures,
    async call(exposedName, args) {
      const route = routes.get(exposedName)
      if (!route) throw new Error(`Unknown MCP tool ${exposedName}`)
      const result = await route.client.callTool({ name: route.name, arguments: args || {} })
      const text = toolResultText(result)
      if (result?.isError) throw new Error(text.slice(0, 500))
      return text
    },
    async close() {
      await Promise.all(clients.map((client) => client.close().catch(() => {})))
    },
  }
}

export function registerMcpRoutes(app) {
  app.get('/api/ai/mcp', async (_req, res) => {
    res.json({ servers: await listMcpServers() })
  })

  app.post('/api/ai/mcp', async (req, res) => {
    try {
      res.status(201).json(await createMcpServer(req.body || {}))
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  })

  app.put('/api/ai/mcp/:id', async (req, res) => {
    const server = await updateMcpServer(req.params.id, req.body || {})
    if (!server) return res.status(404).json({ error: 'MCP server not found' })
    res.json(server)
  })

  app.delete('/api/ai/mcp/:id', async (req, res) => {
    await deleteMcpServer(req.params.id)
    res.json({ ok: true })
  })

  app.post('/api/ai/mcp/:id/test', async (req, res) => {
    try {
      const result = await testMcpServer(req.params.id)
      if (!result) return res.status(404).json({ error: 'MCP server not found' })
      res.json(result)
    } catch (error) {
      res.status(502).json({ error: error.message || 'MCP connection failed' })
    }
  })
}
