import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { pool } from './db.js'

const server = new McpServer({ name: 'pbmp-canvas', version: '0.1.0' })

function text(body) {
  return { content: [{ type: 'text', text: String(body).slice(0, 8000) }] }
}

function fail(error) {
  return { isError: true, content: [{ type: 'text', text: error.message || 'Query failed' }] }
}

server.registerTool(
  'list_canvases',
  {
    description: 'List PBMP workbench canvases stored in MySQL. Use this when the user asks which pages, menus, or canvases exist.',
  },
  async () => {
    try {
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
    } catch (error) {
      return fail(error)
    }
  },
)

server.registerTool(
  'read_canvas',
  {
    description: 'Read one PBMP canvas by its menu slug, including the cards, KPIs, and notes stored on that page.',
    inputSchema: {
      slug: z.string().describe('Menu slug of the canvas, such as the value returned by list_canvases'),
    },
  },
  async ({ slug }) => {
    try {
      const [items] = await pool.query(
        'SELECT id, slug, label, canvas_title, canvas_description FROM menu_items WHERE slug = ? LIMIT 1',
        [String(slug || '').trim()],
      )
      if (!items[0]) return text(`No canvas found for slug "${slug}".`)
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
    } catch (error) {
      return fail(error)
    }
  },
)

server.registerTool(
  'list_filters',
  {
    description: 'List saved PBMP page filters. Use this when the user asks which filters exist.',
  },
  async () => {
    try {
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
    } catch (error) {
      return fail(error)
    }
  },
)

const transport = new StdioServerTransport()
await server.connect(transport)
