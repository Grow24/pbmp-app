import { pool } from './db.js'

const settings = [
  ['brand_name', 'PBMP', 'header', 'Brand name', 'text', 1],
  ['brand_subtitle', 'Workbench', 'header', 'Brand subtitle', 'text', 2],
  ['search_placeholder', 'Search menu', 'header', 'Search placeholder', 'text', 3],
  ['header_date', '2 Sep 2026', 'header', 'Header date', 'text', 4],
  ['user_name', 'Priya Shah', 'header', 'User name', 'text', 5],
  ['user_role', 'Strategy lead', 'header', 'User role', 'text', 6],
  ['user_initials', 'PS', 'header', 'User initials', 'text', 7],
  ['footer_org', 'Meridian Group', 'footer', 'Footer organisation', 'text', 8],
  ['footer_status', 'Draft', 'footer', 'Footer status', 'text', 9],
  ['default_menu', 'dashboard', 'general', 'Default open menu slug', 'text', 10],
  ['chat_welcome', 'I can walk the current AS-IS canvas with you — capabilities, maps, or the inquiry trail. What should we open first?', 'general', 'Chat welcome message', 'textarea', 11],
]

const strategyTabs = [
  { slug: 'assess', label: 'Assess AS IS', kind: 'assess', sort: 1, subtabs: [
    { slug: 'comprehensive', label: 'Comprehensive', kind: 'assess', sort: 1 },
    { slug: 'maps', label: 'Maps', kind: 'maps', sort: 2 },
    { slug: 'inquiry', label: 'Inquiry', kind: 'inquiry', sort: 3 },
  ]},
  { slug: 'market', label: 'Market Dynamics', kind: 'market', sort: 2 },
  { slug: 'swot', label: 'SWOT', kind: 'swot', sort: 3 },
  { slug: 'doc', label: 'Strategy Doc', kind: 'doc', sort: 4 },
]

function extra(obj) {
  return JSON.stringify(obj)
}

