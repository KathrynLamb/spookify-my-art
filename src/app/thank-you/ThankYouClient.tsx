// src/app/thank-you/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

type SessionInfo = {
  id?: string;
  status?: string;
  created?: number;
  currency?: string;
  amount_total?: number | string;
  customer_name?: string;
  email?: string;
  title?: string;
  fileUrl?: string;
  gelatoOrderId?: string;
  shipping?: {
    name?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
};

function formatMoney(value: number | string | undefined, currency: string | undefined) {
  if (value == null) return '—';
  if (typeof value === 'string') return value;
  const cur = (currency || 'GBP').toUpperCase();
  const isMinor = value > 0 && value < 100000 && value % 1 === 0;
  const major = isMinor ? value / 100 : value;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: cur,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${major.toFixed(2)} ${cur}`;
  }
}

function fmtDate(ts?: number) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString();
}

export default function ThankYouPage() {
  const [info, setInfo] = useState<SessionInfo | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('session_id');
    if (!id) {
      setErr('Missing session id.');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/session?id=${encodeURIComponent(id)}`);
        const j = (await res.json()) as SessionInfo & { error?: string };
        if (!res.ok) throw new Error(j?.error || 'Unable to load session.');
        setInfo(j);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : 'Unable to load session.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const amountDisplay = useMemo(
    () => formatMoney(info?.amount_total, info?.currency),
    [info?.amount_total, info?.currency]
  );

  if (loading) {
    return (
      <main className="min-h-[100svh] bg-[#0B0B0E] text-white flex items-center justify-center">
        <div className="text-white/80">Fetching your order…</div>
      </main>
    );
  }

  if (err) {
    return (
      <main className="min-h-[100svh] bg-[#0B0B0E] text-white flex items-center justify-center">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
          {err}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-[#0B0B0E] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27 viewBox=%270 0 160 160%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.8%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix type=%27saturate%27 values=%270%27/%3E%3C/filter%3E%3Crect width=%27160%27 height=%27160%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")',
        }}
      />

      <div className="mx-auto max-w-5xl px-5 py-10">
        {/* Header actions */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/10 grid place-items-center text-[18px] shadow">👻</div>
            <div>
              <div className="text-xl font-semibold">Spookify My Art</div>
              <div className="text-xs text-white/60">Order confirmation & invoice</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
            >
              Print invoice
            </button>
            <a
              href="/products"
              className="rounded-md bg-[#FF6A2B] hover:bg-[#FF814E] px-3 py-2 text-sm shadow-[0_0_0_6px_rgba(255,106,43,.15)]"
            >
              Order another
            </a>
          </div>
        </div>

        {/* Card / invoice body */}
        <div className="rounded-2xl border border-white/10 bg-[#0E0E13] shadow-[0_12px_30px_rgba(0,0,0,.45)] overflow-hidden print:shadow-none print:border-0">
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#7B5CFF]/15 via-transparent to-[#FF6A2B]/15">
            <h1 className="text-2xl font-bold">Thank you — your order is on its way! 🎉</h1>
            <span
              className={`text-xs rounded-full px-2.5 py-1 border ${
                info?.status === 'paid'
                  ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                  : 'border-yellow-500/40 text-yellow-300 bg-yellow-500/10'
              }`}
            >
              {info?.status === 'paid' ? 'Paid' : info?.status || 'Created'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
            {/* Left: artwork */}
            <div className="md:col-span-2 p-6 border-b md:border-b-0 md:border-r border-white/10">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-black/40 border border-white/10">
                <Image
                  src={info?.fileUrl || '/mockups/halloween-frame-vertical.png'}
                  alt="Your spooky art"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
              </div>
              <div className="mt-3 text-xs text-white/60">Artwork preview • For reference only</div>
            </div>

            {/* Right: invoice details */}
            <div className="md:col-span-3 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <KV label="Order #" value={info?.id || '—'} />
                <KV label="Date" value={fmtDate(info?.created)} />
                <KV label="Customer" value={info?.customer_name || '—'} />
                <KV label="Email" value={info?.email || '—'} />
                <KV label="Gelato Order" value={info?.gelatoOrderId ? `#${info.gelatoOrderId}` : 'pending…'} />
              </div>

              {!!info?.shipping?.address && (
                <div className="mt-6">
                  <div className="text-sm font-semibold mb-1">Ship to</div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-white/80">
                    {info.shipping.name || '—'}
                    <div className="text-white/60">
                      {[
                        info.shipping.address?.line1,
                        info.shipping.address?.line2,
                        info.shipping.address?.city,
                        info.shipping.address?.state,
                        info.shipping.address?.postal_code,
                        info.shipping.address?.country,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <div className="text-sm font-semibold mb-2">Items</div>
                <div className="overflow-hidden rounded-lg border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-white/[0.03] text-white/70">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Description</th>
                        <th className="text-right px-3 py-2 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-white/10">
                        <td className="px-3 py-3">{info?.title || 'Spookified Wall Art'}</td>
                        <td className="px-3 py-3 text-right">{amountDisplay}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <div className="min-w-[240px]">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">Subtotal</span>
                      <span>{amountDisplay}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">Shipping & taxes</span>
                      <span>Included at checkout</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-base font-semibold">
                      <span>Total</span>
                      <span>{amountDisplay}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-xs text-white/60">
                You’ll receive email updates as your order moves through production and shipping.
                Thanks for supporting a cozy-spooky small business. 🖤
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-white/60 print:hidden">
          Need help? <a href="/support" className="underline hover:text-white">Contact support</a>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { margin: 16mm; }
          body { background: white !important; }
          main { background: white !important; color: #000 !important; }
          img, svg { break-inside: avoid; }
        }
      `}</style>
    </main>
  );
}

function KV({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[11px] uppercase tracking-wide text-white/50">{label}</div>
      <div className="mt-0.5 text-sm">{value || '—'}</div>
    </div>
  );
}
