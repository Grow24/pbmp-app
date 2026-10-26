import { pool } from './db.js'

function dateText(value) {
  if (!value) return ''
  if (value instanceof Date) {
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${value.getFullYear()}-${month}-${day}`
  }
  return String(value).slice(0, 10)
}

function money(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export function projectJson(row) {
  const budget = money(row.budget_amount)
  const actual = money(row.actual_cost)
  return {
    project_id: row.slug,
    name: row.name,
    status: row.status,
    owner: row.owner,
    summary: row.summary,
    budget,
    actual_cost: actual,
    currency: row.currency,
    budget_consumed_pct: budget > 0 ? Math.round((actual / budget) * 1000) / 10 : null,
    schedule_variance_pct: money(row.schedule_variance_pct),
    funding_recommendation: row.funding_recommendation,
    data_as_of: dateText(row.data_as_of),
  }
}

export async function ensureBusinessRecords() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pbmp_projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(64) NOT NULL UNIQUE,
      name VARCHAR(160) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'active',
      owner VARCHAR(120) NOT NULL DEFAULT '',
      summary TEXT NULL,
      budget_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
      actual_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
      currency VARCHAR(16) NOT NULL DEFAULT 'INR',
      schedule_variance_pct DECIMAL(6,2) NOT NULL DEFAULT 0,
      funding_recommendation VARCHAR(180) NOT NULL DEFAULT '',
      data_as_of DATE NULL
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pbmp_risks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_slug VARCHAR(64) NOT NULL,
      title VARCHAR(180) NOT NULL,
      severity VARCHAR(16) NOT NULL DEFAULT 'medium',
      owner VARCHAR(120) NOT NULL DEFAULT '',
      status VARCHAR(32) NOT NULL DEFAULT 'open',
      note TEXT NULL,
      INDEX idx_pbmp_risks_project (project_slug)
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pbmp_benefits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_slug VARCHAR(64) NOT NULL,
      title VARCHAR(180) NOT NULL,
      amount DECIMAL(14,2) NOT NULL DEFAULT 0,
      currency VARCHAR(16) NOT NULL DEFAULT 'INR',
      note TEXT NULL,
      INDEX idx_pbmp_benefits_project (project_slug)
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pbmp_sales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL,
      geography VARCHAR(16) NOT NULL,
      kind VARCHAR(16) NOT NULL,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      currency VARCHAR(16) NOT NULL DEFAULT 'INR',
      revenue DECIMAL(14,2) NOT NULL DEFAULT 0,
      units INT NOT NULL DEFAULT 0,
      gross_margin DECIMAL(14,2) NOT NULL DEFAULT 0,
      customer_count INT NOT NULL DEFAULT 0,
      data_as_of DATE NULL,
      INDEX idx_pbmp_sales_lookup (product_id, geography, kind)
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pbmp_requirements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_slug VARCHAR(64) NOT NULL,
      title VARCHAR(180) NOT NULL,
      body TEXT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'draft',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_pbmp_requirements_project (project_slug)
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pbmp_tool_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tool_name VARCHAR(64) NOT NULL,
      args_json JSON NULL,
      result_text TEXT NULL,
      is_error TINYINT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  const [existing] = await pool.query('SELECT slug FROM pbmp_projects WHERE slug = ? LIMIT 1', ['alpha'])
  if (existing.length) return

  await pool.query(
    `INSERT INTO pbmp_projects
      (slug, name, status, owner, summary, budget_amount, actual_cost, currency, schedule_variance_pct, funding_recommendation, data_as_of)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'alpha',
      'Project Alpha',
      'active',
      'Steering committee',
      'Customer portal rebuild. The vendor milestone for the identity service is late.',
      10000000,
      7240000,
      'INR',
      -18,
      'Continue, if the vendor-delay risk has an owner and a date.',
      '2026-10-26',
    ],
  )
  await pool.query(
    `INSERT INTO pbmp_risks (project_slug, title, severity, owner, status, note) VALUES
      ('alpha', 'Vendor delay', 'high', 'Vendor manager', 'open', 'Identity-service milestone is late.'),
      ('alpha', 'Scope creep', 'medium', 'Product owner', 'open', 'Portal requests are still being added.'),
      ('alpha', 'Steering pack not approved', 'medium', 'PMO', 'open', 'The latest pack is waiting on the committee.')`,
  )
  await pool.query(
    `INSERT INTO pbmp_benefits (project_slug, title, amount, currency, note) VALUES
      ('alpha', 'Expected benefit', 18.4, 'INR_CR', 'Benefit case stored with the project. This is not a live finance-system feed.')`,
  )
  await pool.query(
    `INSERT INTO pbmp_sales
      (product_id, geography, kind, period_start, period_end, currency, revenue, units, gross_margin, customer_count, data_as_of)
     VALUES
      ('PBMP-CORE', 'IN', 'actual', '2026-01-01', '2026-03-31', 'INR', 4200000, 180, 1260000, 42, '2026-04-02'),
      ('PBMP-CORE', 'IN', 'forecast', '2026-04-01', '2026-06-30', 'INR', 4600000, 200, 1400000, 48, '2026-04-02')`,
  )
}

