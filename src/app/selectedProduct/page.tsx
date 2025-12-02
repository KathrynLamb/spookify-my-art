'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PRODUCT_DEFS, ProductDef, CropMode } from '@/lib/productDefs';
import { PreviewStage } from './components/PreviewStage';
import { PreviewToolbar } from './components/PreviewToolbar';
import { SummaryPanel } from './components/SummaryPanel';
import BusyOverlay from './components/BusyOverlay';

/* ---------------------------------------------------
   TYPES
--------------------------------------------------- */
type Currency = 'GBP' | 'USD' | 'EUR';

type Pricing = {
  unit: number | null;
  total: number | null;
  currency: Currency;
  incVat?: boolean;
};

type Overlays = { bleed: boolean; trim: boolean; safe: boolean };

type PayPalCreateResponse = {
  orderID?: string;
  approveUrl?: string;
  error?: string;
};

/* ---------------------------------------------------
   COMPONENT
--------------------------------------------------- */

export default function SelectedProductPage() {
  const search = useSearchParams();
  const router = useRouter();

  /* ---------------------------
     URL PARAMS
  ---------------------------- */
  const imageId = search.get('imageId') ?? '';
  const fileUrl = search.get('fileUrl') ?? '';
  const hintedProductId = search.get('productId') ?? 'cushion_18in_single';

  /* ---------------------------
     PRODUCT DEFINITION
  ---------------------------- */
  const productDef: ProductDef = useMemo(
    () => PRODUCT_DEFS[hintedProductId] ?? PRODUCT_DEFS['cushion_18in_single'],
    [hintedProductId]
  );

  /* ---------------------------
     PRODIGI HARDCODED VALUES
  ---------------------------- */
  const HARDCODED = {
    vendor: 'prodigi' as const,
    sku: 'GLOBAL-CUSH-24X24-SUE', // faux suede cushion 24x24
  };

  /* ---------------------------
     STATE
  ---------------------------- */
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'front' | 'inside' | 'back'>('front');
  const [zoom, setZoom] = useState<number>(1);
  const [cropMode, setCropMode] = useState<CropMode>(
    productDef.defaultCropMode ?? 'cover'
  );
  const [overlays, setOverlays] = useState<Overlays>({
    bleed: false,
    trim: true,
    safe: true,
  });

  /* Pricing — setter removed since unused */
  const [pricing] = useState<Pricing>({
    unit: 12,
    total: 12,
    currency: 'GBP',
    incVat: true,
  });

  /* Busy overlay */
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState('Working…');

  /* ---------------------------
     PRICE DISPLAY
  ---------------------------- */
  const priceText = useMemo(() => {
    if (pricing.total == null) return '—';
    const prefix = pricing.currency === 'GBP' ? '£' : `${pricing.currency} `;
    return `${prefix}${pricing.total.toFixed(2)}${
      pricing.incVat ? ' inc VAT' : ''
    }`;
  }, [pricing]);

  /* ---------------------------
     Reset zoom + crop on product change
  ---------------------------- */
  useEffect(() => {
    setLoading(false);
    setZoom(1);
    setCropMode(productDef.defaultCropMode ?? 'cover');
  }, [productDef.id, productDef.defaultCropMode]);

  /* ---------------------------------------------------
     ADD TO CART (PAYPAL FLOW)
  --------------------------------------------------- */
  const addToCart = async () => {
    if (!fileUrl) {
      alert('Missing artwork URL.');
      return;
    }

    try {
      setBusy(true);
      setBusyLabel('Preparing print assets…');

      /* -----------------------------------
         1) PREPARE PRINT ASSETS
      ----------------------------------- */
      const prepRes = await fetch('/api/print-assets/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: HARDCODED.sku,
          fileUrl,
          secondFileUrl: null,
        }),
      });

      if (!prepRes.ok) {
        const t = await prepRes.text().catch(() => '');
        console.error('[prepare] failed', prepRes.status, t);
        alert('Preparing print file failed.');
        setBusy(false);
        return;
      }

      const prep = await prepRes.json().catch(() => null);

      if (!prep?.ok) {
        console.error('[prepare] payload', prep);
        alert(prep?.error || 'Preparing print file failed.');
        setBusy(false);
        return;
      }

      /* -----------------------------------
         2) PAYPAL ORDER
      ----------------------------------- */
      if (pricing.total == null || !pricing.currency) {
        alert('Missing price data.');
        setBusy(false);
        return;
      }

      setBusyLabel('Creating PayPal order…');

      const paypalPayload = {
        amount: Number(pricing.total),
        currency: pricing.currency,
        title: productDef.displayName,
        imageId,
        fileUrl,

        vendor: HARDCODED.vendor,
        sku: HARDCODED.sku,

        draft: {
          prodigiSku: HARDCODED.sku,
          printSpecId: productDef.printSpecId || 'cushion.24in.single',
          assets: prep.assets ?? [],
        },
      };

      const createRes = await fetch('/api/paypal/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paypalPayload),
      });

      let created: PayPalCreateResponse | null = null;
      try {
        created = (await createRes.json()) as PayPalCreateResponse;
      } catch {
        created = null;
      }

      if (!createRes.ok || !created?.orderID || !created?.approveUrl) {
        alert(created?.error || 'Could not start checkout.');
        setBusy(false);
        return;
      }

      window.location.href = created.approveUrl;
    } catch (err) {
      console.error(err);
      alert('Something went wrong adding to cart.');
      setBusy(false);
    }
  };

  /* ---------------------------------------------------
     UI
  --------------------------------------------------- */
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold">
            Confirm your selection
          </h1>
          <p className="text-white/60 mt-1">
            This preview adapts to any product you pick from the catalog.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5">
          {/* LEFT */}
          <section className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3 min-h-[420px]">
            <div className="flex gap-1 mb-3">
              {(['front', 'inside', 'back'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-full text-xs ${
                    tab === t
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/80 hover:text-white'
                  }`}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {tab === 'front' ? (
              <>
                <PreviewStage
                  def={productDef}
                  fileUrl={fileUrl}
                  loading={loading}
                  zoom={zoom}
                  cropMode={cropMode}
                  overlays={overlays}
                />
                <PreviewToolbar
                  zoom={zoom}
                  setZoom={setZoom}
                  cropMode={cropMode}
                  setCropMode={setCropMode}
                  overlays={overlays}
                  setOverlays={setOverlays}
                />
              </>
            ) : (
              <div className="relative w-full aspect-[4/3] bg-black/40 rounded-xl border border-white/10 grid place-items-center">
                <div className="text-white/70 text-sm">
                  No inside/back for this product (yet).
                </div>
              </div>
            )}
          </section>

          {/* RIGHT */}
          <aside className="lg:sticky lg:top-4 space-y-3">
            <SummaryPanel
              productTitle={productDef.displayName}
              priceText={priceText}
              onChangeProduct={() =>
                router.push('/products?from=selectedProduct')
              }
              onAddToCart={addToCart}
              addDisabled={!fileUrl}
            >
              <div className="mt-3 text-sm text-white/80">
                Orientation: {productDef.defaultOrientation}
              </div>
            </SummaryPanel>

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

      {/* Busy Overlay */}
      <BusyOverlay show={busy} label={busyLabel} />
    </main>
  );
}
