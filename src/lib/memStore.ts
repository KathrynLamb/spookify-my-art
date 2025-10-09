// src/lib/memStore.ts
// Minimal in-memory store for dev/MVP

export type StoredItem = {
  id: string
  dataUrl?: string
  plan?: Record<string, unknown> | null
  finalizedPrompt?: string | null
  created: number
  updated: number
}

// Type-safe augmentation of globalThis (no eslint disables, no `any`)
type AugmentedGlobal = typeof globalThis & {
  __MEM_STORE__?: Map<string, StoredItem>
}

const g = globalThis as AugmentedGlobal

if (!g.__MEM_STORE__) {
  g.__MEM_STORE__ = new Map<string, StoredItem>()
}

const memStore = g.__MEM_STORE__!

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
