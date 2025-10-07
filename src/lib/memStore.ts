// Minimal in-memory store for dev/MVP

export type StoredItem = {
  id: string
  dataUrl?: string
  plan?: Record<string, unknown> | null
  finalizedPrompt?: string | null
  created: number
  updated: number
}

declare global {
  // eslint-disable-next-line no-var
  var __MEM_STORE__: Map<string, StoredItem> | undefined
}

const mem = (globalThis as { __MEM_STORE__?: Map<string, StoredItem> }).__MEM_STORE__
if (!mem) {
  ;(globalThis as { __MEM_STORE__: Map<string, StoredItem> }).__MEM_STORE__ =
    new Map<string, StoredItem>()
}
const memStore = (globalThis as { __MEM_STORE__: Map<string, StoredItem> }).__MEM_STORE__

export function upsertItem(id: string, patch: Partial<StoredItem>): StoredItem {
  const now = Date.now()
  const prev = memStore.get(id)
  const next: StoredItem = {
    id,
    created: prev?.created ?? now,
    updated: now,
    dataUrl: prev?.dataUrl,
    plan: prev?.plan ?? null,
    finalizedPrompt: prev?.finalizedPrompt ?? null,
    ...patch,
  }
  memStore.set(id, next)
  return next
}

export default memStore
