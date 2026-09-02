import type { ContentBlock } from '../../types'
import type { FilterRecord } from './types'

export function blockToRecord(block: ContentBlock, pageKey = ''): FilterRecord {
  const extra = block.extra || {}
  return {
    id: block.id,
    title: block.title || '',
    owner: String(extra.owner || block.subtitle || ''),
    status: String(extra.status || block.value || ''),
    workspace: String(extra.workspace || pageKey),
    items: Number(extra.items ?? block.value ?? 0) || 0,
    updated: String(extra.updated || ''),
    body: block.body || '',
  }
}
