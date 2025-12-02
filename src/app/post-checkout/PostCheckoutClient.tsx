'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Phase = 'idle'|'start'|'fetch-session'|'generate-package'|'route-fulfillment'|'capture-paypal'|'done'|'error';

function Inner() {
  const router = useRouter();
  const sp = useSearchParams();

  const status = sp.get('status') || '';
  const provider = sp.get('provider') || '';
  const orderID = sp.get('token') || '';               // PayPal order id
  const state = sp.get('state') || '';                 // base64url blob from create()
  const sku = sp.get('sku') || '';                     // convenience
  // optional fallbacks if you ever add them to the query:
  const fileUrl = sp.get('fileUrl') || '';

  const [phase, setPhase] = useState<Phase>('idle');
  const [msg, setMsg] = useState('Finalizing your order…');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fail = (m: string) => {
      if (cancelled) return;
      setErr(m); setPhase('error'); setMsg('We hit a snag while processing your order.');
    };
    const finish = (url?: string) => {
      if (cancelled) return;
      setPhase('done');
      setMsg('All set! Redirecting…');
      if (url) router.replace(url);
    };

    (async () => {
      if (provider !== 'paypal') {
        fail('Missing payment reference.');
        return;
      }
      if (status === 'cancelled') {
        fail('Payment was cancelled.');
        return;
      }
      if (!orderID) {
        fail('Missing PayPal order token.');
        return;
      }

      setPhase('capture-paypal'); setMsg('Confirming PayPal payment…');

      const capRes = await fetch('/api/paypal/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderID,
          state,              // 👈 forward the base64url state blob
          sku,                // 👈 explicit fallback
          fileUrl,            // 👈 explicit fallback (if you add it to query in future)
        }),
      });

      const cap = await capRes.json().catch(() => ({}));
      if (!capRes.ok || !cap?.ok) {
        fail(cap?.error || 'PayPal capture failed.');
        return;
      }

      finish('/thank-you');
    })();

    return () => { cancelled = true; };
  }, [provider, status, orderID, state, sku, fileUrl, router]);

  if (phase === 'error') {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-gray-950 border border-white/10 rounded-xl p-6 text-center">
          <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-red-400 mb-4">{err}</p>
          <button onClick={() => location.reload()} className="px-4 py-2 rounded bg-white text-black">
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-950 border border-white/10 rounded-xl p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">Please hold on…</h1>
        <p className="text-white/80">{msg}</p>
      </div>
    </main>
  );
}

export default function PostCheckoutClient() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black text-white grid place-items-center">Finalizing…</main>}>
      <Inner />
    </Suspense>
  );
}
