'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

// ----- Framed product (from your canonical data) -----
import {
  type Orientation,
  type FrameColor,
  type FramedPosterProduct,
  FRAMED_POSTER,
} from '@/lib/products/framed-poster'

// ----- Poster product (from lib) -----
import {
  type PosterProduct,
  type PosterVariant,
  POSTER,
} from '@/lib/products/poster'

// ----- Utils -----
const isHttpUrl = (s: string) => /^https?:\/\//i.test(s)
const toMinor = (n: number) => Math.round(n * 100)

// ----- Currency toggle -----
type Currency = 'GBP' | 'USD' | 'EUR'
const CURRENCIES: { id: Currency; label: string; symbol: string }[] = [
  { id: 'GBP', label: 'United Kingdom (GBP)', symbol: '£' },
  { id: 'USD', label: 'United States (USD)', symbol: '$' },
  { id: 'EUR', label: 'European Union (EUR)', symbol: '€' },
]
const symOf = (c: Currency) => CURRENCIES.find(x => x.id === c)?.symbol ?? '£'

// ---------- Helpers over your framed data ----------
function availableFrameColors(
  product: FramedPosterProduct,
  sizeLabel: string,
  orientation: Orientation,
): FrameColor[] {
  const set = new Set<FrameColor>()
  for (const v of product.variants) {
    if (v.sizeLabel === sizeLabel && v.orientation === orientation) {
      set.add(v.frameColor)
    }
  }
  return [...(set.size ? set : new Set(product.frameColors))]
}

function findFramedVariant(
  product: FramedPosterProduct,
  sizeLabel: string,
  orientation: Orientation,
  frameColor: FrameColor,
) {
  return product.variants.find(
    v =>
      v.sizeLabel === sizeLabel &&
      v.orientation === orientation &&
      v.frameColor === frameColor,
  )
}

function findPosterVariant(
  product: PosterProduct,
  sizeLabel: string,
  orientation: Orientation,
): PosterVariant | undefined {
  return product.variants.find(
    v => v.sizeLabel === sizeLabel && v.orientation === orientation,
  )
}

// ---------- Page wrapper ----------
export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading…</div>}>
      <ProductsPageInner />
    </Suspense>
  )
}

