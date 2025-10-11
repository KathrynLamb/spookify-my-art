'use client'

import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
// import ProductCard, { type Variant as CardVariant } from '@/components/product-card'
import { CurrencyProvider, useCurrency } from '@/contexts/CurrencyContext'
import { type Currency, toMinor } from '@/lib/currency'

// Data
import { FRAMED_POSTER } from '@/lib/products/framed-poster'
import { POSTER } from '@/lib/products/poster'
import ProductCard, { type Variant as CardVariant } from '../components/product-card'

const isHttpUrl = (s: string) => /^https?:\/\//i.test(s)

function ProductsInner() {
  const sp = useSearchParams()
  const fileUrlQP = sp.get('fileUrl') || ''
  const imageId = sp.get('imageId') || ''
  const canProceed = useMemo(() => !!(fileUrlQP && imageId), [fileUrlQP, imageId])
  const { currency, setCurrency, options } = useCurrency()

  async function checkout(productTitle: string, variant: CardVariant, titleSuffix: string) {
    if (!canProceed) {
      alert('Missing fileUrl or imageId.')
      return
    }
    let fileUrl = fileUrlQP

    if (!isHttpUrl(fileUrl)) {
      const upRes = await fetch('/api/upload-spooky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: fileUrl, filename: `spookified-${imageId}.png` }),
      })
      const upJson: { url?: string; error?: string } = await upRes.json()
      if (!upRes.ok || !upJson?.url) {
        alert(upJson?.error || 'Upload failed')
        return
      }
      fileUrl = upJson.url
    }

    // BEFORE redirecting to Stripe…
    localStorage.setItem('spookify:last-order', JSON.stringify({
      product: productTitle,
      size: titleSuffix,
      orientation: titleSuffix.includes('Horizontal') ? 'Horizontal' : 'Vertical',
      thumbUrl: fileUrl,                  // <-- this is what Thank You will show
      // optional niceties if you have them:
      shipCountry: (currency === 'USD' ? 'US' : currency === 'EUR' ? 'EU' : 'GB'),
      email: undefined,
      etaMinDays: 3,
      etaMaxDays: 7,
    }));

    const priceMajor = variant.prices[currency] ?? variant.prices.GBP ?? 0

    const r = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({

        fileUrl,           // public URL (or upload first if you have a data: URL)
        imageId,           // your image id
        sku: variant.productUid,
        title: `${productTitle} – ${titleSuffix}`,
        price: toMinor(priceMajor),    // you’re already doing this
        priceIsMajor: false,           // (optional) default false since you’re already passing minor
        currency,   
      }),
    })
    const j = await r.json()
    if (!r.ok || !j?.url) {
      alert(j?.error || 'Checkout failed')
      return
    }
    window.location.href = j.url
  }

  // Map data → card variants
  const framedVariants: CardVariant[] = FRAMED_POSTER.variants.map(v => ({
    sizeLabel: v.sizeLabel,
    frameColor: v.frameColor,
    orientation: v.orientation,
    productUid: v.productUid,
    prices: v.prices,
  }))

  const posterVariants: CardVariant[] = POSTER.variants.map(v => ({
    sizeLabel: v.sizeLabel,
    orientation: v.orientation,
    productUid: v.productUid,
    prices: v.prices,
  }))

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Choose your poster</h1>
          <div className="text-sm">
            <label className="mr-2 text-white/70">Ship to</label>
            <select
              className="bg-white/5 border border-white/10 rounded px-3 py-2"
              value={currency}
              onChange={e => setCurrency(e.target.value as Currency)}
            >
              {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProductCard
            title={FRAMED_POSTER.title}
            artSrc={fileUrlQP || '/mockups/halloween-frame-vertical.png'}
            mockupSrc="/mockups/halloween-frame-vertical.png"
            variants={framedVariants}
            onSelect={(v) =>
              checkout(FRAMED_POSTER.title, v,
                `${v.sizeLabel} – ${v.frameColor ?? ''} – ${v.orientation}`.replace(/\s–\s–/, ' –')
              )
            }
            controls={{ showFrame: true }}
          />

          <ProductCard
            title={POSTER.title}
            artSrc={fileUrlQP || '/mockups/halloween-frame-vertical.png'}
            mockupSrc="/mockups/halloween-frame-vertical.png"
            variants={posterVariants}
            onSelect={(v) => checkout(POSTER.title, v, `${v.sizeLabel} – ${v.orientation}`)}
            controls={{ showFrame: false }}
          />
        </div>

        {!canProceed && (
          <p className="mt-6 text-xs text-yellow-400">
            Missing <code>fileUrl</code> or <code>imageId</code>.
          </p>
        )}

        <p className="mt-6 text-xs text-white/50">
          Prices shown are your retail ex-VAT. Shipping/taxes are calculated at checkout.
        </p>
      </div>
    </main>
  )
}

export default function ProductsPage() {
  return (
    <CurrencyProvider>
      <Suspense fallback={<div className="p-6 text-white">Loading…</div>}>
        <ProductsInner />
      </Suspense>
    </CurrencyProvider>
  )
}
