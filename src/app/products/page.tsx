// src/app/products/page.tsx
'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CurrencyProvider, useCurrency } from '@/contexts/CurrencyContext';
import { type Currency } from '@/lib/currency';

// Data
// import { FRAMED_POSTER } from '@/lib/products/framed-poster';
import { POSTER } from '@/lib/products/poster';

// UI
import ProductCard, { type Variant as CardVariant } from '../components/product-card';
import { FRAMED_POSTER } from '@/lib/products/index';
import ProductCardPrintAtHome from '../components/product-card-print-at-home';

const isHttpUrl = (s: string) => /^https?:\/\//i.test(s);
const PRINT_AT_HOME = {
  title: 'Print at home',
  productUid: 'print-at-home',
  prices: { GBP: 16.99, USD: 19.99, EUR: 18.99 },
};

/* ---------- Types ---------- */
type ManualOrderPayload = {
  email: string;
  fileUrl: string;
  imageId: string;
  product: string;
  sizeLabel: string;
  orientation: 'Portrait' | 'Landscape' | 'Square';
  frameColor?: string | null;
  currency: Currency;
};

// type AnyOrientation = string | null | undefined;

// function normalizeOrientation(o: AnyOrientation): "Portrait" | "Landscape" | "Square" | null {
//   if (!o) return null;
//   const s = String(o).toLowerCase();
//   if (s === "portrait" || s === "vertical") return "Portrait";
//   if (s === "landscape" || s === "horizontal") return "Landscape";
//   if (s === "square") return "Square";
//   return null;
// }

type AnyOrientation = string | null | undefined;
// type Curr = 'GBP' | 'USD' | 'EUR';

function normalizeOrientation(
  o: AnyOrientation
): 'Portrait' | 'Landscape' | 'Square' | null {
  if (!o) return null;
  const s = String(o).toLowerCase();
  if (s === 'portrait' || s === 'vertical') return 'Portrait';
  if (s === 'landscape' || s === 'horizontal') return 'Landscape';
  if (s === 'square') return 'Square';
  return null;
}
type Curr = 'GBP' | 'USD' | 'EUR';

function coercePrices(
  input: Partial<Record<Curr, number>> | null | undefined
): Record<Curr, number> & { GBP: number } {
  const src: Partial<Record<Curr, number>> = input ?? {};
  const GBP = typeof src.GBP === 'number' ? src.GBP : 0;
  const USD = typeof src.USD === 'number' ? src.USD : 0;
  const EUR = typeof src.EUR === 'number' ? src.EUR : 0;
  return { GBP, USD, EUR };
}