export async function listProjects(limit, offset) {
  const size = Math.min(Math.max(Number(limit) || 5, 1), 20)
  const start = Math.max(Number(offset) || 0, 0)
  const [rows] = await pool.query(
    'SELECT * FROM pbmp_projects ORDER BY id LIMIT ? OFFSET ?',
    [size, start],
  )
  const [count] = await pool.query('SELECT COUNT(*) AS total FROM pbmp_projects')
  return { projects: rows.map(projectJson), limit: size, offset: start, total: Number(count[0].total) }
}

export async function getProject(projectId) {
  const [rows] = await pool.query('SELECT * FROM pbmp_projects WHERE slug = ? LIMIT 1', [String(projectId || '').trim()])
  return rows[0] || null
}

export async function listRisks(projectId, limit) {
  const size = Math.min(Math.max(Number(limit) || 5, 1), 20)
  const [rows] = await pool.query(
    `SELECT id, title, severity, owner, status, note
     FROM pbmp_risks WHERE project_slug = ? ORDER BY FIELD(severity, 'critical', 'high', 'medium', 'low'), id LIMIT ?`,
    [projectId, size],
  )
  return rows
}

export async function listBenefits(projectId) {
  const [rows] = await pool.query(
    'SELECT id, title, amount, currency, note FROM pbmp_benefits WHERE project_slug = ? ORDER BY id',
    [projectId],
  )
  return rows.map((row) => ({ ...row, amount: money(row.amount) }))
}

export async function listSales({ productId, geography, startDate, endDate, kind }) {
  const [rows] = await pool.query(
    `SELECT product_id, geography, kind, period_start, period_end, currency, revenue, units, gross_margin, customer_count, data_as_of
     FROM pbmp_sales
     WHERE product_id = ? AND geography = ? AND kind = ?
       AND period_start <= ? AND period_end >= ?
     ORDER BY period_start`,
    [productId, geography, kind, endDate, startDate],
  )
  return rows.map((row) => ({
    product_id: row.product_id,
    geography: row.geography,
    kind: row.kind,
    period_start: dateText(row.period_start),
    period_end: dateText(row.period_end),
    currency: row.currency,
    revenue: money(row.revenue),
    units: Number(row.units),
    gross_margin: money(row.gross_margin),
    customer_count: Number(row.customer_count),
    data_as_of: dateText(row.data_as_of),
  }))
}

export async function insertRequirement({ projectId, title, body }) {
  const [result] = await pool.query(
    'INSERT INTO pbmp_requirements (project_slug, title, body, status) VALUES (?, ?, ?, ?)',
    [projectId, title, body || '', 'draft'],
  )
  return { id: result.insertId, project_id: projectId, title, status: 'draft' }
}

