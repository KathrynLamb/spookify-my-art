'use client'

import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from '../components/product-card'

// ---------- Types ----------
type Size = {
  label: string
  productUid: string           // Gelato product UID for the exact variant
  priceGBP: number             // price you want to charge on Stripe (in GBP)
}

type Product = {
  slug: string
  title: string
  blurb?: string
  hero: string                 // fallback image if fileUrl missing
  sizes: Size[]
  disabled?: boolean
}

// ---------- Data ----------
const PRODUCTS: Product[] = [
  {
    slug: 'fine-art-poster',
    title: 'Fine Art Poster',
    hero: '/mockups/halloween-frame-vertical.png',
    sizes: [
      {
        label: '13×18 cm / 5×7″ — 200 gsm matte',
        productUid:
          'fine_arts_poster_geo_simplified_product_12-0_ver_130x180-mm-5r_200-gsm-80lb-enhanced-uncoated',
        priceGBP: 6.79,
      },
      {
        label: '28×43 cm / 11×17″ — 200 gsm matte',
        productUid:
          'fine_arts_poster_geo_simplified_product_12-0_ver_280x430-mm-xl_200-gsm-80lb-enhanced-uncoated',
        priceGBP: 10.74,
      },
    ],
  },
  {
    slug: 'classic-semi-gloss',
    title: 'Classic Semi-Gloss Poster',
    hero: '/mockups/halloween-frame-vertical.png',
    sizes: [],
    disabled: true,
  },
]

// ---------- Utils ----------
const isHttpUrl = (s: string) => /^https?:\/\//i.test(s)
const gbpToMinor = (gbp: number) => Math.round(gbp * 100) // to pence

// ---------- Page wrapper with Suspense ----------
export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading…</div>}>
      <ProductsPageInner />
    </Suspense>
  )
}

// ---------- Inner that uses useSearchParams ----------
function ProductsPageInner() {
  const sp = useSearchParams()

  // passed from /upload or generator page
  const fileUrlQP = sp.get('fileUrl') || ''
  const imageId = sp.get('imageId') || ''
  const canProceed = useMemo(() => !!(fileUrlQP && imageId), [fileUrlQP, imageId])

  async function handleSelect(prod: Product, variant: Size) {
    try {
      if (!imageId) throw new Error('Missing imageId')
      let fileUrl = fileUrlQP
      if (!fileUrl) throw new Error('Missing fileUrl')

      // Upload data: URL to get a public URL for Gelato if needed
      if (!isHttpUrl(fileUrl)) {
        const upRes = await fetch('/api/upload-spooky', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: fileUrl,
            filename: `spookified-${imageId}.png`,
          }),
        })
        const upJson: { url?: string; error?: string } = await upRes.json()
        if (!upRes.ok || !upJson?.url) {
          throw new Error(upJson?.error || 'Upload failed')
        }
        fileUrl = upJson.url
      }

      // Create Stripe Checkout — we pass Gelato productUid as `sku` in metadata
      const title = `${prod.title} – ${variant.label}`
      const price = gbpToMinor(variant.priceGBP)

      const chkRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl,
          imageId,
          sku: variant.productUid, // IMPORTANT: productUid goes to Stripe metadata.sku
          title,
          price,                   // pence
        }),
      })
      const chkJson: { url?: string; error?: string } = await chkRes.json()
      if (!chkRes.ok || !chkJson?.url) throw new Error(chkJson?.error || 'Checkout failed')

      window.location.href = chkJson.url
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(msg)
      console.error(msg)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Choose your poster</h1>
          {!canProceed && (
            <p className="mt-2 text-yellow-300">
              Missing <code>fileUrl</code> or <code>imageId</code>.
            </p>
          )}
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((prod) => {
            const v = prod.sizes[0] // default variant shown on the card button
            const disabled = prod.disabled || !v
            const priceStr = v ? `from £${v.priceGBP.toFixed(2)}` : undefined

            return (
              <div key={prod.slug} className={disabled ? 'opacity-60 pointer-events-none' : ''}>
                <ProductCard
                  title={`${prod.title}${v ? ` – ${v.label}` : ''}`}
                  price={priceStr}
                  artSrc={fileUrlQP || prod.hero}
                  mockupSrc="/mockups/halloween-frame-vertical.png"
                  onSelect={() => v && handleSelect(prod, v)}
                />
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