export async function seedIfEmpty() {
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM settings')
  if (rows[0].count > 0) return false

  for (const row of settings) {
    await pool.query(
      'INSERT INTO settings (setting_key, setting_value, group_name, label, input_type, sort_order) VALUES (?,?,?,?,?,?)',
      row,
    )
  }

  const sectionIds = {}
  for (const [slug, label, sort] of [
    ['workspace', 'Workspace', 1],
    ['studio', 'Studio', 2],
    ['account', 'Account', 3],
  ]) {
    const [result] = await pool.query(
      'INSERT INTO menu_sections (slug, label, sort_order) VALUES (?,?,?)',
      [slug, label, sort],
    )
    sectionIds[slug] = result.insertId
  }

  const itemIds = {}
  async function addItem(item) {
    const [result] = await pool.query(
      `INSERT INTO menu_items
        (slug, section_id, parent_id, label, icon, sort_order, canvas_title, canvas_eyebrow, canvas_description, external_url)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        item.slug,
        sectionIds[item.section],
        item.parent ? itemIds[item.parent] : null,
        item.label,
        item.icon,
        item.sort,
        item.title || null,
        item.eyebrow || null,
        item.description || null,
        item.url || null,
      ],
    )
    itemIds[item.slug] = result.insertId
    if (item.tabs) {
      for (const tab of item.tabs) {
        const [tabResult] = await pool.query(
          'INSERT INTO canvas_tabs (slug, menu_item_id, label, view_kind, sort_order) VALUES (?,?,?,?,?)',
          [tab.slug, result.insertId, tab.label, tab.kind, tab.sort],
        )
        for (const sub of tab.subtabs || []) {
          await pool.query(
            'INSERT INTO canvas_subtabs (slug, tab_id, label, view_kind, sort_order) VALUES (?,?,?,?,?)',
            [sub.slug, tabResult.insertId, sub.label, sub.kind, sub.sort],
          )
        }
      }
    }
  }

  const items = [
    { slug: 'dashboard', section: 'workspace', label: 'Dashboard', icon: 'dashboard', sort: 1, title: 'Executive dashboard', eyebrow: 'Meridian Group', description: 'Live operating picture across strategy, delivery, and studio work.', tabs: [{ slug: 'overview', label: 'Overview', kind: 'dashboard', sort: 1 }] },
    ...EXTERNAL_LINK_MENUS.map((item) => ({
      slug: item.slug,
      section: 'workspace',
      label: item.label,
      icon: item.icon,
      sort: item.sort,
      url: item.url,
    })),
    { slug: 'filter', section: 'workspace', label: 'Filter', icon: 'filter', sort: 12, title: 'Saved filters', eyebrow: 'Workspace', description: 'Pin views, owners, and time ranges for the workbench.', tabs: [{ slug: 'saved', label: 'Saved views', kind: 'filter', sort: 1 }] },
    { slug: 'strategy', section: 'workspace', label: 'Strategy', icon: 'strategy', sort: 13 },
    { slug: 'business', section: 'workspace', parent: 'strategy', label: 'Business', icon: 'business', sort: 1, title: 'Business strategy', eyebrow: 'Strategy · Business', description: 'Assess the current operating model, read the market, and lock the next-cycle strategy.', tabs: strategyTabs },
    { slug: 'marketing', section: 'workspace', parent: 'strategy', label: 'Marketing', icon: 'marketing', sort: 2, title: 'Marketing strategy', eyebrow: 'Strategy · Marketing', description: 'Demand, brand, and growth motions for the next planning cycle.', tabs: strategyTabs },
    { slug: 'sales', section: 'workspace', parent: 'strategy', label: 'Sales', icon: 'sales', sort: 3, title: 'Sales strategy', eyebrow: 'Strategy · Sales', description: 'Pipeline design, coverage, and revenue system diagnostics.', tabs: strategyTabs },
    ...[
      ['map-based', 'Map Based', 'map', 'Geospatial overlay for sites, routes, and coverage.'],
      ['google-sheet', 'Google Sheet', 'sheet', 'Live tabular models connected to the workbench.'],
      ['lucid', 'Lucid', 'lucid', 'Structured process and architecture diagrams.'],
      ['flip', 'Flip', 'flip', 'Scenario flips between current and target operating states.'],
      ['bpmn', 'BPMN', 'bpmn', 'Standards-based process notation for operations design.'],
      ['graph', 'Graph', 'graph', 'Relationship maps across people, systems, and outcomes.'],
      ['drag-drop', 'Drag & Drop', 'drag', 'Freeform composition board for workshops.'],
      ['gds', 'GDS', 'gds', 'Governed data sets used by strategy and studio canvases.'],
      ['drawio', 'Drawio', 'drawio', 'Technical diagrams with export-ready layouts.'],
    ].map(([slug, label, icon, description], index) => ({
      slug, section: 'studio', label, icon, sort: index + 1, title: label, eyebrow: 'Studio', description,
      tabs: [{ slug: 'workspace', label: 'Workspace', kind: 'tool', sort: 1 }],
    })),
    { slug: 'account', section: 'account', label: 'Account', icon: 'account', sort: 1, title: 'Account', eyebrow: 'Settings', description: 'Profile, workspace, and access preferences.', tabs: [{ slug: 'profile', label: 'Profile', kind: 'account', sort: 1 }] },
    { slug: 'about', section: 'account', label: 'About Us', icon: 'about', sort: 2, title: 'About PBMP', eyebrow: 'Platform', description: 'Plan, build, measure, and progress — in one workbench.', tabs: [{ slug: 'about', label: 'About', kind: 'about', sort: 1 }] },
  ]

  for (const item of items) await addItem(item)

  async function addContent(slug, viewKind, blockType, fields) {
    await pool.query(
      `INSERT INTO content_items
        (menu_item_id, view_kind, block_type, title, subtitle, body, value_text, extra_json, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        slug ? itemIds[slug] : null,
        viewKind,
        blockType,
        fields.title ?? null,
        fields.subtitle ?? null,
        fields.body ?? null,
        fields.value ?? null,
        fields.extra ? extra(fields.extra) : null,
        fields.sort ?? 0,
      ],
    )
  }

  await addContent('dashboard', 'dashboard', 'kpi', { title: 'Strategy health', value: '78', extra: { suffix: '/100', delta: '+6 pts', tone: 'good' }, sort: 1 })
  await addContent('dashboard', 'dashboard', 'kpi', { title: 'Open inquiries', value: '12', extra: { suffix: '', delta: '3 due this week', tone: 'warn' }, sort: 2 })
  await addContent('dashboard', 'dashboard', 'kpi', { title: 'Studio artifacts', value: '41', extra: { suffix: '', delta: '8 updated today', tone: 'good' }, sort: 3 })
  await addContent('dashboard', 'dashboard', 'kpi', { title: 'Cycle time', value: '11.4', extra: { suffix: 'd', delta: '−1.2 days', tone: 'good' }, sort: 4 })
  await addContent('dashboard', 'dashboard', 'work_row', { title: 'Business · Assess AS IS', subtitle: 'Priya Shah', value: 'In review', sort: 5 })
  await addContent('dashboard', 'dashboard', 'work_row', { title: 'Sales coverage map', subtitle: 'Arjun Mehta', value: 'Draft', sort: 6 })
  await addContent('dashboard', 'dashboard', 'work_row', { title: 'BPMN · Order to cash', subtitle: 'Nisha Rao', value: 'Shared', sort: 7 })
  await addContent('dashboard', 'dashboard', 'sprint', { title: 'FY27 planning sprint', body: 'Lock AS-IS findings by Friday so Market Dynamics and SWOT can feed the strategy doc.', sort: 8 })
  await addContent('dashboard', 'dashboard', 'sprint_stat', { title: 'Canvases', value: '4', sort: 9 })
  await addContent('dashboard', 'dashboard', 'sprint_stat', { title: 'Days left', value: '3', sort: 10 })
  await addContent('dashboard', 'dashboard', 'sprint_stat', { title: 'Reviews', value: '2', sort: 11 })

  await addContent('filter', 'filter', 'filter_intro', { title: 'Saved views', body: 'Apply a pin to filter canvases, owners, and review states.', sort: 1 })
  await addContent('filter', 'filter', 'filter_view', { title: 'My strategy drafts', subtitle: 'Strategy', body: 'Priya Shah', value: '6', sort: 2 })
  await addContent('filter', 'filter', 'filter_view', { title: 'Shared with steering', subtitle: 'Business', body: 'Leadership', value: '3', sort: 3 })
  await addContent('filter', 'filter', 'filter_view', { title: 'Studio · last 14 days', subtitle: 'Studio', body: 'Nisha Rao', value: '11', sort: 4 })

  for (const slug of ['business', 'marketing', 'sales']) {
    const noun = slug === 'business' ? 'Business strategy' : slug === 'marketing' ? 'Marketing strategy' : 'Sales strategy'
    await addContent(slug, 'assess', 'assess_summary', {
      title: 'Current state',
      subtitle: `${noun} is execution-led, not system-led`,
      body: 'Teams compensate with heroics. Core processes work, but ownership, data, and pricing rules are fragmented. The AS-IS picture is stable enough to plan against.',
      sort: 1,
    })
    await addContent(slug, 'assess', 'assess_metric', { title: 'Process maturity', value: '2.6 / 5', sort: 2 })
    await addContent(slug, 'assess', 'assess_metric', { title: 'Data readiness', value: 'Partial', sort: 3 })
    await addContent(slug, 'assess', 'assess_metric', { title: 'Decision rights', value: 'Unclear', sort: 4 })
    await addContent(slug, 'assess', 'assess_alert', { body: 'Pricing has no accountable owner.', extra: { tone: 'rose' }, sort: 5 })
    await addContent(slug, 'assess', 'assess_alert', { body: 'Order-to-cash still depends on email.', extra: { tone: 'amber' }, sort: 6 })
    await addContent(slug, 'assess', 'assess_alert', { body: 'Frontline NPS recovered after Q1 reset.', extra: { tone: 'emerald' }, sort: 7 })
    await addContent(slug, 'assess', 'capability', { title: 'Demand capture', body: 'Strong inbound; weak qualification.', value: '72', sort: 8 })
    await addContent(slug, 'assess', 'capability', { title: 'Fulfillment', body: 'Handoffs add 2.4 days on average.', value: '61', sort: 9 })
    await addContent(slug, 'assess', 'capability', { title: 'Pricing', body: 'No single owner or rulebook.', value: '44', sort: 10 })
    await addContent(slug, 'assess', 'capability', { title: 'Service recovery', body: 'Local excellence, no shared playbook.', value: '68', sort: 11 })

    await addContent(slug, 'maps', 'map_meta', { title: 'AS-IS operating map', subtitle: 'Click a node in a later iteration — this is the current-state spine.', value: '5 stages', sort: 1 })
    await addContent(slug, 'maps', 'map_node', { title: 'intake', subtitle: 'Intake', extra: { x: 8, y: 38 }, sort: 2 })
    await addContent(slug, 'maps', 'map_node', { title: 'qualify', subtitle: 'Qualify', extra: { x: 30, y: 38 }, sort: 3 })
    await addContent(slug, 'maps', 'map_node', { title: 'price', subtitle: 'Price', extra: { x: 52, y: 18 }, sort: 4 })
    await addContent(slug, 'maps', 'map_node', { title: 'fulfill', subtitle: 'Fulfill', extra: { x: 52, y: 58 }, sort: 5 })
    await addContent(slug, 'maps', 'map_node', { title: 'measure', subtitle: 'Measure', extra: { x: 76, y: 38 }, sort: 6 })

    await addContent(slug, 'inquiry', 'inquiry_intro', { title: 'Discovery inquiry', body: 'Answers captured from the last operating review. Use chat to add a follow-up.', sort: 1 })
    await addContent(slug, 'inquiry', 'inquiry', { title: 'Who owns the end-to-end customer journey today?', body: 'No single owner. Marketing owns demand, sales owns conversion, ops owns fulfillment.', sort: 2 })
    await addContent(slug, 'inquiry', 'inquiry', { title: 'Where do exceptions get resolved?', body: 'Mostly WhatsApp groups and a shared inbox. No SLA, no audit trail.', sort: 3 })
    await addContent(slug, 'inquiry', 'inquiry', { title: 'What decision cannot be made without a spreadsheet?', body: 'Weekly pricing and discount approvals. Three versions circulate every Monday.', sort: 4 })

    await addContent(slug, 'market', 'market_signal', { title: 'Direct digital mix', value: '38%', body: 'Up from 29% last year. Store-led model is stale.', sort: 1 })
    await addContent(slug, 'market', 'market_signal', { title: 'Competitor speed', value: '4.2d', body: 'Peer median fulfillment is faster by 2 days.', sort: 2 })
    await addContent(slug, 'market', 'market_signal', { title: 'Price transparency', value: 'High', body: 'Customers compare live; manual discounts leak margin.', sort: 3 })
    await addContent(slug, 'market', 'market_narrative', { title: 'Market narrative', body: 'Buyers expect a single, fast path from discovery to delivery. Competitors productized that path. Meridian still runs a channel-by-channel operating model.', sort: 4 })

    for (const [quad, item, sort] of [
      ['Strengths', 'Trusted brand in core cities', 1],
      ['Strengths', 'Experienced store operators', 2],
      ['Strengths', 'Recovered service NPS', 3],
      ['Weaknesses', 'No pricing owner', 4],
      ['Weaknesses', 'Email-driven order-to-cash', 5],
      ['Weaknesses', 'Fragmented customer data', 6],
      ['Opportunities', 'Direct digital mix still growing', 7],
      ['Opportunities', 'Bundle services with fulfillment', 8],
      ['Opportunities', 'Shared decision rights', 9],
      ['Threats', 'Faster peer delivery', 10],
      ['Threats', 'Margin leakage on discounts', 11],
      ['Threats', 'Talent fatigue from heroics', 12],
    ]) {
      await addContent(slug, 'swot', 'swot', { title: quad, body: item, sort })
    }

    await addContent(slug, 'doc', 'doc_meta', { title: 'Strategy document', subtitle: 'Draft · FY27 cycle · last edited 2 Sep 2026', sort: 1 })
    await addContent(slug, 'doc', 'doc_section', { title: '1. Intent', body: 'Move from a channel-led operating model to a single customer journey with one owner, one price architecture, and one fulfillment promise.', sort: 2 })
    await addContent(slug, 'doc', 'doc_section', { title: '2. Where we are', body: 'AS-IS assessment shows workable local execution and weak system design. Pricing, data, and exception handling are the binding constraints.', sort: 3 })
    await addContent(slug, 'doc', 'doc_section', {
      title: '3. Moves',
      extra: { items: [
        'Appoint a journey owner with decision rights across marketing, sales, and ops.',
        'Publish a pricing rulebook and retire the Monday spreadsheet loop.',
        'Instrument order-to-cash so exceptions are visible, not tribal.',
      ] },
      sort: 4,
    })
  }

  await addContent('account', 'account', 'account_field', { title: 'Email', value: 'priya.shah@meridian.example', sort: 1 })
  await addContent('account', 'account', 'account_field', { title: 'Workspace', value: 'Meridian Group', sort: 2 })
  await addContent('account', 'account', 'account_field', { title: 'Role', value: 'Editor · Strategy', sort: 3 })
  await addContent('account', 'account', 'account_field', { title: 'Timezone', value: 'Asia/Kolkata', sort: 4 })

  await addContent('about', 'about', 'about_intro', { title: 'PBMP', subtitle: 'Plan. Build. Measure. Progress.', body: 'PBMP Workbench is the operating surface for strategy and delivery. Nested menus keep the method visible. The canvas holds the artifact. The side panel keeps conversation and highlights attached to the work.', sort: 1 })
  await addContent('about', 'about', 'about_feature', { title: 'Strategy canvases', sort: 2 })
  await addContent('about', 'about', 'about_feature', { title: 'Studio diagrams', sort: 3 })
  await addContent('about', 'about', 'about_feature', { title: 'Shared highlights', sort: 4 })
  await addContent('about', 'about', 'about_feature', { title: 'Role-aware reviews', sort: 5 })

  for (const slug of ['map-based', 'google-sheet', 'lucid', 'flip', 'bpmn', 'graph', 'drag-drop', 'gds', 'drawio']) {
    await addContent(slug, 'tool', 'tool_action', { title: 'New canvas', extra: { primary: true }, sort: 1 })
    await addContent(slug, 'tool', 'tool_action', { title: 'Open last draft', extra: { primary: false }, sort: 2 })
    await addContent(slug, 'tool', 'tool_slot', { title: 'Blank board', sort: 3 })
    await addContent(slug, 'tool', 'tool_slot', { title: 'From template', sort: 4 })
    await addContent(slug, 'tool', 'tool_slot', { title: 'Import file', sort: 5 })
  }

  await addContent(null, 'highlight', 'highlight', { title: 'Order-to-cash cycle time', subtitle: 'Priya Shah', body: 'Median cycle is 11.4 days. Finance and ops both mark this as the first AS-IS bottleneck.', value: '12m ago', extra: { tone: 'risk' }, sort: 1 })
  await addContent(null, 'highlight', 'highlight', { title: 'Channel mix shift', subtitle: 'Arjun Mehta', body: 'Direct digital is now 38% of bookings. Strategy doc still assumes a store-led mix.', value: '1h ago', extra: { tone: 'insight' }, sort: 2 })
  await addContent(null, 'highlight', 'highlight', { title: 'Capability gap: pricing', subtitle: 'Nisha Rao', body: 'No single owner for price architecture. Add a RACI before the next steering review.', value: 'Yesterday', extra: { tone: 'action' }, sort: 3 })

  return true
}

