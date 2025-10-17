'use client'


import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type ApiOk = {
  ok: true
  gelatoOrderId?: string
  gelatoStatus?: string
  debug?: Record<string, unknown>
}
type ApiErr = { ok?: false; error?: string; debug?: Record<string, unknown> }
type ApiAny = ApiOk | ApiErr | Record<string, unknown>

function Inner() {
  const sp = useSearchParams()
  const sessionId = sp.get('session_id') || ''
  const forceDebug = sp.get('debug') === '1'

  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('Finalizing your order…')
  const [resp, setResp] = useState<ApiAny | null>(null)
  const [raw, setRaw] = useState<string>('')
  const [http, setHttp] = useState<{ code?: number; ok?: boolean }>({})

  const showDebug = forceDebug || status !== 'done'

  useEffect(() => {
    const run = async () => {
      setStatus('working')

      if (!sessionId) {
        setStatus('error')
        setMessage('Missing session_id')
        return
      }

      try {
        console.groupCollapsed('[thank-you] place-from-session')
        console.log('session_id:', sessionId)

        const res = await fetch('/api/gelato/place-from-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
          cache: 'no-store',
        })

        setHttp({ code: res.status, ok: res.ok })

        const text = await res.text()
        setRaw(text)

        let json: ApiAny | null = null
        try {
          json = text ? (JSON.parse(text) as ApiAny) : {}
        } catch {
          // parsing failed, raw text available for debug
        }
        setResp(json)

        // Log *everything* to the console for quick triage
        console.log('HTTP:', res.status, res.ok)
        console.log('RAW:', text)
        console.log('JSON:', json)

        if (!res.ok) {
          const errMsg = (json as ApiErr)?.error || `HTTP ${res.status}`
          throw new Error(errMsg)
        }

        setStatus('done')
        setMessage('Order captured. We’ll email you updates 🎉')
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setStatus('error')
        setMessage(msg)
        console.error('[thank-you] failed:', msg)
      } finally {
        console.groupEnd()
      }
    }

    run()
  }, [sessionId])

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-zinc-950 border border-white/10 rounded-xl p-6">
        <h1 className="text-2xl font-semibold">
          {status === 'done' ? 'Thanks! Your order is in.' : 'Finishing up…'}
        </h1>
        <p className={`mt-2 ${status === 'error' ? 'text-red-400' : 'text-white/80'}`}>
          {message}
        </p>

        {showDebug && (
          <details className="mt-6 bg-black/40 rounded-lg border border-white/10 p-4" open>
            <summary className="cursor-pointer font-medium">Debug details</summary>
            <div className="mt-3 space-y-3 text-sm">
              <div>session_id: <code className="break-all">{sessionId || '—'}</code></div>
              <div>HTTP: {http.code ?? '—'} ({String(http.ok)})</div>

              <div>
                <div className="text-white/60 mb-1">JSON:</div>
                <pre className="whitespace-pre-wrap break-words bg-black/30 p-3 rounded">
                  {resp ? JSON.stringify(resp, null, 2) : '—'}
                </pre>
              </div>

              <div>
                <div className="text-white/60 mb-1">RAW:</div>
                <pre className="whitespace-pre-wrap break-words bg-black/30 p-3 rounded">
                  {raw || '—'}
                </pre>
              </div>

              <div className="text-white/60">
                Tip: append <code>?debug=1</code> to keep this panel open later.
              </div>
            </div>
          </details>
        )}
      </div>
    </main>
  )
}

export default function PostCheckoutClient() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-950 border border-white/10 rounded-xl p-6 text-center">
            <h1 className="text-2xl font-semibold mb-2">Finalizing…</h1>
            <p className="text-white/80">Please hold on while we place your order.</p>
          </div>
        </main>
      }
    >
      <Inner />
    </Suspense>
  )
}