// ---------- Main ----------
function ProductsPageInner() {
  const sp = useSearchParams()
  const fileUrlQP = sp.get('fileUrl') || ''
  const imageId = sp.get('imageId') || ''
  const canProceed = useMemo(() => !!(fileUrlQP && imageId), [fileUrlQP, imageId])

  // Currency toggle
  const [currency, setCurrency] = useState<Currency>('GBP')
  const sym = symOf(currency)

  // Framed selections
  const [framedSize, setFramedSize] = useState(FRAMED_POSTER.sizes[0])
  const [framedOrientation, setFramedOrientation] = useState<Orientation>('Vertical')
  const [framedColor, setFramedColor] = useState<FrameColor>('Black')

  // Keep frame color valid when size/orientation changes
  const framedColorOptions = useMemo(
    () => availableFrameColors(FRAMED_POSTER, framedSize, framedOrientation),
    [framedSize, framedOrientation],
  )
  useEffect(() => {
    if (!framedColorOptions.includes(framedColor)) {
      setFramedColor(framedColorOptions[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [framedSize, framedOrientation, framedColorOptions.join('|')])

  const framedChosen = findFramedVariant(
    FRAMED_POSTER,
    framedSize,
    framedOrientation,
    framedColor,
  )

  // Poster selections
  const [posterSize, setPosterSize] = useState(POSTER.sizes[0])
  const [posterOrientation, setPosterOrientation] = useState<Orientation>('Vertical')
  const posterChosen = findPosterVariant(POSTER, posterSize, posterOrientation)

  async function checkoutWithVariant(
    product: { title: string },
    variant: { productUid: string; prices: Partial<Record<Currency, number>> },
    titleSuffix: string,
  ) {
    try {
      if (!imageId) throw new Error('Missing imageId')
      let fileUrl = fileUrlQP
      if (!fileUrl) throw new Error('Missing fileUrl')

      // If the art is a data: URL, upload to get a public URL for Gelato
      if (!isHttpUrl(fileUrl)) {
        const upRes = await fetch('/api/upload-spooky', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl: fileUrl, filename: `spookified-${imageId}.png` }),
        })
        const upJson: { url?: string; error?: string } = await upRes.json()
        if (!upRes.ok || !upJson?.url) throw new Error(upJson?.error || 'Upload failed')
        fileUrl = upJson.url
      }

      const priceMajor = (variant.prices[currency] ?? variant.prices.GBP ?? 0)

      const chkRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl,
          imageId,
          sku: variant.productUid, // becomes metadata.sku in Stripe; webhook uses it for Gelato
          title: `${product.title} – ${titleSuffix}`,
          price: toMinor(priceMajor),
          currency, // your checkout route uses this
        }),
      })
      const chkJson: { url?: string; error?: string } = await chkRes.json()
      if (!chkRes.ok || !chkJson?.url) throw new Error(chkJson?.error || 'Checkout failed')
      window.location.href = chkJson.url
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
      console.error(err)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header + Location/Currency */}
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Choose your poster</h1>
            {!canProceed && (
              <p className="mt-2 text-yellow-300">
                Missing <code>fileUrl</code> or <code>imageId</code>.
              </p>
            )}
          </div>

          <div className="text-sm">
            <label className="mr-2 text-white/70">Ship to</label>
            <select
              className="bg-white/5 border border-white/10 rounded px-3 py-2"
              value={currency}
              onChange={e => setCurrency(e.target.value as Currency)}
            >
              {CURRENCIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ---------- Framed Poster ---------- */}
          <div className="rounded-2xl bg-[#0e0e11] border border-white/10 overflow-hidden shadow-lg">
            <div className="relative aspect-[16/9]">
              {/* User art (beneath) */}
              <Image
                src={fileUrlQP || '/mockups/halloween-frame-vertical.png'}
                alt=""
                fill
                className="object-cover opacity-95"
                sizes="(min-width: 1024px) 50vw, 100vw"
                // If remote domain isn't in next.config or it's a data: URL, skip optimization
                unoptimized={!isHttpUrl(fileUrlQP)}
                priority={false}
              />
              {/* Frame overlay */}
              <Image
                src="/mockups/halloween-frame-vertical.png"
                alt=""
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority={false}
              />
            </div>

            <div className="p-4 space-y-3">
              <div className="font-semibold text-lg">{FRAMED_POSTER.title}</div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Size */}
                <label className="text-sm">
                  <div className="mb-1 text-white/70">Size</div>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2"
                    value={framedSize}
                    onChange={e => setFramedSize(e.target.value)}
                  >
                    {FRAMED_POSTER.sizes.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>

                {/* Frame color (computed from data) */}
                <label className="text-sm">
                  <div className="mb-1 text-white/70">Frame</div>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2"
                    value={framedColor}
                    onChange={e => setFramedColor(e.target.value as FrameColor)}
                  >
                    {framedColorOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>

                {/* Orientation */}
                <label className="text-sm">
                  <div className="mb-1 text-white/70">Orientation</div>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2"
                    value={framedOrientation}
                    onChange={e => setFramedOrientation(e.target.value as Orientation)}
                  >
                    {FRAMED_POSTER.orientations.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Price + CTA */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-white/80">
                  {framedChosen
                    ? `${sym}${(framedChosen.prices[currency] ?? framedChosen.prices.GBP ?? 0).toFixed(2)}`
                    : <span className="text-white/50">Unavailable</span>}
                </div>
                <button
                  disabled={!framedChosen || !canProceed}
                  onClick={() =>
                    framedChosen &&
                    checkoutWithVariant(
                      { title: FRAMED_POSTER.title },
                      framedChosen,
                      `${framedSize} – ${framedColor} – ${framedOrientation}`,
                    )
                  }
                  className="inline-flex items-center rounded-full bg-orange-600 hover:bg-orange-500 px-4 py-2 text-sm disabled:opacity-50"
                >
                  Select
                </button>
              </div>
            </div>
          </div>

          {/* ---------- Matte Poster (from lib POSTER) ---------- */}
          <div className="rounded-2xl bg-[#0e0e11] border border-white/10 overflow-hidden shadow-lg">
            <div className="relative aspect-[16/9]">
              <Image
                src={fileUrlQP || '/mockups/halloween-frame-vertical.png'}
                alt=""
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
                unoptimized={!isHttpUrl(fileUrlQP)}
                priority={false}
              />
            </div>

            <div className="p-4 space-y-3">
              <div className="font-semibold text-lg">{POSTER.title}</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm">
                  <div className="mb-1 text-white/70">Size</div>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2"
                    value={posterSize}
                    onChange={e => setPosterSize(e.target.value)}
                  >
                    {POSTER.sizes.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm">
                  <div className="mb-1 text-white/70">Orientation</div>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2"
                    value={posterOrientation}
                    onChange={e => setPosterOrientation(e.target.value as Orientation)}
                  >
                    {POSTER.orientations.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-white/80">
                  {posterChosen
                    ? `${sym}${(posterChosen.prices[currency] ?? posterChosen.prices.GBP ?? 0).toFixed(2)}`
                    : <span className="text-white/50">Unavailable</span>}
                </div>
                <button
                  disabled={!posterChosen || !canProceed}
                  onClick={() =>
                    posterChosen &&
                    checkoutWithVariant(
                      { title: POSTER.title },
                      posterChosen,
                      `${posterSize} – ${posterOrientation}`,
                    )
                  }
                  className="inline-flex items-center rounded-full bg-orange-600 hover:bg-orange-500 px-4 py-2 text-sm disabled:opacity-50"
                >
                  Select
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-white/50">
          Prices shown are your retail ex-VAT. Shipping/taxes are calculated at checkout.
        </p>
      </div>
    </main>
  )
}
