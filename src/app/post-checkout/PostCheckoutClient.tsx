// 'use client'


// import { Suspense, useEffect, useState } from 'react'
// import { useRouter, useSearchParams } from 'next/navigation'

// type ApiOk = { ok: true; gelatoOrderId?: string }
// type ApiErr = { ok?: false; error?: string }
// type ApiAny = ApiOk | ApiErr | Record<string, unknown>

// type Phase =
//   | 'idle'
//   | 'start'
//   | 'fetching'
//   | 'read-body'
//   | 'parsing'
//   | 'validating'
//   | 'routing'
//   | 'error'

// function Inner() {
//   const router = useRouter()
//   const sp = useSearchParams()
//   const sessionId = sp.get('session_id') || ''
//   const debug = (sp.get('debug') ?? '') === '1'

//   const [phase, setPhase] = useState<Phase>('idle')
//   const [status, setStatus] = useState<'working' | 'error'>('working')
//   const [message, setMessage] = useState('Placing your order with Gelato…')

//   const [httpStatus, setHttpStatus] = useState<number | null>(null)
//   const [httpOk, setHttpOk] = useState<boolean | null>(null)
//   const [headers, setHeaders] = useState<Array<[string, string]>>([])
//   const [rawBody, setRawBody] = useState<string>('')
//   const [jsonBody, setJsonBody] = useState<ApiAny | null>(null)
//   const [parseError, setParseError] = useState<string | null>(null)
//   const [threw, setThrew] = useState<string | null>(null)
//   const [timing, setTiming] = useState<{ started?: number; ended?: number; ms?: number }>({})

//   const showDebug = debug || status === 'error'

//   useEffect(() => {
//     let cancelled = false

//     const run = async () => {
//       setPhase('start')
//       setTiming({ started: performance.now() })

//       if (!sessionId) {
//         setStatus('error')
//         setMessage('Missing session_id')
//         setPhase('error')
//         return
//       }

//       try {
//         setPhase('fetching')
//         const res = await fetch('/api/gelato/place-from-session', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ session_id: sessionId }),
//           cache: 'no-store',
//         })

//         setHttpStatus(res.status)
//         setHttpOk(res.ok)
//         setHeaders(Array.from(res.headers.entries()))

//         const text = await res.text()
//         setRawBody(text)

//         let j: ApiAny | null = null
//         let localParseError: string | null = null
//         try {
//           j = text ? (JSON.parse(text) as ApiAny) : {}
//           setJsonBody(j)
//         } catch (err) {
//           localParseError = err instanceof Error ? err.message : String(err)
//           setParseError(localParseError)
//           j = null
//         }

//         if (!res.ok) {
//           const errMsg =
//             (j as ApiErr | null)?.error ||
//             `HTTP ${res.status}${text ? ` — ${text}` : ''}`
//           throw new Error(errMsg)
//         }

//         if (!j || typeof j !== 'object') {
//           throw new Error('Server returned no JSON object')
//         }

//         const ok = (j as ApiOk | ApiErr).ok === true
//         if (!ok) {
//           const errMsg =
//             (j as ApiErr).error ||
//             (localParseError ? `JSON parse error: ${localParseError}` : 'Unknown server error')
//           throw new Error(errMsg)
//         }

//         if (!cancelled) {
//           const qp = new URLSearchParams({ session_id: sessionId })
//           const id = (j as ApiOk).gelatoOrderId
//           if (id) qp.set('gelato', String(id))
//           router.replace(`/thank-you?${qp.toString()}`)
//         }
//       } catch (e) {
//         const msg = e instanceof Error ? e.message : String(e)
//         setThrew(msg)
//         setStatus('error')
//         setMessage(msg)
//         setPhase('error')
//       } finally {
//         setTiming((t) => {
//           const ended = performance.now()
//           return { ...t, ended, ms: t.started ? Math.round(ended - t.started) : undefined }
//         })
//       }
//     }

