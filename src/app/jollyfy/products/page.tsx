'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CurrencyProvider, useCurrency } from '@/contexts/CurrencyContext';
import { type Currency } from '@/lib/currency';
import Image from 'next/image';
import { JOLLYFY_HOODIE } from './product-inventory/hoodies';
import { JOLLYFY_GREETING_CARD } from './product-inventory/greeting-cards';

const isHttpUrl = (s: string) => /^https?:\/\//i.test(s);

type Curr = 'GBP' | 'USD' | 'EUR';
type Prices = Record<Curr, number> & { GBP: number };
type ProductVariant = {
  sizeLabel: string;
  productUid: string;
  prices: Prices;
  color?: string | null;
};

function coercePrices(input: Partial<Record<Curr, number>> | null | undefined): Prices {
  const src: Partial<Record<Curr, number>> = input ?? {};
  return {
    GBP: src.GBP ?? 0,
    USD: src.USD ?? 0,
    EUR: src.EUR ?? 0,
  };
}

async function ensurePublicUrl(current: string, givenImageId: string): Promise<string> {
  if (isHttpUrl(current)) return current;
  const upRes = await fetch('/api/upload-original', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl: current, filename: `jollyfy-${givenImageId}.png` }),
  });
  const upJson = (await upRes.json()) as { url?: string; error?: string };
  if (!upRes.ok || !upJson?.url) throw new Error(upJson?.error || 'Upload failed');
  return upJson.url;
}

/* ---------- Page ---------- */
function ProductsInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { currency, setCurrency, options } = useCurrency();
  const fileUrlQP = sp.get('fileUrl') || '';
  const imageId = sp.get('imageId') || '';
  const canProceed = useMemo(() => !!(fileUrlQP && imageId), [fileUrlQP, imageId]);

  async function onSelect(productTitle: string, variant: ProductVariant, titleSuffix: string) {
    try {
      if (!canProceed) {
        router.push('jollyfy/design?from=jollyfy-products');
        return;
      }
      const publicUrl = await ensurePublicUrl(fileUrlQP, imageId);
      const priceMajor = variant.prices[currency] ?? variant.prices.GBP ?? 0;
      const qp = new URLSearchParams({
        fileUrl: publicUrl,
        imageId,
        title: `${productTitle} – ${titleSuffix}`,
        amount: String(priceMajor),
        currency,
        size: variant.sizeLabel,
        color: variant.color || '',
      });
      router.push(`/checkout?${qp.toString()}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  const hoodieVariants: ProductVariant[] = JOLLYFY_HOODIE.variants.map((v) => ({
    sizeLabel: v.sizeLabel,
    productUid: v.productUid,
    prices: coercePrices(v.prices),
    color: v.color ?? null,
  }));

  const cardVariants: ProductVariant[] = JOLLYFY_GREETING_CARD.variants.map((v) => ({
    sizeLabel: v.sizeLabel,
    productUid: v.productUid,
    prices: coercePrices(v.prices),
  }));

  /* ---------- Jollyfy-styled Product Card ---------- */
  const ProductCard = ({
    title,
    artSrc,
    variants,
    showColors = false,
    onSelect,
  }: {
    title: string;
    artSrc: string;
    variants: ProductVariant[];
    showColors?: boolean;
    onSelect: (v: ProductVariant, t: string) => void;
  }) => {
    const [selectedSize, setSelectedSize] = useState<ProductVariant>(variants[0]);
    const [selectedColor, setSelectedColor] = useState<ProductVariant['color']>(variants[0]?.color ?? null);
    const { currency } = useCurrency();
    const price = selectedSize.prices[currency] ?? selectedSize.prices.GBP ?? 0;

    const colorSwatches: { name: NonNullable<ProductVariant['color']>; hex: string }[] = [
      { name: 'Ash', hex: '#e0e0de' },
      { name: 'White', hex: '#ffffff' },
      { name: 'Black', hex: '#1b1b1b' },
      { name: 'Forest Green', hex: '#224b2c' },
      { name: 'Red', hex: '#b62f2f' },
      { name: 'Navy', hex: '#203044' },
    ];

    return (
      <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1">
        <div className="relative w-full h-64 bg-emerald-50">
          <Image src={artSrc} alt={title} fill priority className="object-cover" />
        </div>
        <div className="p-5 flex flex-col flex-1 justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-emerald-700 font-semibold mt-1">
              {currency} {price.toFixed(2)}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Select size</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.sizeLabel}
                    onClick={() => setSelectedSize(v)}
                    className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                      selectedSize.sizeLabel === v.sizeLabel
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-gray-300 text-gray-700 hover:border-emerald-400'
                    }`}
                  >
                    {v.sizeLabel}
                  </button>
                ))}
              </div>
            </div>

            {showColors && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Select color</p>
                <div className="flex flex-wrap gap-2">
                  {colorSwatches.map((c) => (
                    <button
                      key={c.name}
                      title={c.name}
                      style={{ backgroundColor: c.hex }}
                      onClick={() => setSelectedColor(c.name)}
                      className={`w-7 h-7 rounded-full border transition ${
                        selectedColor === c.name
                          ? 'ring-2 ring-offset-2 ring-emerald-500'
                          : 'border-gray-300 hover:scale-110'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onSelect({ ...selectedSize, color: selectedColor }, selectedSize.sizeLabel)}
            className="mt-6 w-full rounded-full bg-gradient-to-r from-emerald-600 to-green-500 text-white font-semibold py-2 shadow hover:opacity-90 transition"
          >
            Select, then Jollyfy!
          </button>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#faf8f5] text-gray-900">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-emerald-700 to-green-500 text-white py-5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">🎁 Jollyfy</h1>
          <p className="text-sm sm:text-base opacity-90">
            Turn your favourite photo into a festive keepsake!
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-emerald-900 tracking-tight">
            Choose your Jollyfy product
          </h2>

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Ship to:</label>
            <select
              className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm"
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

        <div className="mb-8 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-800">
          Checkout uses PayPal. Your image appears on the next page — complete your order there.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ProductCard
            title={JOLLYFY_HOODIE.title}
            artSrc="/mockups/hoody.png"
            variants={hoodieVariants}
            showColors
            onSelect={(v, t) => onSelect(JOLLYFY_HOODIE.title, v, t)}
          />

          <ProductCard
            title={JOLLYFY_GREETING_CARD.title}
            artSrc="/mockups/cards_pack10.png"
            variants={cardVariants}
            onSelect={(v, t) => onSelect(JOLLYFY_GREETING_CARD.title, v, t)}
          />
        </div>

        <p className="mt-10 text-xs text-gray-500 text-center">
          Prices shown exclude VAT. Shipping and taxes calculated at checkout.
        </p>
      </div>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <CurrencyProvider>
      <Suspense fallback={<div className="p-6 text-gray-700">Loading…</div>}>
        <ProductsInner />
      </Suspense>
    </CurrencyProvider>
  );
}
