
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

// in CheckoutClient()
  const jobId = sp.get('jobId') || '';   // <-- add this


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
        // const fileUrl = meta.fileUrl || '';

        // --- 2️⃣ Handle digital "print-at-home" products ---
        if (sku === 'print-at-home') {
          setPhase('generate-package');
          setMessage('Generating your print-at-home package…');

          const pkgRes = await fetch('/api/generate-print-package', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // body: JSON.stringify({ imageId, fileUrl }),
            body: JSON.stringify({ jobId }) 
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