//     run()
//     return () => {
//       cancelled = true
//     }
//   }, [sessionId, router])

//   // ---------------- UI ----------------

//   if (status === 'error') {
//     return (
//       <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
//         <div className="max-w-2xl w-full bg-gray-950 border border-white/10 rounded-xl p-6">
//           <h1 className="text-2xl font-semibold mb-2">We hit a snag</h1>
//           <p className="text-red-400 mb-4">{message}</p>

//           {showDebug && (
//             <details className="mt-4 bg-black/40 rounded-lg border border-white/10 p-4" open>
//               <summary className="cursor-pointer font-medium">Debug details</summary>
//               <div className="mt-3 space-y-2 text-sm">
//                 <div><span className="text-white/60">phase:</span> {phase}</div>
//                 <div><span className="text-white/60">timing:</span> {timing.ms ? `${timing.ms} ms` : '—'}</div>
//                 <div><span className="text-white/60">HTTP:</span> {httpStatus ?? '—'} ({String(httpOk)})</div>
//                 <div className="overflow-auto">
//                   <div className="text-white/60">headers:</div>
//                   <pre className="whitespace-pre-wrap break-words bg-black/30 p-2 rounded">
//                     {JSON.stringify(Object.fromEntries(headers), null, 2)}
//                   </pre>
//                 </div>
//                 <div className="overflow-auto">
//                   <div className="text-white/60">raw body:</div>
//                   <pre className="whitespace-pre-wrap break-words bg-black/30 p-2 rounded">
//                     {rawBody || '—'}
//                   </pre>
//                 </div>
//                 <div className="overflow-auto">
//                   <div className="text-white/60">json parsed:</div>
//                   <pre className="whitespace-pre-wrap break-words bg-black/30 p-2 rounded">
//                     {jsonBody ? JSON.stringify(jsonBody, null, 2) : '—'}
//                   </pre>
//                 </div>
//                 {parseError ? (
//                   <div className="text-amber-400">parseError: {parseError}</div>
//                 ) : null}
//                 {threw ? <div className="text-red-400">threw: {threw}</div> : null}
//               </div>
//             </details>
//           )}

//           <div className="mt-4 flex gap-2">
//             <button
//               onClick={() => location.reload()}
//               className="px-4 py-2 rounded bg-white text-black"
//             >
//               Try again
//             </button>
//             <button
//               onClick={() => {
//                 const url = new URL(location.href)
//                 url.searchParams.set('debug', '1')
//                 location.href = url.toString()
//               }}
//               className="px-4 py-2 rounded bg-white/10 border border-white/15"
//             >
//               Enable debug
//             </button>
//           </div>
//         </div>
//       </main>
//     )
//   }

//   return (
//     <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
//       <div className="max-w-md w-full bg-gray-950 border border-white/10 rounded-xl p-6 text-center">
//         <h1 className="text-2xl font-semibold mb-2">Updating Gelato…</h1>
//         <p className="text-white/80">
//           Please hold on while we finalize your print order.
//         </p>

//         {showDebug && (
//           <details className="mt-4 bg-black/40 rounded-lg border border-white/10 p-4">
//             <summary className="cursor-pointer font-medium">Debug details</summary>
//             <div className="mt-3 space-y-2 text-left text-sm">
//               <div>phase: {phase}</div>
//               <div>sessionId: <code className="break-all">{sessionId}</code></div>
//             </div>
//           </details>
//         )}
//       </div>
//     </main>
//   )
// }

// export default function PostCheckoutClient() {
//   return (
//     <Suspense
//       fallback={
//         <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
//           <div className="max-w-md w-full bg-gray-950 border border-white/10 rounded-xl p-6 text-center">
//             <h1 className="text-2xl font-semibold mb-2">Updating Gelato…</h1>
//             <p className="text-white/80">Please hold on while we finalize your print order.</p>
//           </div>
//         </main>
//       }
//     >
//       <Inner />
//     </Suspense>
//   )
// }
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type StripeSession = {
  metadata?: Record<string, string>;
};

