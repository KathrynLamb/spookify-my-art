'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? 'test';
const PAYPAL_FALLBACK_LINK = 'https://www.paypal.com/ncp/payment/2GLZRSAPB83GY';

type PayPalButtonsRender = { render: (sel: string | HTMLElement) => void; close?: () => void };
type PayPalButtonsOptions = {
  style?: Record<string, unknown>;
  createOrder?: () => Promise<string> | string;
  onApprove?: (data: { orderID: string }) => void | Promise<void>;
  onError?: (err: unknown) => void;
};
type PayPalSDK = { Buttons: (opts: PayPalButtonsOptions) => PayPalButtonsRender };

const fmt = (n: number, c: string) => {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: c }).format(n); }
  catch { return `${n.toFixed(2)} ${c}`; }
};

export default function CheckoutClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const fileUrl = sp.get('fileUrl') || '';
  const imageId = sp.get('imageId') || '';
  const title = sp.get('title') || 'Custom Printed Wall Art';
  const currency = (sp.get('currency') || 'GBP').toUpperCase();
  const amountStr = sp.get('amount') || '0';
  const amount = useMemo(() => Math.max(0, Number(amountStr) || 0), [amountStr]);

  const size = sp.get('size') || '';
  const orientation = sp.get('orientation') || '';
  const frameColor = sp.get('frameColor') || '';

  const [sdkReady, setSdkReady] = useState(false);
  const [sdkErr, setSdkErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);
  const missing = !fileUrl || !imageId || !amount || !currency;

  // Load PayPal SDK
  useEffect(() => {
    if (missing) return;
    const anyWin = window as unknown as { paypal?: PayPalSDK };
    if (anyWin.paypal) { setSdkReady(true); return; }
    const id = 'paypal-sdk';
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id;
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(CLIENT_ID)}&currency=${encodeURIComponent(currency)}&components=buttons`;
    s.async = true;
    s.onload = () => setSdkReady(true);
    s.onerror = () => { setSdkErr('Failed to load PayPal SDK (network/adblock/CSP).'); setSdkReady(false); };
    document.head.appendChild(s);
  }, [currency, missing]);

  // Render buttons
  useEffect(() => {
    if (!sdkReady || sdkErr || missing || !btnRef.current) return;
    const anyWin = window as unknown as { paypal?: PayPalSDK };
    if (!anyWin.paypal?.Buttons) return;

    const buttons = anyWin.paypal.Buttons({
      style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
      createOrder: () =>
        fetch('/api/paypal/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currency, title, imageId, fileUrl, size, orientation, frameColor }),
        }).then(async (r) => {
          const j: { orderID?: string; error?: string } = await r.json();
          if (!r.ok || !j?.orderID) throw new Error(j?.error || 'Unable to create PayPal order');
          return j.orderID!;
        }),
      onApprove: async (data: { orderID: string }) => {
        setBusy(true);
        try {
          const r = await fetch('/api/paypal/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderID: data.orderID, imageId, fileUrl }),
          });
          const j: { error?: string } = await r.json();
          if (!r.ok) throw new Error(j?.error || 'Capture failed');
          const qp = new URLSearchParams({ orderId: data.orderID, imageId, fileUrl, amount: String(amount), currency, title });
          router.replace(`/thank-you?${qp.toString()}`);
        } catch (e) {
          setSdkErr(e instanceof Error ? e.message : String(e));
        } finally {
          setBusy(false);
        }
      },
      onError: (err: unknown) => setSdkErr(err instanceof Error ? err.message : 'PayPal error'),
    });

    buttons.render(btnRef.current);
    return () => { try { buttons?.close?.(); } catch {} };
  }, [sdkReady, sdkErr, missing, amount, currency, title, imageId, fileUrl, size, orientation, frameColor, router]);

  return (
    <div className="mx-auto w-full px-3 sm:px-4 py-4 md:py-8" style={{ maxWidth: 980 }}>
      {/* Mobile: 1 column, Payment FIRST.  Desktop: 2 columns. */}
      <div className="
          grid gap-4 sm:gap-6 md:gap-8
          grid-cols-1 md:[grid-template-columns:minmax(320px,1fr)_380px]
        ">
        {/* RIGHT rail becomes FIRST on mobile */}
        <aside className="order-1 md:order-2 md:sticky md:top-4 h-max">
          <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
            <div className="mb-2 text-sm font-semibold">Complete payment</div>

            {missing ? (
              <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200 text-sm">
                Missing checkout info. Go back and pick a product again.
              </div>
            ) : !sdkErr ? (
              <>
                {!sdkReady ? (
                  <div className="mb-3 rounded border border-white/10 bg-white/5 p-3 text-white/80 text-sm">
                    Loading PayPal… If this never loads, disable ad-blockers or allow third-party scripts.
                  </div>
                ) : null}
                {/* keep some height to avoid layout jump */}
                <div ref={btnRef} className={`min-h-[52px] ${busy ? 'opacity-60 pointer-events-none' : ''}`} />
              </>
            ) : (
              <div className="space-y-3">
                <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-red-200 text-sm">
                  {sdkErr}
                  <div className="mt-1 text-[11px]">Tip: DevTools → Network → check <code>paypal.com/sdk/js</code>.</div>
                </div>
                <a
                  href={PAYPAL_FALLBACK_LINK}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex w-full items-center justify-center rounded bg-[#FF6A2B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#FF814E]"
                >
                  Pay with PayPal (fallback)
                </a>
              </div>
            )}
          </div>
        </aside>

        {/* LEFT content becomes SECOND on mobile */}
        <section className="order-2 md:order-1 flex flex-col">
          <div
            className="
              relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/5
              h-[42vh] sm:h-[52vh] md:[height:min(62vh,720px)]
            "
            style={{ height: undefined }} // allow Tailwind heights above to control
          >
            {fileUrl ? (
              <Image
                src={fileUrl}
                alt="Your artwork"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 60vw, 50vw"
                className="object-contain"
                priority
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-white/60">No image</div>
            )}
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold">{title}</div>
                <div className="mt-0.5 text-sm text-white/70 truncate">
                  {size || '—'}{orientation ? ` • ${orientation}` : ''}{frameColor ? ` • ${frameColor} Frame` : ''}
                </div>
              </div>
              <div className="shrink-0 text-base font-semibold">{fmt(amount, currency)}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
