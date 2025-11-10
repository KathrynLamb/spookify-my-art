'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';

import { renderGreetingDataUrl } from '@/lib/renderGreetingClient';
import { saveGreetingToBlob } from '@/lib/saveGreeting';
import { estimateEta, type ShipMethod } from '@/lib/shippingEta';



type Currency = 'GBP'|'USD'|'EUR';

type Selection = {
  productUid: string | null;
  sizeLabel?: string | null;
  finish?: string | null;
  orientation?: 'Landscape' | 'Portrait' | 'Square' | null;
  packSize?: number | null; // e.g. 10 cards per pack
};

type Pricing = {
  unit: number | null;   // price per pack
  total: number | null;  // unit * packCount
  currency: Currency;
  incVat?: boolean;
};

type Proof = {
  zoom: number; // 1 = fit (display only)
  overlays: { bleed: boolean; trim: boolean; safe: boolean };
  dpi?: number | null;
  cropMode: 'cover' | 'contain';
};

type Greeting = {
  text: string;
  pngUrl?: string | null;
  status: 'idle'|'loading'|'ok'|'error';
  error?: string | null;
};


type Shipping = {
  country: 'UK' | 'US' | 'EU' | 'Canada';
  method: ShipMethod;
  etaDate?: string | null; // ISO string
  cutoffMs?: number | null;
};



