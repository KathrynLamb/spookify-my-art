// src/app/post-checkout/PostCheckoutClient.tsx
'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function Inner() {
  const router = useRouter()
  const sp = useSearchParams()
  const sessionId = sp.get('session_id') || ''

  const [status, setStatus] = useState<'working'|'error'>('working')
  const [message, setMessage] = useState('Placing your order with Gelato…')

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!sessionId) {
        setStatus('error')
        setMessage('Missing session_id')
        return
      }
      try {
        const res = await fetch('/api/gelato/place-from-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        })
  
        // Be robust to empty or non-JSON responses
        const text = await res.text()
        let j: { ok?: boolean; gelatoOrderId?: string; error?: string } = {}
        try { j = text ? JSON.parse(text) : {} } catch { /* keep j as {} */ }
  
        if (!res.ok || !j.ok) {
          throw new Error(j.error || `HTTP ${res.status} — ${text || 'No response body'}`)
        }
  
        if (!cancelled) {
          const qp = new URLSearchParams({ session_id: sessionId })
          if (j.gelatoOrderId) qp.set('gelato', j.gelatoOrderId)
          router.replace(`/thank-you?${qp.toString()}`)
        }
      } catch (e) {
        if (!cancelled) {
          setStatus('error')
          setMessage(e instanceof Error ? e.message : String(e))
        }
      }
    }
    run()
    return () => { cancelled = true }
  }, [sessionId, router])
  

  if (status === 'error') {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-950 border border-white/10 rounded-xl p-6 text-center">
          <h1 className="text-2xl font-semibold mb-2">We hit a snag</h1>
          <p className="text-red-400 mb-4">{message}</p>
          <button onClick={() => location.reload()} className="px-4 py-2 rounded bg-white text-black">
            Try again
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-950 border border-white/10 rounded-xl p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">Updating Gelato…</h1>
        <p className="text-white/80">Please hold on while we finalize your print order.</p>
      </div>
    </main>
  )
}

export default function PostCheckoutClient() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-gray-950 border border-white/10 rounded-xl p-6 text-center">
            <h1 className="text-2xl font-semibold mb-2">Updating Gelato…</h1>
            <p className="text-white/80">Please hold on while we finalize your print order.</p>
          </div>
        </main>
      }
    >
      <Inner />
    </Suspense>
  )
}
