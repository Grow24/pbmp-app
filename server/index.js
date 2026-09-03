import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { pool, waitForDb, ensureSchema, dbConfig } from './db.js'
import { seedIfEmpty, seedFiltersIfEmpty, seedAgentBotMenu, syncDefaultMenu } from './seed.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true, db: true })
  } catch {
    res.status(503).json({ ok: false, db: false })
  }
})

function parseJson(value, fallback) {
  if (value == null || value === '') return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function parseExtra(value) {
  return parseJson(value, {})
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

function mapFilter(row) {
  const conditions = parseJson(row.conditions_json, []).map((item, index) => ({
    id: item.id || `c${row.id}-${index}`,
    field: item.field || '',
    operator: item.operator || 'contains',
    value: item.value || '',
  }))
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || '',
    scope: row.scope,
    groupKey: row.group_key,
    pageKeys: parseJson(row.page_keys, []),
    query: {
      combinator: row.combinator || 'and',
      conditions,
    },
    isActive: Boolean(row.is_active),
    sortOrder: row.sort_order,
  }
}

async function loadFilters() {
  const [rows] = await pool.query('SELECT * FROM saved_filters ORDER BY sort_order, id')
  return rows.map(mapFilter)
}

async function loadBootstrap() {
  const [settingRows] = await pool.query('SELECT * FROM settings ORDER BY sort_order, setting_key')
  const settings = Object.fromEntries(settingRows.map((row) => [row.setting_key, row.setting_value]))

  const [sections] = await pool.query('SELECT * FROM menu_sections ORDER BY sort_order, id')
  const [items] = await pool.query('SELECT * FROM menu_items ORDER BY sort_order, id')
  const [tabs] = await pool.query('SELECT * FROM canvas_tabs ORDER BY sort_order, id')
  const [subtabs] = await pool.query('SELECT * FROM canvas_subtabs ORDER BY sort_order, id')
  const [contents] = await pool.query('SELECT * FROM content_items ORDER BY sort_order, id')

  const tabsByItem = new Map()
  for (const tab of tabs) {
    const list = tabsByItem.get(tab.menu_item_id) || []
    list.push({
      id: tab.slug,
      dbId: tab.id,
      label: tab.label,
      kind: tab.view_kind,
      subtabs: subtabs
        .filter((sub) => sub.tab_id === tab.id)
        .map((sub) => ({ id: sub.slug, dbId: sub.id, label: sub.label, kind: sub.view_kind })),
    })
    tabsByItem.set(tab.menu_item_id, list)
  }

  function toMenu(item) {
    const childItems = items.filter((child) => child.parent_id === item.id)
    const tabList = tabsByItem.get(item.id) || []
    return {
      id: item.slug,
      dbId: item.id,
      label: item.label,
      icon: item.icon,
      externalUrl: item.external_url || undefined,
      children: childItems.length ? childItems.map(toMenu) : undefined,
      canvas: item.canvas_title
        ? {
            title: item.canvas_title,
            eyebrow: item.canvas_eyebrow || '',
            description: item.canvas_description || '',
            tabs: tabList,
          }
        : undefined,
    }
  }

  const tree = sections.map((section) => ({
    id: section.slug,
    dbId: section.id,
    label: section.label,
    items: items.filter((item) => item.section_id === section.id && !item.parent_id).map(toMenu),
  }))

  const slugById = Object.fromEntries(items.map((item) => [item.id, item.slug]))
  const content = {}
  for (const row of contents) {
    const key = row.menu_item_id ? slugById[row.menu_item_id] : '_global'
    if (!content[key]) content[key] = {}
    if (!content[key][row.view_kind]) content[key][row.view_kind] = []
    content[key][row.view_kind].push({
      id: row.id,
      menuItemId: row.menu_item_id,
      viewKind: row.view_kind,
      blockType: row.block_type,
      title: row.title,
      subtitle: row.subtitle,
      body: row.body,
      value: row.value_text,
      extra: parseExtra(row.extra_json),
      sortOrder: row.sort_order,
    })
  }

  return { settings, settingRows, sections: tree, content, filters: await loadFilters() }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/bootstrap', async (_req, res) => {
  res.json(await loadBootstrap())
})

app.get('/api/settings', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM settings ORDER BY sort_order, setting_key')
  res.json(rows)
})

app.put('/api/settings', async (req, res) => {
  const entries = req.body || {}
  for (const [key, value] of Object.entries(entries)) {
    await pool.query('UPDATE settings SET setting_value = ? WHERE setting_key = ?', [String(value ?? ''), key])
  }
  const [rows] = await pool.query('SELECT * FROM settings ORDER BY sort_order, setting_key')
  res.json(rows)
})

app.get('/api/sections', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM menu_sections ORDER BY sort_order, id')
  res.json(rows)
})

app.post('/api/sections', async (req, res) => {
  const { slug, label, sort_order = 0 } = req.body
  const [result] = await pool.query(
    'INSERT INTO menu_sections (slug, label, sort_order) VALUES (?,?,?)',
    [slug, label, sort_order],
  )
  const [rows] = await pool.query('SELECT * FROM menu_sections WHERE id = ?', [result.insertId])
  res.status(201).json(rows[0])
})

