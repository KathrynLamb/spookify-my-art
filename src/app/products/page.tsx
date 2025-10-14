'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CurrencyProvider, useCurrency } from '@/contexts/CurrencyContext';
import { type Currency, toMinor } from '@/lib/currency';

// Data
import { FRAMED_POSTER } from '@/lib/products/framed-poster';
import { POSTER } from '@/lib/products/poster';

// UI
import ProductCard, { type Variant as CardVariant } from '../components/product-card';

const isHttpUrl = (s: string) => /^https?:\/\//i.test(s);
const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true';

/* ---------- Types ---------- */
type ManualOrderPayload = {
  email: string;
  fileUrl: string;
  imageId: string;
  product: string;
  sizeLabel: string;
  orientation: 'Vertical' | 'Horizontal';
  frameColor?: string | null;
  currency: Currency;
};

/* ---------- Manual order modal ---------- */
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

          {draft.frameColor ? (
            <div>
              <label className="block text-xs text-white/60 mb-1">Frame color</label>
              <input
                value={draft.frameColor}
                readOnly
                className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 outline-none"
              />
            </div>
          ) : null}

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
          Heads-up: online checkout is in sandbox. We’ll invoice you and get your print moving. 💌
        </p>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
function ProductsInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const fileUrlQP = sp.get('fileUrl') || '';
  const imageId = sp.get('imageId') || '';
  const canProceed = useMemo(() => !!(fileUrlQP && imageId), [fileUrlQP, imageId]);

  const { currency, setCurrency, options } = useCurrency();

  // Design-first toggle (from query ?start=product or manual switch)
  const startParam = sp.get('start'); // if 'product', we route to upload after picking variant
  const [designFirst, setDesignFirst] = useState(startParam === 'product');

  useEffect(() => {
    if (startParam === 'product') setDesignFirst(true);
  }, [startParam]);

  // Manual order state (payments disabled path)
  const [manualOpen, setManualOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<ManualOrderPayload>({
    email: '',
    product: '',
    sizeLabel: '',
    orientation: 'Vertical',
    frameColor: null,
    fileUrl: fileUrlQP,
    imageId: imageId || '',
    currency,
  });

  useEffect(() => {
    // Keep modal currency in sync
    setDraft((d) => ({ ...d, currency }));
  }, [currency]);

  // Ensure fileUrl is public if user arrived with data: URL
  async function ensurePublicUrl(current: string, givenImageId: string): Promise<string> {
    if (isHttpUrl(current)) return current;
    const upRes = await fetch('/api/upload-spooky', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl: current, filename: `spookified-${givenImageId}.png` }),
    });
    const upJson: { url?: string; error?: string } = await upRes.json();
    if (!upRes.ok || !upJson?.url) throw new Error(upJson?.error || 'Upload failed');
    return upJson.url;
  }

  // Stripe checkout (kept; gated by env)
  async function stripeCheckout(
    productTitle: string,
    variant: CardVariant,
    titleSuffix: string,
    publicUrl: string
  ) {
    localStorage.setItem(
      'spookify:last-order',
      JSON.stringify({
        product: productTitle,
        size: titleSuffix,
        orientation: titleSuffix.includes('Horizontal') ? 'Horizontal' : 'Vertical',
        thumbUrl: publicUrl,
        shipCountry: currency === 'USD' ? 'US' : currency === 'EUR' ? 'EU' : 'GB',
        email: undefined,
        etaMinDays: 3,
        etaMaxDays: 7,
      })
    );

    const priceMajor = variant.prices[currency] ?? variant.prices.GBP ?? 0;

    const r = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileUrl: publicUrl,
        imageId,
        sku: variant.productUid,
        title: `${productTitle} – ${titleSuffix}`,
        price: toMinor(priceMajor),
        priceIsMajor: false,
        currency,
      }),
    });

    const j: { url?: string; error?: string } = await r.json();
    if (!r.ok || !j?.url) {
      alert(j?.error || 'Checkout failed');
      return;
    }
    window.location.href = j.url;
  }

  // LemonSqueezy checkout (kept; gated by env)
  function lemonSqueezyCheckout(publicUrlForDisplay?: string) {
    const lemonUrl =
      'https://spookify-my-art.lemonsqueezy.com/buy/3c829174-dc02-4428-9123-7652026e6bbf';
    localStorage.setItem(
      'spookify:last-order',
      JSON.stringify({
        product: 'Haunted Halloween Print',
        thumbUrl: publicUrlForDisplay || fileUrlQP,
        etaMinDays: 3,
        etaMaxDays: 7,
      })
    );
    window.open(lemonUrl, '_blank');
  }

  // When designFirst is ON, "Select" stores variant + image info, then routes to /upload
  async function onSelect(productTitle: string, variant: CardVariant, titleSuffix: string) {
    try {
      if (!canProceed) {
        // alert('Missing fileUrl or imageId.');
        // return;
        router.push('/upload')
      }

      const publicUrl = await ensurePublicUrl(fileUrlQP, imageId);

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
        router.push('/upload'); // go design now; upload page will read pending and show “Print” right away
        return;
      }

      if (PAYMENTS_ENABLED) {
        await stripeCheckout(productTitle, variant, titleSuffix, publicUrl);
      } else {
        // Manual order path
        setDraft({
          email: '',
          product: productTitle,
          sizeLabel: variant.sizeLabel,
          orientation: variant.orientation,
          frameColor: (variant as { frameColor?: string }).frameColor ?? null,
          fileUrl: publicUrl,
          imageId,
          currency,
        });
        setSuccessMsg(null);
        setErrorMsg(null);
        setManualOpen(true);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  // Optional explicit Lemon button from the card
  async function onSelectLemon() {
    if (!canProceed) {
      alert('Missing fileUrl or imageId.');
      return;
    }
    const publicUrl = await ensurePublicUrl(fileUrlQP, imageId);

    if (designFirst) {
      const pending = {
        productTitle: 'Haunted Halloween Print',
        variant: null as unknown as CardVariant, // stored but unused on upload
        titleSuffix: '',
        currency,
        imageId,
        fileUrl: publicUrl,
        lemon: true,
      };
      localStorage.setItem('spookify:pending-product', JSON.stringify(pending));
      router.push('/upload');
      return;
    }

    if (PAYMENTS_ENABLED) {
      lemonSqueezyCheckout(publicUrl);
    } else {
      // Manual path with Lemon button → just open manual modal too
      setDraft((d) => ({ ...d, fileUrl: publicUrl }));
      setSuccessMsg(null);
      setErrorMsg(null);
      setManualOpen(true);
    }
  }

  // Map data → card variants (typed)
  const framedVariants: CardVariant[] = FRAMED_POSTER.variants.map((v) => ({
    sizeLabel: v.sizeLabel,
    frameColor: v.frameColor,
    orientation: v.orientation,
    productUid: v.productUid,
    prices: v.prices,
  }));

  const posterVariants: CardVariant[] = POSTER.variants.map((v) => ({
    sizeLabel: v.sizeLabel,
    orientation: v.orientation,
    productUid: v.productUid,
    prices: v.prices,
  }));

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Choose your poster</h1>

          <div className="flex items-center gap-4">
            {/* Design-first toggle */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-orange-600"
                checked={designFirst}
                onChange={(e) => setDesignFirst(e.target.checked)}
              />
              <span className="text-white/80">Design first (choose product, then upload)</span>
            </label>

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

        {!PAYMENTS_ENABLED && !designFirst && (
          <div className="mb-6 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-yellow-200">
            Heads-up: online checkout is in sandbox. Hit “Select” to send us your details — we’ll
            invoice you and start printing. 💌
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProductCard
            title={FRAMED_POSTER.title}
            artSrc="/livingroom_frame_1.png"
            mockupSrc="/framedPosterGelato.png"
            variants={framedVariants}
            onSelect={(v) =>
              onSelect(
                FRAMED_POSTER.title,
                v,
                `${v.sizeLabel} – ${v.frameColor ?? ''} – ${v.orientation}`.replace(/\s–\s–/, ' –')
              )
            }
            controls={{ showFrame: true }}
            canProceed={canProceed}
          />

          <ProductCard
            title={POSTER.title}
            artSrc="/poster_costumes2.png"
            mockupSrc="/posterFromGelato.png"
            variants={posterVariants}
            onSelect={(v) => onSelect(POSTER.title, v, `${v.sizeLabel} – ${v.orientation}`)}
            onSelectLemonSqueezy={onSelectLemon}
            controls={{ showFrame: false }}
            canProceed={canProceed}
          />
        </div>

        {/* {!canProceed && (
          <p className="mt-6 text-xs text-yellow-400">
            Missing <code>fileUrl</code> or <code>imageId</code>.
          </p>
        )} */}

        <p className="mt-6 text-xs text-white/50">
          Prices shown are your retail ex-VAT. Shipping/taxes are calculated at checkout.
        </p>
      </div>

      {/* Manual order modal (only used when payments are disabled) */}
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
            const j: { ok?: boolean; error?: string } = await res.json();

            if (!res.ok || j?.error) {
              setErrorMsg(j?.error || 'Failed to send your order. Please try again.');
              setSubmitting(false);
              return;
            }

            setSuccessMsg(
              'Thanks! We’ve received your details and will be in touch shortly to complete your order.'
            );
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