export async function insertRisk({ projectId, title, severity }) {
  const [result] = await pool.query(
    'INSERT INTO pbmp_risks (project_slug, title, severity, status) VALUES (?, ?, ?, ?)',
    [projectId, title, severity, 'open'],
  )
  return { id: result.insertId, project_id: projectId, title, severity, status: 'open' }
}

export async function updateRisk(id, status) {
  const [result] = await pool.query('UPDATE pbmp_risks SET status = ? WHERE id = ?', [status, id])
  return result.affectedRows
}

export async function updateProjectStatus(projectId, status) {
  const [result] = await pool.query('UPDATE pbmp_projects SET status = ? WHERE slug = ?', [status, projectId])
  return result.affectedRows
}

export async function projectIds() {
  const [rows] = await pool.query('SELECT slug FROM pbmp_projects ORDER BY id')
  return rows.map((row) => row.slug)
}

export function charterText(project, risks, benefits) {
  const view = projectJson(project)
  const riskLines = risks.map((risk) => `- ${risk.title} (${risk.severity}, ${risk.status})`)
  const benefitLines = benefits.map((benefit) => `- ${benefit.title}: ${benefit.amount} ${benefit.currency}`)
  return [
    `Charter: ${view.name}`,
    `Project id: ${view.project_id}`,
    `Status: ${view.status}`,
    `Owner: ${view.owner}`,
    `Budget: ${view.budget} ${view.currency}`,
    `Actual cost: ${view.actual_cost} ${view.currency}`,
    `Budget consumed: ${view.budget_consumed_pct}%`,
    `Schedule variance: ${view.schedule_variance_pct}%`,
    `Data as of: ${view.data_as_of}`,
    `Funding note: ${view.funding_recommendation}`,
    '',
    view.summary,
    '',
    'Risks:',
    ...(riskLines.length ? riskLines : ['- none stored']),
    '',
    'Benefits:',
    ...(benefitLines.length ? benefitLines : ['- none stored']),
  ].join('\n')
}

export const STATIC_RESOURCES = {
  'pbmp://standards/company-policy': [
    'PBMP company policy for model answers',
    '- Do not invent budget, actuals, risks, benefits, or sales.',
    '- Quote data_as_of from the tool result.',
    '- If a project id is not found, say so. Do not substitute a similar name.',
    '- Write tools save a row only when confirmed is true after the user agrees.',
  ].join('\n'),
  'pbmp://standards/business-case-template': [
    'Business case template',
    '1. Project id and name',
    '2. Problem',
    '3. Budget, actual cost, and data_as_of',
    '4. Top risks',
    '5. Expected benefit',
    '6. Recommendation: continue, pause, or stop',
  ].join('\n'),
  'pbmp://standards/architecture': [
    'PBMP architecture note',
    'The workbench chat is the MCP host.',
    'Business records live in MySQL tables pbmp_projects, pbmp_risks, pbmp_benefits, pbmp_sales, and pbmp_requirements.',
    'The model calls tools. It does not read those tables itself.',
  ].join('\n'),
  'pbmp://algorithms/customer-profitability/v3': [
    'Customer profitability v3',
    'profit = revenue - direct_cost - allocated_overhead',
    'margin_pct = profit / revenue when revenue is not zero',
    'This resource is the written rule. It is not a live calculation over customer rows.',
  ].join('\n'),
}

export async function logTool(name, args, resultText, isError) {
  try {
    await pool.query(
      'INSERT INTO pbmp_tool_log (tool_name, args_json, result_text, is_error) VALUES (?, ?, ?, ?)',
      [name, JSON.stringify(args || {}), String(resultText || '').slice(0, 4000), isError ? 1 : 0],
    )
  } catch {
    // A log failure must not hide the tool result.
  }
}