export async function seedFiltersIfEmpty() {
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM saved_filters')
  if (rows[0].count > 0) return false

  const filters = [
    {
      slug: 'all-pages-draft',
      name: 'Draft work',
      description: 'Common filter: draft items on every page that has a status field.',
      scope: 'global',
      group_key: null,
      page_keys: [],
      combinator: 'and',
      conditions: [{ id: 'c1', field: 'status', operator: 'equals', value: 'Draft' }],
      sort: 1,
    },
    {
      slug: 'dashboard-priya',
      name: 'My dashboard items',
      description: 'Only on Dashboard manager.',
      scope: 'pages',
      group_key: null,
      page_keys: ['dashboard'],
      combinator: 'and',
      conditions: [{ id: 'c2', field: 'owner', operator: 'contains', value: 'Priya' }],
      sort: 2,
    },
    {
      slug: 'report-strategy',
      name: 'Strategy reports',
      description: 'Report manager pages: Market Dynamics and Strategy Doc.',
      scope: 'group',
      group_key: 'reports',
      page_keys: [],
      combinator: 'and',
      conditions: [{ id: 'c3', field: 'title', operator: 'contains', value: 'strategy' }],
      sort: 3,
    },
    {
      slug: 'workspace-review',
      name: 'In review',
      description: 'Common across workspace pages.',
      scope: 'group',
      group_key: 'workspace',
      page_keys: [],
      combinator: 'and',
      conditions: [{ id: 'c4', field: 'status', operator: 'equals', value: 'In review' }],
      sort: 4,
    },
  ]

  for (const filter of filters) {
    await pool.query(
      `INSERT INTO saved_filters
        (slug, name, description, scope, group_key, page_keys, combinator, conditions_json, is_active, sort_order)
       VALUES (?,?,?,?,?,?,?,?,1,?)`,
      [
        filter.slug,
        filter.name,
        filter.description,
        filter.scope,
        filter.group_key,
        JSON.stringify(filter.page_keys),
        filter.combinator,
        JSON.stringify(filter.conditions),
        filter.sort,
      ],
    )
  }
  return true
}