type Phase =
  | 'idle'
  | 'start'
  | 'fetch-session'
  | 'generate-package'
  | 'route-gelato'
  | 'done'
  | 'error';

function Inner() {
  const router = useRouter();
  const sp = useSearchParams();
  const sessionId = sp.get('session_id') || '';

  const [phase, setPhase] = useState<Phase>('idle');
  const [status, setStatus] = useState<'working' | 'error' | 'done'>('working');
  const [message, setMessage] = useState('Finalizing your order…');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!sessionId) {
        setStatus('error');
        setMessage('Missing Stripe session_id.');
        setPhase('error');
        return;
      }

      try {
        setPhase('fetch-session');
        setMessage('Confirming payment…');

        // --- 1️⃣ Fetch the Stripe session (server-side proxy) ---
        const res = await fetch(`/api/stripe/session?session_id=${sessionId}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Stripe session fetch failed: ${res.status}`);
        const session = (await res.json()) as StripeSession;
        const meta = session.metadata || {};
        const sku = meta.sku || '';
        const imageId = meta.imageId || '';
        const fileUrl = meta.fileUrl || '';

        // --- 2️⃣ Handle digital "print-at-home" products ---
        if (sku === 'print-at-home') {
          setPhase('generate-package');
          setMessage('Generating your print-at-home package…');

          const pkgRes = await fetch('/api/generate-print-package', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageId, fileUrl }),
          });

          if (!pkgRes.ok) throw new Error(`ZIP generation failed (${pkgRes.status})`);
          const blob = await pkgRes.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `spookify-print-package-${imageId || 'download'}.zip`;
          a.click();

          if (!cancelled) {
            setStatus('done');
            setPhase('done');
            setMessage('Your download has started. Check your “Downloads” folder!');
          }
          return;
        }

        // --- 3️⃣ Otherwise, route physical orders to Gelato ---
        setPhase('route-gelato');
        setMessage('Placing your print order with Gelato…');

        const gelatoRes = await fetch('/api/gelato/place-from-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!gelatoRes.ok) {
          const txt = await gelatoRes.text();
          throw new Error(`Gelato API failed: ${txt || gelatoRes.status}`);
        }

        const j = await gelatoRes.json();
        if (!j.ok) throw new Error(j.error || 'Unknown Gelato error');

        if (!cancelled) {
          const qp = new URLSearchParams({ session_id: sessionId });
          if (j.gelatoOrderId) qp.set('gelato', j.gelatoOrderId);
          router.replace(`/thank-you?${qp.toString()}`);
        }
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setPhase('error');
        setError(err instanceof Error ? err.message : String(err));
        setMessage('We hit a snag while processing your order.');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  // ---------------- UI ----------------
  if (status === 'error') {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-gray-950 border border-white/10 rounded-xl p-6 text-center">
          <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-red-400 mb-4">{error ?? message}</p>
          <button
            onClick={() => location.reload()}
            className="px-4 py-2 rounded bg-white text-black"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (status === 'done') {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-gray-950 border border-white/10 rounded-xl p-6 text-center">
          <h1 className="text-2xl font-semibold mb-2">Download ready 🎉</h1>
          <p className="text-white/80">
            Your print-at-home package has been generated and should begin downloading
            automatically. If not, check your browser’s download bar.
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white"
          >
            Back to home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-950 border border-white/10 rounded-xl p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">Please hold on…</h1>
        <p className="text-white/80">{message}</p>
      </div>
    </main>
  );
}

export default function PostCheckoutClient() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-gray-950 border border-white/10 rounded-xl p-6 text-center">
            <h1 className="text-2xl font-semibold mb-2">Please hold on…</h1>
            <p className="text-white/80">Finalizing your order…</p>
          </div>
        </main>
      }
    >
      <Inner />
    </Suspense>
  );
}
