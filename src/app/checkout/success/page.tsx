'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type CaptureResult = { ok?: boolean; error?: string };

type Currency = 'GBP' | 'USD' | 'EUR';
type Orientation = 'Vertical' | 'Horizontal';
type FrameColor = 'Black' | 'White' | 'Wood' | 'Dark wood';
type ProductKind = 'framed-poster' | 'poster' | 'print-at-home';

type GelatoOrder = {
  product: ProductKind;
  currency: Currency;
  size: string;
  orientation: Orientation;
  frameColor?: FrameColor;
  fileUrl: string;
};

function isGelatoOrder(v: unknown): v is GelatoOrder {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  const prodOk = ['framed-poster', 'poster', 'print-at-home'].includes(String(o.product));
  const curOk = ['GBP', 'USD', 'EUR'].includes(String(o.currency));
  const sizeOk = typeof o.size === 'string' && o.size.length > 0;
  const orientOk = ['Vertical', 'Horizontal'].includes(String(o.orientation));
  const fileOk = typeof o.fileUrl === 'string' && /^https?:\/\//i.test(o.fileUrl);
  const frameOk =
    o.frameColor === undefined ||
    ['Black', 'White', 'Wood', 'Dark wood'].includes(String(o.frameColor));
  return prodOk && curOk && sizeOk && orientOk && fileOk && frameOk;
}

export default function PayPalSuccessPage() {
  const search = useSearchParams();
  const router = useRouter();
  const token = search.get('token'); // PayPal returns token=orderID
  const [state, setState] = useState<'idle' | 'capturing' | 'done' | 'error'>('idle');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!token) return;
      setState('capturing');

      // read gelato payload we saved earlier
      let gelatoOrder: GelatoOrder | null = null;
      try {
        const raw = localStorage.getItem('spookify:pending-gelato');
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          // sanity check the orderID matches our token
          if (
            parsed &&
            typeof parsed === 'object' &&
            (parsed as Record<string, unknown>).orderID === token
          ) {
            const candidate = (parsed as Record<string, unknown>).gelatoOrder;
            if (isGelatoOrder(candidate)) gelatoOrder = candidate;
          }
        }
      } catch {
        // ignore localStorage/JSON errors
      }

      try {
        const res = await fetch('/api/paypal/capture', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ orderID: token, gelatoOrder }),
        });
        const j: CaptureResult = await res.json();
        if (!res.ok || !j?.ok) {
          throw new Error(j?.error || 'Capture failed');
        }

        // cleanup
        try {
          localStorage.removeItem('spookify:pending-gelato');
        } catch {}

        setState('done');
        // OPTIONAL: route to a real order-confirmation page and pass id
        // router.replace(`/post-checkout?orderId=${token}`);
      } catch (e) {
        setErr((e as Error).message || 'Capture error');
        setState('error');
      }
    };
    void run();
  }, [token, router]);

  return (
    <main className="min-h-screen bg-black text-white grid place-items-center">
      <div className="p-6 rounded-xl bg-white/5 ring-1 ring-white/10 max-w-md w-full text-center">
        {state === 'capturing' && <p>Finalizing your order…</p>}
        {state === 'done' && (
          <>
            <h1 className="text-2xl font-semibold mb-2">Thanks! 🎉</h1>
            <p className="text-white/70">
              Your payment was captured. We’ll start fulfillment shortly.
            </p>
          </>
        )}
        {state === 'error' && (
          <>
            <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-red-300">{err}</p>
          </>
        )}
      </div>
    </main>
  );
}
