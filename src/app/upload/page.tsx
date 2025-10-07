'use client'

import { Suspense } from 'react'
import SpookifyInner from '../spookify/spookify-inner'
// import SpookifyInner from './spookify-inner'

// Prevent prerender so useSearchParams works at runtime
export const dynamic = 'force-dynamic'

export default function SpookifyPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          <p className="text-gray-400">Loading…</p>
        </main>
      }
    >
      <SpookifyInner />
    </Suspense>
  )
}