export default function SelectedProductPage() {
  const search = useSearchParams();
  const router = useRouter();

  // from upload step
  const imageId = search.get('imageId') ?? '';
  const fileUrl  = search.get('fileUrl') ?? '';
  const hintedProductId = search.get('productId'); // optional
  const orientation = (search.get('orientation') as Selection['orientation']) ?? null;

  // ---- core page state
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<Selection>({
    productUid: hintedProductId ?? null,
    orientation: orientation ?? null,
    sizeLabel: null,
    finish: null,
    packSize: null,
  });

  // packs & pricing (A6 cards example: £12 per 10)
  const [packCount, setPackCount] = useState<number>(1); // number of packs, not cards
  const [pricing, setPricing] = useState<Pricing>({
    unit: null, // per-pack
    total: null,
    currency: 'GBP',
    incVat: true,
  });

  const [proof, setProof] = useState<Proof>({
    zoom: 1,
    overlays: { bleed: false, trim: true, safe: true },
    dpi: null,
    cropMode: 'cover',
  });

  const [tab, setTab] = useState<'front'|'inside'|'back'>('front');
  const [greeting, setGreeting] = useState<Greeting>({ text: '', status: 'idle' });
  const [shipping, setShipping] = useState<Shipping>({ country: 'UK', method: 'Standard' });


  useEffect(() => {
    const d = estimateEta(shipping.country, shipping.method);
    setShipping(s => ({ ...s, etaDate: d.toISOString() }));
  }, [shipping.country, shipping.method]);
  

  // ---- fake fetch (replace with real product lookup)
  useEffect(() => {
    let didCancel = false;
    (async () => {
      setLoading(true);
      try {
        const auto = hintedProductId ?? (orientation === 'Landscape'
          ? 'cards_landscape_a6_matte'
          : orientation === 'Portrait'
          ? 'cards_portrait_a6_matte'
          : 'cards_square_148_matte');

        if (!didCancel) {
          setSelection(s => ({
            ...s,
            productUid: auto,
            sizeLabel: 'A6',
            finish: 'Matte',
            packSize: 10,
          }));

          // stub pricing (per PACK)
          setPricing(p => ({
            ...p,
            unit: 12.0,   // £12 per pack of 10
            total: 12.0,  // default 1 pack
            currency: 'GBP',
          }));
        }
      } finally {
        if (!didCancel) setLoading(false);
      }
    })();
    return () => { didCancel = true; };
  }, [hintedProductId, orientation]);

  // recompute total when pack count changes
  useEffect(() => {
    setPricing(p => ({
      ...p,
      total: p.unit != null ? +(p.unit * packCount).toFixed(2) : null,
    }));
  }, [packCount]);

  // ---- derived helpers
  const hasProduct = !!selection.productUid;
  const priceText = useMemo(() => {
    if (pricing.total == null) return '—';
    const v = pricing.total.toFixed(2);
    const prefix = pricing.currency === 'GBP' ? '£' : `${pricing.currency} `;
    return `${prefix}${v}${pricing.incVat ? ' inc VAT' : ''}`;
  }, [pricing]);

  const cardsTotal = useMemo(() => {
    const packSize = selection.packSize ?? 10;
    return packCount * packSize;
  }, [packCount, selection.packSize]);

  const changeProduct = () => {
    router.push('/products?from=selectedProduct');
  };

  const addToCart = () => {
    if (!hasProduct) return;
    const payload = {
      imageId,
      fileUrl,
      productUid: selection.productUid,
      sizeLabel: selection.sizeLabel,
      finish: selection.finish,
      orientation: selection.orientation,
      packSize: selection.packSize,
      packCount,
      cardsTotal,
      greetingText: greeting.text,
      greetingPngUrl: greeting.pngUrl ?? null,
      priceTotal: pricing.total,
      currency: pricing.currency,
    };
    try { localStorage.setItem('cart:last', JSON.stringify(payload)); } catch {}
    alert('Added to cart (stub)');
    // router.push('/checkout'); // enable when your checkout route is ready
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold">Confirm your selection</h1>
          <p className="text-white/60 mt-1">
            We’ve preselected a product based on your image and orientation. You can change it anytime.
          </p>
        </header>

        {/* 2-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5">
          {/* LEFT: Preview panel */}
          <section className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3 min-h-[420px]">
            {/* Tabs (Front / Inside / Back) */}
            <div className="flex gap-1 mb-3">
              {(['front','inside','back'] as const).map((t) => (
                <button
                  key={t}
                  onClick={()=>setTab(t)}
                  className={`px-3 py-1.5 rounded-full text-xs ${
                    tab===t ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:text-white'
                  }`}
                >
                  {t[0].toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>

            {/* FRONT */}
            {tab === 'front' && (
              <>
                <div className="relative aspect-[4/3] rounded-xl bg-[#0f0f11] ring-1 ring-white/10 overflow-hidden">
                  {loading ? (
                    <div className="absolute inset-0 animate-pulse grid place-items-center text-white/40">
                      Loading product…
                    </div>
                  ) : fileUrl ? (
                    <>
                      <Image
                        src={fileUrl}
                        alt="Your artwork"
                        fill
                        className="object-contain"
                        sizes="(max-width:1024px) 100vw, 60vw"
                      />
                      {/* Overlays */}
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Bleed (outer) */}
                        {proof.overlays.bleed && (
                          <div
                            className="absolute inset-0 rounded-[6px]"
                            style={{ outline: '2px solid rgba(244,63,94,.5)', outlineOffset: '-2px' }}
                          />
                        )}
                        {/* Trim (final cut) */}
                        {proof.overlays.trim && (
                          <div
                            className="absolute rounded-[4px]"
                            style={{
                              inset: '3%',
                              outline: '2px solid rgba(255,255,255,.55)',
                              outlineOffset: '-2px',
                            }}
                          />
                        )}
                        {/* Safe (text keep-in) */}
                        {proof.overlays.safe && (
                          <div
                            className="absolute rounded-[2px]"
                            style={{
                              inset: '6%',
                              outline: '2px solid rgba(16,185,129,.6)',
                              outlineOffset: '-2px',
                            }}
                          />
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-white/40">
                      Missing artwork URL
                    </div>
                  )}
                </div>

                {/* Preview toolbar (zoom + overlays) */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <div className="inline-flex items-center gap-1">
                    <span className="opacity-70">Zoom</span>
                    <button
                      className="px-2 py-1 rounded bg-white/10"
                      onClick={() => setProof(p => ({ ...p, zoom: Math.max(0.5, +(p.zoom - 0.25).toFixed(2)) }))}
                    >-</button>
                    <span className="w-10 text-center">{Math.round(proof.zoom * 100)}%</span>
                    <button
                      className="px-2 py-1 rounded bg-white/10"
                      onClick={() => setProof(p => ({ ...p, zoom: Math.min(2, +(p.zoom + 0.25).toFixed(2)) }))}
                    >+</button>
                  </div>
                  <div className="h-4 w-px bg-white/15" />
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      className="accent-white"
                      checked={proof.overlays.trim}
                      onChange={(e) => setProof(p => ({ ...p, overlays: { ...p.overlays, trim: e.target.checked } }))}
                    />
                    Trim
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      className="accent-white"
                      checked={proof.overlays.safe}
                      onChange={(e) => setProof(p => ({ ...p, overlays: { ...p.overlays, safe: e.target.checked } }))}
                    />
                    Safe
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      className="accent-white"
                      checked={proof.overlays.bleed}
                      onChange={(e) => setProof(p => ({ ...p, overlays: { ...p.overlays, bleed: e.target.checked } }))}
                    />
                    Bleed
                  </label>
                </div>
              </>
            )}

            {/* INSIDE */}
            {tab === 'inside' && (
              <div className="grid gap-3 md:grid-cols-[1fr,320px]">
                <div className="relative w-full aspect-[4/3] bg-black/50 rounded-xl border border-white/10 overflow-hidden grid place-items-center">
                  {/* If we have a rendered PNG, show it; else show text placeholder */}
                  {greeting.pngUrl ? (
                    <Image
                      src={greeting.pngUrl}
                      alt="Greeting preview"
                      fill
                      className="object-contain"
                      sizes="(max-width:1024px) 100vw, 60vw"
                    />
                  ) : (
                    <div className="absolute inset-0 p-[8%] flex items-center justify-center">
                      <div className="max-w-[84%] text-center">
                        <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
                          {greeting.text || 'Your greeting will preview here.'}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-[8%] pointer-events-none rounded-md" style={{ outline: '1px dashed rgba(255,255,255,.35)' }} />
                </div>


                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-white/60 mb-1">Your message</div>
                  <textarea
                    value={greeting.text}
                    onChange={(e)=>setGreeting(g => ({ ...g, text: e.target.value }))}
                    rows={8}
                    className="w-full rounded-lg bg-black/40 ring-1 ring-white/15 p-3 text-sm"
                    placeholder="Write your greeting…"
                  />
                  <button
                      onClick={async () => {
                        if (!greeting.text.trim()) return;
                        // match the visible aspect; use a decent export size so it prints crisply
                        const dataUrl = await renderGreetingDataUrl(greeting.text, { w: 2400, h: 1800 });
                        setGreeting(g => ({ ...g, pngUrl: dataUrl, status: 'ok' }));
                      }}
                      className="mt-2 w-full rounded-lg bg-white text-black py-2 text-sm font-medium"
                    >
                      Apply to inside
                  </button>

                  <button
                      onClick={async () => {
                        if (!greeting.pngUrl) return;
                        setGreeting(g => ({ ...g, status: 'loading', error: null })); // 👈 remove "as any"
                        try {
                          const url = await saveGreetingToBlob(greeting.pngUrl, imageId || undefined);
                          setGreeting(g => ({ ...g, pngUrl: url, status: 'ok' }));
                        } catch (e) {
                          setGreeting(g => ({
                            ...g,
                            status: 'error',
                            error: e instanceof Error ? e.message : String(e),
                          }));
                        }
                      }}
                      className="mt-2 w-full rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 py-2 text-sm"
                      disabled={!greeting.pngUrl || greeting.status === 'loading'}
                    >
                      {greeting.status === 'loading' ? 'Saving…' : 'Save greeting PNG to cloud'}
                    </button>

                    {greeting.status === 'error' ? (
                      <p className="mt-1 text-xs text-red-300">Failed: {greeting.error}</p>
                    ) : null}


                  <p className="mt-2 text-[11px] text-white/50">
                    We’ll center it on the inside-right page with generous margins.
                  </p>
                </div>
              </div>
            )}

            {/* BACK */}
            {tab === 'back' && (
              <div className="relative w-full aspect-[4/3] bg-black/40 rounded-xl border border-white/10 grid place-items-center">
                <div className="text-white/70 text-sm">Back preview (tiny maker mark or QR optional)</div>
              </div>
            )}
          </section>

          {/* RIGHT: Summary / actions (sticky) */}
          <aside className="lg:sticky lg:top-4 space-y-3">
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-white/60">Chosen product</div>
              <div className="mt-1 text-lg font-semibold">
                {selection.productUid ? selection.productUid.replaceAll('_',' ') : '—'}
              </div>
              <div className="mt-1 text-white/75 text-sm">
                {selection.sizeLabel ?? '—'} • {selection.finish ?? '—'} • {selection.orientation ?? '—'}
              </div>

              {/* Quantity (packs) */}
              <div className="mt-3">
                <div className="text-xs text-white/60 mb-1">Quantity</div>
                <div className="inline-flex rounded-full bg-white/10 p-1 ring-1 ring-white/15">
                  {[1,2,3,5].map(n=>(
                    <button
                      key={n}
                      onClick={()=>setPackCount(n)}
                      className={`px-3 py-1.5 rounded-full text-xs ${packCount===n ? 'bg-white text-black' : 'text-white/80 hover:text-white'}`}
                    >
                      {n * (selection.packSize ?? 10)} cards
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-white/50 mt-1">
                  {packCount} {packCount>1?'packs':'pack'} × {(selection.packSize ?? 10)} = {cardsTotal} cards
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  className="text-sm rounded-full border border-white/15 bg-white/5 px-3 py-1.5 hover:bg-white/10"
                  onClick={changeProduct}
                >
                  Change product
                </button>
                <div className="text-base font-semibold">{priceText}</div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={addToCart}
                  disabled={!selection.productUid}
                  className="flex-1 rounded-full bg-white text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Looks good → Add to cart
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/70">
                <span className="rounded-full border border-white/15 px-2 py-0.5">FSC papers</span>
                <span className="rounded-full border border-white/15 px-2 py-0.5">Archival inks</span>
                <span className="rounded-full border border-white/15 px-2 py-0.5">Made locally</span>
                <span className="rounded-full border border-white/15 px-2 py-0.5">Love-it guarantee</span>
              </div>
            </div>

            {/* Shipping */}
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
                  <div className="text-sm font-medium mb-2">Shipping</div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="block text-xs text-white/70 mb-1">Country</label>
                      <select
                        value={shipping.country}
                        onChange={(e) => setShipping(s => ({ ...s, country: e.target.value as Shipping['country'] }))}
                        className="w-full bg-black/40 border border-white/15 rounded px-2 py-1 text-sm"
                      >
                        <option value="UK">UK</option>
                        <option value="US">US</option>
                        <option value="EU">EU</option>
                        <option value="Canada">Canada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-white/70 mb-1">Method</label>
                      <select
                        value={shipping.method}
                        onChange={(e) => setShipping(s => ({ ...s, method: e.target.value as ShipMethod }))}
                        className="w-full bg-black/40 border border-white/15 rounded px-2 py-1 text-sm"
                      >
                        <option>Standard</option>
                        <option>Tracked</option>
                        <option>Express</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-xs text-white/80">
                    ETA:&nbsp;
                    {shipping.etaDate
                      ? new Date(shipping.etaDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                      : '—'}
                    <span className="text-white/50"> · estimate</span>
                  </div>
                </div>


            {/* Pre-flight */}
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
              <div className="text-sm font-medium mb-1">Pre-flight check</div>
              <ul className="text-xs text-white/70 list-disc pl-4">
                <li>Safe areas visible</li>
                <li>Orientation correct</li>
                <li>Spelling checked</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
