// // // Simple in-memory store for dev/MVP
// // type Item = { dataUrl: string; created: number }
// // const g = globalThis as any
// // if (!g.__MEM_STORE__) g.__MEM_STORE__ = new Map<string, Item>()
// // const memStore: Map<string, Item> = g.__MEM_STORE__
// // export default memStore
// // Minimal in-memory store for dev/MVP
// export type StoredItem = {
//     id: string
//     dataUrl?: string            // original uploaded image (data URL)
//     plan?: any                  // parsed CONFIG from chat
//     finalizedPrompt?: string    // prompt to send to gpt-image-1
//     created: number
//     updated: number
//   }
  
//   const g = globalThis as any
//   if (!g.__MEM_STORE__) g.__MEM_STORE__ = new Map<string, StoredItem>()
//   const memStore: Map<string, StoredItem> = g.__MEM_STORE__
  
//   export function upsertItem(id: string, patch: Partial<StoredItem>) {
//     const now = Date.now()
//     const prev = memStore.get(id)
//     const next: StoredItem = {
//       id,
//       created: prev?.created ?? now,
//       updated: now,
//       dataUrl: prev?.dataUrl,
//       plan: prev?.plan,
//       finalizedPrompt: prev?.finalizedPrompt,
//       ...patch,
//     }
//     memStore.set(id, next)
//     return next
//   }
  
//   export default memStore
  // Minimal in-memory store for dev/MVP
export type StoredItem = {
    id: string
    dataUrl?: string            // original uploaded image (data URL)
    plan?: any                  // parsed CONFIG from chat
    finalizedPrompt?: string    // prompt to send to gpt-image-1
    created: number
    updated: number
  }
  
  const g = globalThis as any
  if (!g.__MEM_STORE__) g.__MEM_STORE__ = new Map<string, StoredItem>()
  const memStore: Map<string, StoredItem> = g.__MEM_STORE__
  
  export function upsertItem(id: string, patch: Partial<StoredItem>) {
    const now = Date.now()
    const prev = memStore.get(id)
    const next: StoredItem = {
      id,
      created: prev?.created ?? now,
      updated: now,
      dataUrl: prev?.dataUrl,
      plan: prev?.plan,
      finalizedPrompt: prev?.finalizedPrompt,
      ...patch,
    }
    memStore.set(id, next)
    return next
  }
  
  export default memStore
  