/* ---------- Manual order modal (optional fallback) ---------- */
function ManualOrderModal({
  open,
  onClose,
  draft,
  setDraft,
  onSubmit,
  submitting,
  successMsg,
  errorMsg,
}: {
  open: boolean;
  onClose: () => void;
  draft: ManualOrderPayload;
  setDraft: (d: ManualOrderPayload) => void;
  onSubmit: () => Promise<void>;
  submitting: boolean;
  successMsg: string | null;
  errorMsg: string | null;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-lg rounded-xl border border-white/15 bg-[#0b0b0e] p-5 text-white shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Manual order (Pay later)</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/60 mb-1">Email</label>
              <input
                type="email"
                required
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Product</label>
              <input
                value={draft.product}
                readOnly
                className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/60 mb-1">Size</label>
              <input
                value={draft.sizeLabel}
                readOnly
                className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Orientation</label>
              <input
                value={draft.orientation}
                readOnly
                className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 outline-none"
              />
            </div>
          </div>

          {!!draft.frameColor && (
            <div>
              <label className="block text-xs text-white/60 mb-1">Frame color</label>
              <input
                value={draft.frameColor}
                readOnly
                className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-white/60 mb-1">Artwork URL</label>
            <input
              value={draft.fileUrl}
              readOnly
              className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/60 mb-1">Image ID</label>
              <input
                value={draft.imageId}
                readOnly
                className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Currency</label>
              <input
                value={draft.currency}
                readOnly
                className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 outline-none"
              />
            </div>
          </div>
        </div>

        {successMsg ? (
          <p className="mt-4 text-green-400">{successMsg}</p>
        ) : errorMsg ? (
          <p className="mt-4 text-red-400">{errorMsg}</p>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded px-4 py-2 border border-white/15 bg-white/5 hover:bg-white/10"
          >
            Close
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || !/.+@.+\..+/.test(draft.email)}
            className="rounded px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-60"
          >
            {submitting ? 'Sending…' : 'Send order'}
          </button>
        </div>

        <p className="mt-3 text-xs text-white/60">
          Heads-up: if you can’t complete online, we’ll invoice you and get your print moving. 💌
        </p>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */
async function ensurePublicUrl(current: string, givenImageId: string): Promise<string> {
  if (isHttpUrl(current)) return current;
  const upRes = await fetch('/api/upload-spooky', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl: current, filename: `spookified-${givenImageId}.png` }),
  });
  const upJson = (await upRes.json()) as { url?: string; error?: string };
  if (!upRes.ok || !upJson?.url) throw new Error(upJson?.error || 'Upload failed');
  return upJson.url;
}

/* ---------- Page ---------- */
function ProductsInner() {
  const router = useRouter();
  const sp = useSearchParams();

  // Prefer query, fall back to localStorage on mount
  const qOrientation = sp.get("orientation");
  const [preferredOrientation, setPreferredOrientation] = useState<
    "Portrait" | "Landscape" | "Square" | null
  >(normalizeOrientation(qOrientation));

  useEffect(() => {
    if (preferredOrientation) return; // already from query
    try {
      const raw = localStorage.getItem("spookify:last-plan");
      if (!raw) return;
      const j = JSON.parse(raw) as { orientation?: string | null };
      const norm = normalizeOrientation(j?.orientation);
      if (norm) setPreferredOrientation(norm);
    } catch {}
  }, [preferredOrientation]);

  const fileUrlQP = sp.get('fileUrl') || '';
  const imageId = sp.get('imageId') || '';
  const canProceed = useMemo(() => !!(fileUrlQP && imageId), [fileUrlQP, imageId]);

  const { currency, setCurrency, options } = useCurrency();

  // Design-first toggle (from query ?start=product or manual switch)
  const startParam = sp.get('start'); // if 'product', route to /upload after picking variant
  const [designFirst, setDesignFirst] = useState(startParam === 'product');

  useEffect(() => {
    if (startParam === 'product') setDesignFirst(true);
  }, [startParam]);

  // Manual order state (fallback)
  const [manualOpen, setManualOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<ManualOrderPayload>({
    email: '',
    product: '',
    sizeLabel: '',
    orientation: 'Portrait',
    frameColor: null,
    fileUrl: fileUrlQP,
    imageId: imageId || '',
    currency,
  });

  useEffect(() => {
    setDraft((d) => ({ ...d, currency }));
  }, [currency]);

  // When designFirst is ON, "Select" stores variant + image info, then routes to /upload
  async function onSelect(productTitle: string, variant: CardVariant, titleSuffix: string, fromPrintAtHome: boolean) {
    try {
      if (!canProceed) {
        router.push('/upload?from=products'); // ⬅️ add this query flag
        return;
      }

      // 1) Ensure the file URL is public for PayPal thumbnail / your checkout preview
      const publicUrl = await ensurePublicUrl(fileUrlQP, imageId);

      // 2) Design-first? Store selection and head to /upload
      if (designFirst) {
        const pending = {
          productTitle,
          variant,
          titleSuffix,
          currency,
          imageId,
          fileUrl: publicUrl,
        };
        localStorage.setItem('spookify:pending-product', JSON.stringify(pending));
        router.push('/upload?from=products'); // ⬅️ add this query flag
        return;
      }

      // 3) Compute price (major units) for currency
      const priceMajor =
        variant.prices[currency] ?? variant.prices.GBP ?? 0;

      // Build a nice title for checkout
      const niceTitle =
        titleSuffix ||
        `${variant.sizeLabel}${variant.frameColor ? ` – ${variant.frameColor}` : ''} – ${variant.orientation}`;

      // 4) Route to your custom PayPal checkout page with all context
      const qp = new URLSearchParams({
        fileUrl: publicUrl,
        imageId,
        title: `${productTitle} – ${niceTitle}`,
        amount: String(priceMajor),
        currency,
        size: variant.sizeLabel,
        orientation: variant.orientation,
      });

      if (variant.frameColor) qp.set('frameColor', variant.frameColor);
      if (fromPrintAtHome) qp.set('sku', 'print-at-home');

      router.push(`/checkout?${qp.toString()}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  // Map data → card variants (typed)
// Map data → card variants (typed)
const framedVariants: CardVariant[] = FRAMED_POSTER.variants.map((v) => ({
  sizeLabel: v.sizeLabel,
  frameColor: v.frameColor,
  orientation: normalizeOrientation(v.orientation) ?? "Portrait",
  productUid: v.productUid,
  prices: coercePrices(v.prices), // <-- use coercer
}));

const posterVariants: CardVariant[] = POSTER.variants.map((v) => ({
  sizeLabel: v.sizeLabel,
  orientation: normalizeOrientation(v.orientation) ?? "Portrait",
  productUid: v.productUid,
  prices: coercePrices(v.prices), // <-- use coercer
}));


  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Choose your poster</h1>

          <div className="flex items-center gap-4">
            <div className="text-sm">
              <label className="mr-2 text-white/70">Ship to</label>
              <select
                className="bg-white/5 border border-white/10 rounded px-3 py-2"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
              >
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <div className="mb-6 rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sky-200">
          Checkout uses PayPal. Your generated image is shown on the next page; complete payment there.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProductCard
            title={FRAMED_POSTER.title}
            artSrc="/livingroom_frame_1.png"
            // mockupSrc="/framedPosterGelato.png"
            variants={framedVariants}
            onSelect={(v, titleSuffix, fromPrintAtHome) =>
              onSelect(
                FRAMED_POSTER.title,
                v,
                titleSuffix || `${v.sizeLabel} – ${v.frameColor ?? ''} – ${v.orientation}`.replace(/\s–\s–/, ' –'),
                fromPrintAtHome ?? false  // ✅ add this
              )
            }
            controls={{ showFrame: true }}
            canProceed={canProceed}
            preselectOrientation={preferredOrientation}
          />

          <ProductCard
            title={POSTER.title}
            artSrc="/poster_costumes2.png"
            // mockupSrc="/posterFromGelato.png"
            variants={posterVariants}
            onSelect={(v, titleSuffix, fromPrintAtHome) =>
              onSelect(POSTER.title, v, titleSuffix || `${v.sizeLabel} – ${v.orientation}`, fromPrintAtHome ?? false)  // ✅ add this),
              
            }
            controls={{ showFrame: false }}
            canProceed={canProceed}
            preselectOrientation={preferredOrientation}
          />
          <ProductCardPrintAtHome
            title={PRINT_AT_HOME.title}
            artSrc="/mockups/print_v3.png"
            productUid={PRINT_AT_HOME.productUid}
            prices={PRINT_AT_HOME.prices}
            canProceed={canProceed}
            defaultOrientation={preferredOrientation ?? 'Portrait'}
            onSelect={(variant, titleSuffix, fromPrintAtHome) =>
              onSelect(
                PRINT_AT_HOME.title,
                {
                  // Map aspect ratio to the shape expected by your checkout
                  sizeLabel: variant.aspectRatio,
                  orientation: variant.orientation,
                  productUid: PRINT_AT_HOME.productUid,
                  prices: PRINT_AT_HOME.prices,
                } , // CardVariant-compatible shape
                titleSuffix,
                fromPrintAtHome ?? false  // ✅ add this
              )
            }
          />
      
        </div>

        <p className="mt-6 text-xs text-white/50">
          Prices are retail ex-VAT. Shipping/taxes are calculated as part of fulfillment.
        </p>
      </div>

      {/* Manual order modal (only if you want to keep this fallback) */}
      <ManualOrderModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        draft={draft}
        setDraft={setDraft}
        onSubmit={async () => {
          try {
            setSubmitting(true);
            setSuccessMsg(null);
            setErrorMsg(null);

            if (!/.+@.+\..+/.test(draft.email)) {
              setErrorMsg('Please enter a valid email.');
              setSubmitting(false);
              return;
            }

            const res = await fetch('/api/manual-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(draft),
            });
            const j = (await res.json()) as { ok?: boolean; error?: string };

            if (!res.ok || j?.error) {
              setErrorMsg(j?.error || 'Failed to send your order. Please try again.');
              setSubmitting(false);
              return;
            }

            setSuccessMsg('Thanks! We’ll be in touch shortly to complete your order.');
          } catch (e) {
            setErrorMsg(e instanceof Error ? e.message : String(e));
          } finally {
            setSubmitting(false);
          }
        }}
        submitting={submitting}
        successMsg={successMsg}
        errorMsg={errorMsg}
      />
    </main>
  );
}

export default function ProductsPage() {
  return (
    <CurrencyProvider>
      <Suspense fallback={<div className="p-6 text-white">Loading…</div>}>
        <ProductsInner />
      </Suspense>
    </CurrencyProvider>
  );
}