export async function syncDefaultMenu() {
  await pool.query(
    "UPDATE settings SET setting_value = 'dashboard' WHERE setting_key = 'default_menu' AND setting_value = 'business'",
  )
}

const EXTERNAL_LINK_MENUS = [
  { slug: 'hbmp-agentbot', label: 'HBMP AgentBot', icon: 'bot', sort: 2, url: 'https://www.grow24.ai/HBMP_AgentBot/' },
  { slug: 'app-manager', label: 'app manager', icon: 'app', sort: 3, url: 'https://www.grow24.ai/app_manager/' },
  { slug: 'hbmp-docs-platform', label: 'HBMP DOCS PLATFORM', icon: 'docs', sort: 4, url: 'https://www.grow24.ai/HBMP_DOCS_PLATFORM/' },
  { slug: 'hbmp-form-manager', label: 'hbmp form manager', icon: 'form', sort: 5, url: 'https://www.grow24.ai/hbmp_form_manager/' },
  { slug: 'hbmp-one', label: 'HBMP One', icon: 'layers', sort: 6, url: 'https://www.grow24.ai/HBMP_One/' },
  { slug: 'image-processing', label: 'ImageProcessing', icon: 'image', sort: 7, url: 'https://www.grow24.ai/ImageProcessing/' },
  { slug: 'openstreetmaps', label: 'OpenStreetMaps', icon: 'mappin', sort: 8, url: 'https://www.grow24.ai/OpenStreetMaps/' },
  { slug: 'mini-builder', label: 'Mini Builder', icon: 'builder', sort: 9, url: 'https://www.grow24.ai/testing-responsiveness/' },
  { slug: 'apify-n8n', label: 'apify n8n', icon: 'zap', sort: 10, url: 'https://apify-n8n.zeabur.app/setup' },
  { slug: 'form-template', label: 'Form Template', icon: 'template', sort: 11, url: 'https://pbmpformtemplate.zeabur.app/' },
]

