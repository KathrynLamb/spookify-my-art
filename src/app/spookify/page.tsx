'use client'

import { Suspense } from 'react'
import SpookifyInner from './spookify-inner'

// Make this page dynamic so Next doesn’t try to prerender it
export const dynamic = 'force-dynamic'

export default function SpookifyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </main>
    }>
      <SpookifyInner />
    </Suspense>
  )
}