app.put('/api/sections/:id', async (req, res) => {
  const { slug, label, sort_order } = req.body
  await pool.query('UPDATE menu_sections SET slug=?, label=?, sort_order=? WHERE id=?', [
    slug,
    label,
    sort_order,
    req.params.id,
  ])
  const [rows] = await pool.query('SELECT * FROM menu_sections WHERE id = ?', [req.params.id])
  res.json(rows[0])
})

app.delete('/api/sections/:id', async (req, res) => {
  await pool.query('DELETE FROM menu_sections WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

app.get('/api/items', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM menu_items ORDER BY sort_order, id')
  res.json(rows)
})

app.post('/api/items', async (req, res) => {
  const b = req.body
  const [result] = await pool.query(
    `INSERT INTO menu_items
      (slug, section_id, parent_id, label, icon, sort_order, canvas_title, canvas_eyebrow, canvas_description, external_url)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      b.slug,
      b.section_id,
      b.parent_id || null,
      b.label,
      b.icon || 'dashboard',
      b.sort_order || 0,
      b.canvas_title || null,
      b.canvas_eyebrow || null,
      b.canvas_description || null,
      b.external_url || null,
    ],
  )
  const [rows] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [result.insertId])
  res.status(201).json(rows[0])
})

app.put('/api/items/:id', async (req, res) => {
  const b = req.body
  await pool.query(
    `UPDATE menu_items SET
      slug=?, section_id=?, parent_id=?, label=?, icon=?, sort_order=?,
      canvas_title=?, canvas_eyebrow=?, canvas_description=?, external_url=?
     WHERE id=?`,
    [
      b.slug,
      b.section_id,
      b.parent_id || null,
      b.label,
      b.icon || 'dashboard',
      b.sort_order || 0,
      b.canvas_title || null,
      b.canvas_eyebrow || null,
      b.canvas_description || null,
      b.external_url || null,
      req.params.id,
    ],
  )
  const [rows] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id])
  res.json(rows[0])
})

app.delete('/api/items/:id', async (req, res) => {
  await pool.query('DELETE FROM menu_items WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

app.get('/api/tabs', async (req, res) => {
  const itemId = req.query.itemId
  const [rows] = itemId
    ? await pool.query('SELECT * FROM canvas_tabs WHERE menu_item_id = ? ORDER BY sort_order, id', [itemId])
    : await pool.query('SELECT * FROM canvas_tabs ORDER BY sort_order, id')
  res.json(rows)
})

app.post('/api/tabs', async (req, res) => {
  const b = req.body
  const [result] = await pool.query(
    'INSERT INTO canvas_tabs (slug, menu_item_id, label, view_kind, sort_order) VALUES (?,?,?,?,?)',
    [b.slug, b.menu_item_id, b.label, b.view_kind, b.sort_order || 0],
  )
  const [rows] = await pool.query('SELECT * FROM canvas_tabs WHERE id = ?', [result.insertId])
  res.status(201).json(rows[0])
})

app.put('/api/tabs/:id', async (req, res) => {
  const b = req.body
  await pool.query(
    'UPDATE canvas_tabs SET slug=?, menu_item_id=?, label=?, view_kind=?, sort_order=? WHERE id=?',
    [b.slug, b.menu_item_id, b.label, b.view_kind, b.sort_order || 0, req.params.id],
  )
  const [rows] = await pool.query('SELECT * FROM canvas_tabs WHERE id = ?', [req.params.id])
  res.json(rows[0])
})

app.delete('/api/tabs/:id', async (req, res) => {
  await pool.query('DELETE FROM canvas_tabs WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

app.get('/api/subtabs', async (req, res) => {
  const tabId = req.query.tabId
  const [rows] = tabId
    ? await pool.query('SELECT * FROM canvas_subtabs WHERE tab_id = ? ORDER BY sort_order, id', [tabId])
    : await pool.query('SELECT * FROM canvas_subtabs ORDER BY sort_order, id')
  res.json(rows)
})

app.post('/api/subtabs', async (req, res) => {
  const b = req.body
  const [result] = await pool.query(
    'INSERT INTO canvas_subtabs (slug, tab_id, label, view_kind, sort_order) VALUES (?,?,?,?,?)',
    [b.slug, b.tab_id, b.label, b.view_kind, b.sort_order || 0],
  )
  const [rows] = await pool.query('SELECT * FROM canvas_subtabs WHERE id = ?', [result.insertId])
  res.status(201).json(rows[0])
})

app.put('/api/subtabs/:id', async (req, res) => {
  const b = req.body
  await pool.query(
    'UPDATE canvas_subtabs SET slug=?, tab_id=?, label=?, view_kind=?, sort_order=? WHERE id=?',
    [b.slug, b.tab_id, b.label, b.view_kind, b.sort_order || 0, req.params.id],
  )
  const [rows] = await pool.query('SELECT * FROM canvas_subtabs WHERE id = ?', [req.params.id])
  res.json(rows[0])
})

app.delete('/api/subtabs/:id', async (req, res) => {
  await pool.query('DELETE FROM canvas_subtabs WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

app.get('/api/content', async (req, res) => {
  const { itemId, viewKind } = req.query
  let sql = 'SELECT * FROM content_items WHERE 1=1'
  const params = []
  if (itemId === 'null') {
    sql += ' AND menu_item_id IS NULL'
  } else if (itemId) {
    sql += ' AND menu_item_id = ?'
    params.push(itemId)
  }
  if (viewKind) {
    sql += ' AND view_kind = ?'
    params.push(viewKind)
  }
  sql += ' ORDER BY sort_order, id'
  const [rows] = await pool.query(sql, params)
  res.json(
    rows.map((row) => ({
      ...row,
      extra_json: parseExtra(row.extra_json),
    })),
  )
})

app.post('/api/content', async (req, res) => {
  const b = req.body
  const [result] = await pool.query(
    `INSERT INTO content_items
      (menu_item_id, view_kind, block_type, title, subtitle, body, value_text, extra_json, sort_order)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      b.menu_item_id || null,
      b.view_kind,
      b.block_type,
      b.title || null,
      b.subtitle || null,
      b.body || null,
      b.value_text || null,
      b.extra_json ? JSON.stringify(b.extra_json) : null,
      b.sort_order || 0,
    ],
  )
  const [rows] = await pool.query('SELECT * FROM content_items WHERE id = ?', [result.insertId])
  res.status(201).json({ ...rows[0], extra_json: parseExtra(rows[0].extra_json) })
})

app.put('/api/content/:id', async (req, res) => {
  const b = req.body
  await pool.query(
    `UPDATE content_items SET
      menu_item_id=?, view_kind=?, block_type=?, title=?, subtitle=?, body=?, value_text=?, extra_json=?, sort_order=?
     WHERE id=?`,
    [
      b.menu_item_id || null,
      b.view_kind,
      b.block_type,
      b.title || null,
      b.subtitle || null,
      b.body || null,
      b.value_text || null,
      b.extra_json ? JSON.stringify(b.extra_json) : null,
      b.sort_order || 0,
      req.params.id,
    ],
  )
  const [rows] = await pool.query('SELECT * FROM content_items WHERE id = ?', [req.params.id])
  res.json({ ...rows[0], extra_json: parseExtra(rows[0].extra_json) })
})

app.delete('/api/content/:id', async (req, res) => {
  await pool.query('DELETE FROM content_items WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

app.get('/api/filters', async (_req, res) => {
  res.json(await loadFilters())
})

app.post('/api/filters', async (req, res) => {
  const b = req.body || {}
  const slug = slugify(b.slug || b.name) || `filter-${Date.now()}`
  const [result] = await pool.query(
    `INSERT INTO saved_filters
      (slug, name, description, scope, group_key, page_keys, combinator, conditions_json, is_active, sort_order)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      slug,
      b.name,
      b.description || '',
      b.scope || 'global',
      b.groupKey || b.group_key || null,
      JSON.stringify(b.pageKeys || b.page_keys || []),
      b.combinator || 'and',
      JSON.stringify(b.conditions || []),
      b.isActive === false ? 0 : 1,
      b.sort_order || 0,
    ],
  )
  const [rows] = await pool.query('SELECT * FROM saved_filters WHERE id = ?', [result.insertId])
  res.status(201).json(mapFilter(rows[0]))
})

app.put('/api/filters/:id', async (req, res) => {
  const b = req.body || {}
  const slug = slugify(b.slug || b.name)
  await pool.query(
    `UPDATE saved_filters SET
      slug=?, name=?, description=?, scope=?, group_key=?, page_keys=?, combinator=?, conditions_json=?, is_active=?
     WHERE id=?`,
    [
      slug,
      b.name,
      b.description || '',
      b.scope || 'global',
      b.groupKey || b.group_key || null,
      JSON.stringify(b.pageKeys || b.page_keys || []),
      b.combinator || 'and',
      JSON.stringify(b.conditions || []),
      b.isActive === false ? 0 : 1,
      req.params.id,
    ],
  )
  const [rows] = await pool.query('SELECT * FROM saved_filters WHERE id = ?', [req.params.id])
  res.json(mapFilter(rows[0]))
})

app.delete('/api/filters/:id', async (req, res) => {
  await pool.query('DELETE FROM saved_filters WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir))
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: error.message || 'Server error' })
})

const port = Number(process.env.PORT || 5174)

async function start() {
  console.log(`MySQL ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`)
  await waitForDb()
  await ensureSchema()
  const seeded = await seedIfEmpty()
  await seedFiltersIfEmpty()
  await seedAgentBotMenu()
  await syncDefaultMenu()
  app.listen(port, '0.0.0.0', () => {
    console.log(`PBMP API on http://0.0.0.0:${port}${seeded ? ' (seeded)' : ''}`)
  })
}

start().catch((error) => {
  console.error('Failed to start API', error)
  process.exit(1)
})