export async function seedAgentBotMenu() {
  const [sections] = await pool.query("SELECT id FROM menu_sections WHERE slug = 'workspace' LIMIT 1")
  if (!sections.length) return
  const sectionId = sections[0].id

  for (const item of EXTERNAL_LINK_MENUS) {
    const [existing] = await pool.query('SELECT id FROM menu_items WHERE slug = ? LIMIT 1', [item.slug])
    if (existing.length) {
      await pool.query(
        'UPDATE menu_items SET label = ?, icon = ?, sort_order = ?, external_url = ?, parent_id = NULL, section_id = ? WHERE slug = ?',
        [item.label, item.icon, item.sort, item.url, sectionId, item.slug],
      )
    } else {
      await pool.query(
        `INSERT INTO menu_items
          (slug, section_id, parent_id, label, icon, sort_order, canvas_title, canvas_eyebrow, canvas_description, external_url)
         VALUES (?, ?, NULL, ?, ?, ?, NULL, NULL, NULL, ?)`,
        [item.slug, sectionId, item.label, item.icon, item.sort, item.url],
      )
    }
  }

  await pool.query("UPDATE menu_items SET sort_order = 12 WHERE slug = 'filter'")
  await pool.query("UPDATE menu_items SET sort_order = 13 WHERE slug = 'strategy'")
}
