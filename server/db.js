import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

function envFirst(...keys) {
  for (const key of keys) {
    const value = process.env[key]
    if (value == null) continue
    const trimmed = String(value).trim()
    if (!trimmed || trimmed.includes('${')) continue
    return trimmed
  }
  return undefined
}

export const dbConfig = {
  host: envFirst('DB_HOST', 'MYSQL_HOST') || '127.0.0.1',
  port: Number(envFirst('DB_PORT', 'MYSQL_PORT') || 3306),
  user: envFirst('DB_USER', 'MYSQL_USERNAME', 'MYSQL_USER') || 'pbmp',
  password: envFirst('DB_PASSWORD', 'MYSQL_PASSWORD') || 'pbmp',
  database: envFirst('DB_NAME', 'MYSQL_DATABASE') || 'pbmp_workbench',
}

export const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
})

export async function waitForDb(tries = 120) {
  let lastError
  for (let i = 0; i < tries; i += 1) {
    try {
      await pool.query('SELECT 1')
      return
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  throw lastError
}

export async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      setting_key VARCHAR(64) PRIMARY KEY,
      setting_value TEXT NOT NULL,
      group_name VARCHAR(32) NOT NULL DEFAULT 'general',
      label VARCHAR(120) NOT NULL,
      input_type VARCHAR(20) NOT NULL DEFAULT 'text',
      sort_order INT NOT NULL DEFAULT 0
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_sections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(64) NOT NULL UNIQUE,
      label VARCHAR(120) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(64) NOT NULL UNIQUE,
      section_id INT NOT NULL,
      parent_id INT NULL,
      label VARCHAR(120) NOT NULL,
      icon VARCHAR(40) NOT NULL DEFAULT 'dashboard',
      sort_order INT NOT NULL DEFAULT 0,
      canvas_title VARCHAR(180) NULL,
      canvas_eyebrow VARCHAR(180) NULL,
      canvas_description TEXT NULL,
      external_url VARCHAR(500) NULL,
      FOREIGN KEY (section_id) REFERENCES menu_sections(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES menu_items(id) ON DELETE CASCADE
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS canvas_tabs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(64) NOT NULL,
      menu_item_id INT NOT NULL,
      label VARCHAR(120) NOT NULL,
      view_kind VARCHAR(32) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      UNIQUE KEY uniq_tab (menu_item_id, slug),
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS canvas_subtabs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(64) NOT NULL,
      tab_id INT NOT NULL,
      label VARCHAR(120) NOT NULL,
      view_kind VARCHAR(32) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      UNIQUE KEY uniq_sub (tab_id, slug),
      FOREIGN KEY (tab_id) REFERENCES canvas_tabs(id) ON DELETE CASCADE
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS content_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      menu_item_id INT NULL,
      view_kind VARCHAR(32) NOT NULL,
      block_type VARCHAR(32) NOT NULL,
      title VARCHAR(255) NULL,
      subtitle VARCHAR(255) NULL,
      body TEXT NULL,
      value_text VARCHAR(255) NULL,
      extra_json JSON NULL,
      sort_order INT NOT NULL DEFAULT 0,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS saved_filters (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(64) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      description TEXT NULL,
      scope VARCHAR(20) NOT NULL DEFAULT 'global',
      group_key VARCHAR(64) NULL,
      page_keys JSON NULL,
      combinator VARCHAR(8) NOT NULL DEFAULT 'and',
      conditions_json JSON NOT NULL,
      is_active TINYINT NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0
    )
  `)

  const [urlCol] = await pool.query(
    `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items' AND COLUMN_NAME = 'external_url'`,
  )
  if (!urlCol[0].count) {
    await pool.query('ALTER TABLE menu_items ADD COLUMN external_url VARCHAR(500) NULL')
  }
}
