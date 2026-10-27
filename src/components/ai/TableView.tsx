export type ParsedTable = { columns: string[]; rows: string[][] }

function parseCsvLine(line: string) {
  const cells: string[] = []
  let current = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        current += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      cells.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current.trim())
  return cells
}

function fromRecords(value: unknown): ParsedTable | null {
  if (!Array.isArray(value) || !value.length) return null
  if (value.every((row) => row && typeof row === 'object' && !Array.isArray(row))) {
    const columns = [...new Set(value.flatMap((row) => Object.keys(row as Record<string, unknown>)))]
    return {
      columns,
      rows: value.map((row) => columns.map((column) => String((row as Record<string, unknown>)[column] ?? ''))),
    }
  }
  if (value.every((row) => Array.isArray(row))) {
    const grid = value.map((row) => (row as unknown[]).map((cell) => String(cell ?? '')))
    return { columns: grid[0], rows: grid.slice(1) }
  }
  return null
}

export function parseTable(body: string): ParsedTable | null {
  const text = String(body || '').trim()
  if (!text) return null
  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text)
      const table = fromRecords(Array.isArray(parsed) ? parsed : parsed.rows)
      if (table) return table
    } catch {
      // Fall through to CSV or a markdown table.
    }
  }
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (!lines.length) return null
  if (lines.every((line) => line.startsWith('|') && line.endsWith('|'))) {
    const cells = (line: string) => line.split('|').slice(1, -1).map((cell) => cell.trim())
    const columns = cells(lines[0])
    const rows = lines.slice(1).filter((line) => !/^[\s|:-]+$/.test(line)).map(cells)
    if (columns.length) return { columns, rows }
  }
  const grid = lines.map(parseCsvLine)
  if (!grid[0].length) return null
  return { columns: grid[0], rows: grid.slice(1) }
}

export function TableView({ body }: { body: string }) {
  const table = parseTable(body)
  if (!table) return <p className="text-[12px] text-slate-500">This table has no rows.</p>
  return (
    <div className="overflow-x-auto rounded border border-slate-200">
      <table className="w-full border-collapse text-left text-[12px]">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            {table.columns.map((column, index) => (
              <th key={`${index}-${column}`} className="border-b border-slate-200 px-2 py-1.5 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, index) => (
            <tr key={index} className="odd:bg-white even:bg-slate-50/60">
              {table.columns.map((column, cell) => (
                <td key={`${index}-${cell}`} className="border-b border-slate-100 px-2 py-1.5 text-slate-800">
                  {row[cell] || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
