// // // 'use client'

// // // import { Suspense, useMemo } from 'react'
// // // import { useSearchParams } from 'next/navigation'
// // // // import ProductCard, { type Variant as CardVariant } from '@/components/product-card'
// // // import { CurrencyProvider, useCurrency } from '@/contexts/CurrencyContext'
// // // import { type Currency, toMinor } from '@/lib/currency'

// // // // Data
// // // import { FRAMED_POSTER } from '@/lib/products/framed-poster'
// // // import { POSTER } from '@/lib/products/poster'
// // // import ProductCard, { type Variant as CardVariant } from '../components/product-card'

// // // const isHttpUrl = (s: string) => /^https?:\/\//i.test(s)

// // // function ProductsInner() {
// // //   const sp = useSearchParams()
// // //   const fileUrlQP = sp.get('fileUrl') || ''
// // //   const imageId = sp.get('imageId') || ''
// // //   const canProceed = useMemo(() => !!(fileUrlQP && imageId), [fileUrlQP, imageId])
// // //   const { currency, setCurrency, options } = useCurrency()

// // //   async function checkout(productTitle: string, variant: CardVariant, titleSuffix: string) {
// // //     if (!canProceed) {
// // //       alert('Missing fileUrl or imageId.')
// // //       return
// // //     }
// // //     let fileUrl = fileUrlQP

// // //     if (!isHttpUrl(fileUrl)) {
// // //       const upRes = await fetch('/api/upload-spooky', {
// // //         method: 'POST',
// // //         headers: { 'Content-Type': 'application/json' },
// // //         body: JSON.stringify({ dataUrl: fileUrl, filename: `spookified-${imageId}.png` }),
// // //       })
// // //       const upJson: { url?: string; error?: string } = await upRes.json()
// // //       if (!upRes.ok || !upJson?.url) {
// // //         alert(upJson?.error || 'Upload failed')
// // //         return
// // //       }
// // //       fileUrl = upJson.url
// // //     }

// // //     // BEFORE redirecting to Stripe…
// // //     localStorage.setItem('spookify:last-order', JSON.stringify({
// // //       product: productTitle,
// // //       size: titleSuffix,
// // //       orientation: titleSuffix.includes('Horizontal') ? 'Horizontal' : 'Vertical',
// // //       thumbUrl: fileUrl,                  // <-- this is what Thank You will show
// // //       // optional niceties if you have them:
// // //       shipCountry: (currency === 'USD' ? 'US' : currency === 'EUR' ? 'EU' : 'GB'),
// // //       email: undefined,
// // //       etaMinDays: 3,
// // //       etaMaxDays: 7,
// // //     }));

// // //     const priceMajor = variant.prices[currency] ?? variant.prices.GBP ?? 0

// // //     const r = await fetch('/api/checkout', {
// // //       method: 'POST',
// // //       headers: { 'Content-Type': 'application/json' },
// // //       body: JSON.stringify({

// // //         fileUrl,           // public URL (or upload first if you have a data: URL)
// // //         imageId,           // your image id
// // //         sku: variant.productUid,
// // //         title: `${productTitle} – ${titleSuffix}`,
// // //         price: toMinor(priceMajor),    // you’re already doing this
// // //         priceIsMajor: false,           // (optional) default false since you’re already passing minor
// // //         currency,   
// // //       }),
// // //     })
// // //     const j = await r.json()
// // //     if (!r.ok || !j?.url) {
// // //       alert(j?.error || 'Checkout failed')
// // //       return
// // //     }
// // //     window.location.href = j.url
// // //   }

// // //   function lemonSqueezyCheckout() {
// // //     // You can later make this dynamic per product
// // //     const lemonUrl = 'https://spookify-my-art.lemonsqueezy.com/buy/3c829174-dc02-4428-9123-7652026e6bbf'
    
// // //     // Optionally save order info before redirect
// // //     localStorage.setItem('spookify:last-order', JSON.stringify({
// // //       product: 'Haunted Halloween Print',
// // //       thumbUrl: fileUrlQP,
// // //       etaMinDays: 3,
// // //       etaMaxDays: 7,
// // //     }))
  
// // //     // Redirect
// // //     window.open(lemonUrl, '_blank')
// // //   }
  

// // //   // Map data → card variants
// // //   const framedVariants: CardVariant[] = FRAMED_POSTER.variants.map(v => ({
// // //     sizeLabel: v.sizeLabel,
// // //     frameColor: v.frameColor,
// // //     orientation: v.orientation,
// // //     productUid: v.productUid,
// // //     prices: v.prices,
// // //   }))

// // //   const posterVariants: CardVariant[] = POSTER.variants.map(v => ({
// // //     sizeLabel: v.sizeLabel,
// // //     orientation: v.orientation,
// // //     productUid: v.productUid,
// // //     prices: v.prices,
// // //   }))

// // //   return (
// // //     <main className="min-h-screen bg-black text-white">
// // //       <div className="mx-auto max-w-7xl px-4 py-8">
// // //         <header className="mb-6 flex items-center justify-between gap-4">
// // //           <h1 className="text-3xl font-bold">Choose your poster</h1>
// // //           <div className="text-sm">
// // //             <label className="mr-2 text-white/70">Ship to</label>
// // //             <select
// // //               className="bg-white/5 border border-white/10 rounded px-3 py-2"
// // //               value={currency}
// // //               onChange={e => setCurrency(e.target.value as Currency)}
// // //             >
// // //               {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
// // //             </select>
// // //           </div>
// // //         </header>

// // //         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// // //           <ProductCard
// // //             title={FRAMED_POSTER.title}
// // //             // artSrc={fileUrlQP || '/mockups/halloween-frame-vertical.png'}
// // //             artSrc={'/livingroom_frame_1.png'}
// // //             // mockupSrc="/mockups/halloween-frame-vertical.png"
// // //             mockupSrc="/framedPosterGelato.png"
// // //             variants={framedVariants}
// // //             onSelect={(v) =>
// // //               checkout(FRAMED_POSTER.title, v,
// // //                 `${v.sizeLabel} – ${v.frameColor ?? ''} – ${v.orientation}`.replace(/\s–\s–/, ' –')
// // //               )
// // //             }
// // //             controls={{ showFrame: true }}

// // //           />

// // //           <ProductCard
// // //             title={POSTER.title}
// // //             // artSrc={fileUrlQP || '/mockups/halloween-frame-vertical.png'}
// // //             artSrc={'/poster_costumes2.png'}
// // //             // mockupSrc="/mockups/halloween-frame-vertical.png"
// // //             mockupSrc="/posterFromGelato.png"
// // //             variants={posterVariants}
// // //             onSelect={(v) => checkout(POSTER.title, v, `${v.sizeLabel} – ${v.orientation}`)}
// // //             onSelectLemonSqueezy={}
// // //             controls={{ showFrame: false }}


// // //           />
// // //         </div>

// // //         {!canProceed && (
// // //           <p className="mt-6 text-xs text-yellow-400">
// // //             Missing <code>fileUrl</code> or <code>imageId</code>.
// // //           </p>
// // //         )}

// // //         <p className="mt-6 text-xs text-white/50">
// // //           Prices shown are your retail ex-VAT. Shipping/taxes are calculated at checkout.
// // //         </p>
// // //       </div>
// // //     </main>
// // //   )
// // // }

// // // export default function ProductsPage() {
// // //   return (
// // //     <CurrencyProvider>
// // //       <Suspense fallback={<div className="p-6 text-white">Loading…</div>}>
// // //         <ProductsInner />
// // //       </Suspense>
// // //     </CurrencyProvider>
// // //   )
// // // }
// // 'use client';

// // import { Suspense, useMemo } from 'react';
// // import { useSearchParams } from 'next/navigation';
// // import { CurrencyProvider, useCurrency } from '@/contexts/CurrencyContext';
// // import { type Currency, toMinor } from '@/lib/currency';

// // // Data
// // import { FRAMED_POSTER } from '@/lib/products/framed-poster';
// // import { POSTER } from '@/lib/products/poster';

// // // UI
// // import ProductCard, { type Variant as CardVariant } from '../components/product-card';

// // const isHttpUrl = (s: string) => /^https?:\/\//i.test(s);

// // function ProductsInner() {
// //   const sp = useSearchParams();
// //   const fileUrlQP = sp.get('fileUrl') || '';
// //   const imageId = sp.get('imageId') || '';
// //   const canProceed = useMemo(() => !!(fileUrlQP && imageId), [fileUrlQP, imageId]);

// //   const { currency, setCurrency, options } = useCurrency();

// //   async function checkout(productTitle: string, variant: CardVariant, titleSuffix: string) {
// //     if (!canProceed) {
// //       alert('Missing fileUrl or imageId.');
// //       return;
// //     }

// //     let fileUrl = fileUrlQP;

// //     // If user arrived with a data URL (not a public URL), upload it first
// //     if (!isHttpUrl(fileUrl)) {
// //       const upRes = await fetch('/api/upload-spooky', {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify({ dataUrl: fileUrl, filename: `spookified-${imageId}.png` }),
// //       });
// //       const upJson: { url?: string; error?: string } = await upRes.json();
// //       if (!upRes.ok || !upJson?.url) {
// //         alert(upJson?.error || 'Upload failed');
// //         return;
// //       }
// //       fileUrl = upJson.url;
// //     }

// //     // Persist lightweight order context for the thank-you screen
// //     localStorage.setItem(
// //       'spookify:last-order',
// //       JSON.stringify({
// //         product: productTitle,
// //         size: titleSuffix,
// //         orientation: titleSuffix.includes('Horizontal') ? 'Horizontal' : 'Vertical',
// //         thumbUrl: fileUrl,
// //         shipCountry: currency === 'USD' ? 'US' : currency === 'EUR' ? 'EU' : 'GB',
// //         email: undefined,
// //         etaMinDays: 3,
// //         etaMaxDays: 7,
// //       })
// //     );

// //     const priceMajor = variant.prices[currency] ?? variant.prices.GBP ?? 0;

// //     const r = await fetch('/api/checkout', {
// //       method: 'POST',
// //       headers: { 'Content-Type': 'application/json' },
// //       body: JSON.stringify({
// //         fileUrl,                  // public URL (or uploaded above)
// //         imageId,                  // your image id
// //         sku: variant.productUid,  // product identifier
// //         title: `${productTitle} – ${titleSuffix}`,
// //         price: toMinor(priceMajor), // pass minor units
// //         priceIsMajor: false,        // clarify we passed minor already
// //         currency,
// //       }),
// //     });

// //     const j: { url?: string; error?: string } = await r.json();
// //     if (!r.ok || !j?.url) {
// //       alert(j?.error || 'Checkout failed');
// //       return;
// //     }
// //     window.location.href = j.url;
// //   }

// //   // Temporary “pay later / manual” flow via Lemon Squeezy product URL
// //   function lemonSqueezyCheckout() {
// //     const lemonUrl =
// //       'https://spookify-my-art.lemonsqueezy.com/buy/3c829174-dc02-4428-9123-7652026e6bbf';

// //     // Save some context so you can render a confirmation page if desired
// //     localStorage.setItem(
// //       'spookify:last-order',
// //       JSON.stringify({
// //         product: 'Haunted Halloween Print',
// //         thumbUrl: fileUrlQP,
// //         etaMinDays: 3,
// //         etaMaxDays: 7,
// //       })
// //     );

// //     window.open(lemonUrl, '_blank');
// //   }

// //   // Map data → card variants (typed; no any)
// //   const framedVariants: CardVariant[] = FRAMED_POSTER.variants.map((v) => ({
// //     sizeLabel: v.sizeLabel,
// //     frameColor: v.frameColor,
// //     orientation: v.orientation,
// //     productUid: v.productUid,
// //     prices: v.prices,
// //   }));

// //   const posterVariants: CardVariant[] = POSTER.variants.map((v) => ({
// //     sizeLabel: v.sizeLabel,
// //     orientation: v.orientation,
// //     productUid: v.productUid,
// //     prices: v.prices,
// //   }));

// //   return (
// //     <main className="min-h-screen bg-black text-white">
// //       <div className="mx-auto max-w-7xl px-4 py-8">
// //         <header className="mb-6 flex items-center justify-between gap-4">
// //           <h1 className="text-3xl font-bold">Choose your poster</h1>
// //           <div className="text-sm">
// //             <label className="mr-2 text-white/70">Ship to</label>
// //             <select
// //               className="bg-white/5 border border-white/10 rounded px-3 py-2"
// //               value={currency}
// //               onChange={(e) => setCurrency(e.target.value as Currency)}
// //             >
// //               {options.map((o) => (
// //                 <option key={o.id} value={o.id}>
// //                   {o.label}
// //                 </option>
// //               ))}
// //             </select>
// //           </div>
// //         </header>

// //         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// //           <ProductCard
// //             title={FRAMED_POSTER.title}
// //             artSrc={'/livingroom_frame_1.png'}
// //             mockupSrc="/framedPosterGelato.png"
// //             variants={framedVariants}
// //             onSelect={(v) =>
// //               checkout(
// //                 FRAMED_POSTER.title,
// //                 v,
// //                 `${v.sizeLabel} – ${v.frameColor ?? ''} – ${v.orientation}`.replace(
// //                   /\s–\s–/,
// //                   ' –'
// //                 )
// //               )
// //             }
// //             controls={{ showFrame: true }}
// //           />

// //           <ProductCard
// //             title={POSTER.title}
// //             artSrc={'/poster_costumes2.png'}
// //             mockupSrc="/posterFromGelato.png"
// //             variants={posterVariants}
// //             onSelect={(v) => checkout(POSTER.title, v, `${v.sizeLabel} – ${v.orientation}`)}
// //             onSelectLemonSqueezy={lemonSqueezyCheckout}
// //             controls={{ showFrame: false }}
// //           />
// //         </div>

// //         {!canProceed && (
// //           <p className="mt-6 text-xs text-yellow-400">
// //             Missing <code>fileUrl</code> or <code>imageId</code>.
// //           </p>
// //         )}

// //         <p className="mt-6 text-xs text-white/50">
// //           Prices shown are your retail ex-VAT. Shipping/taxes are calculated at checkout.
// //         </p>
// //       </div>
// //     </main>
// //   );
// // }

// // export default function ProductsPage() {
// //   return (
// //     <CurrencyProvider>
// //       <Suspense fallback={<div className="p-6 text-white">Loading…</div>}>
// //         <ProductsInner />
// //       </Suspense>
// //     </CurrencyProvider>
// //   );
// // }


// 'use client';

// import { Suspense, useMemo } from 'react';
// import { useSearchParams } from 'next/navigation';
// import { CurrencyProvider, useCurrency } from '@/contexts/CurrencyContext';
// import { type Currency, toMinor } from '@/lib/currency';

// // Data
// import { FRAMED_POSTER } from '@/lib/products/framed-poster';
// import { POSTER } from '@/lib/products/poster';

// // UI
// import ProductCard, { type Variant as CardVariant } from '../components/product-card';

// const isHttpUrl = (s: string) => /^https?:\/\//i.test(s);

// function ProductsInner() {
//   const sp = useSearchParams();
//   const fileUrlQP = sp.get('fileUrl') || '';
//   const imageId = sp.get('imageId') || '';
//   const canProceed = useMemo(() => !!(fileUrlQP && imageId), [fileUrlQP, imageId]);

//   const { currency, setCurrency, options } = useCurrency();

//   async function checkout(productTitle: string, variant: CardVariant, titleSuffix: string) {
//     if (!canProceed) {
//       alert('Missing fileUrl or imageId.');
//       return;
//     }

//     let fileUrl = fileUrlQP;

//     // If user arrived with a data URL (not a public URL), upload it first
//     if (!isHttpUrl(fileUrl)) {
//       const upRes = await fetch('/api/upload-spooky', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ dataUrl: fileUrl, filename: `spookified-${imageId}.png` }),
//       });
//       const upJson: { url?: string; error?: string } = await upRes.json();
//       if (!upRes.ok || !upJson?.url) {
//         alert(upJson?.error || 'Upload failed');
//         return;
//       }
//       fileUrl = upJson.url;
//     }

//     // Persist lightweight order context for the thank-you screen
//     localStorage.setItem(
//       'spookify:last-order',
//       JSON.stringify({
//         product: productTitle,
//         size: titleSuffix,
//         orientation: titleSuffix.includes('Horizontal') ? 'Horizontal' : 'Vertical',
//         thumbUrl: fileUrl,
//         shipCountry: currency === 'USD' ? 'US' : currency === 'EUR' ? 'EU' : 'GB',
//         email: undefined,
//         etaMinDays: 3,
//         etaMaxDays: 7,
//       })
//     );

//     const priceMajor = variant.prices[currency] ?? variant.prices.GBP ?? 0;

//     const r = await fetch('/api/checkout', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         fileUrl,                  // public URL (or uploaded above)
//         imageId,                  // your image id
//         sku: variant.productUid,  // product identifier
//         title: `${productTitle} – ${titleSuffix}`,
//         price: toMinor(priceMajor), // pass minor units
//         priceIsMajor: false,        // clarify we passed minor already
//         currency,
//       }),
//     });

//     const j: { url?: string; error?: string } = await r.json();
//     if (!r.ok || !j?.url) {
//       alert(j?.error || 'Checkout failed');
//       return;
//     }
//     window.location.href = j.url;
//   }

//   // Temporary “pay later / manual” flow via Lemon Squeezy product URL
//   function lemonSqueezyCheckout() {
//     const lemonUrl =
//       'https://spookify-my-art.lemonsqueezy.com/buy/3c829174-dc02-4428-9123-7652026e6bbf';

//     // Save some context so you can render a confirmation page if desired
//     localStorage.setItem(
//       'spookify:last-order',
//       JSON.stringify({
//         product: 'Haunted Halloween Print',
//         thumbUrl: fileUrlQP,
//         etaMinDays: 3,
//         etaMaxDays: 7,
//       })
//     );

//     window.open(lemonUrl, '_blank');
//   }

//   // Map data → card variants (typed; no any)
//   const framedVariants: CardVariant[] = FRAMED_POSTER.variants.map((v) => ({
//     sizeLabel: v.sizeLabel,
//     frameColor: v.frameColor,
//     orientation: v.orientation,
//     productUid: v.productUid,
//     prices: v.prices,
//   }));

//   const posterVariants: CardVariant[] = POSTER.variants.map((v) => ({
//     sizeLabel: v.sizeLabel,
//     orientation: v.orientation,
//     productUid: v.productUid,
//     prices: v.prices,
//   }));

//   return (
//     <main className="min-h-screen bg-black text-white">
//       <div className="mx-auto max-w-7xl px-4 py-8">
//         <header className="mb-6 flex items-center justify-between gap-4">
//           <h1 className="text-3xl font-bold">Choose your poster</h1>
//           <div className="text-sm">
//             <label className="mr-2 text-white/70">Ship to</label>
//             <select
//               className="bg-white/5 border border-white/10 rounded px-3 py-2"
//               value={currency}
//               onChange={(e) => setCurrency(e.target.value as Currency)}
//             >
//               {options.map((o) => (
//                 <option key={o.id} value={o.id}>
//                   {o.label}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </header>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <ProductCard
//             title={FRAMED_POSTER.title}
//             artSrc={'/livingroom_frame_1.png'}
//             mockupSrc="/framedPosterGelato.png"
//             variants={framedVariants}
//             onSelect={(v) =>
//               checkout(
//                 FRAMED_POSTER.title,
//                 v,
//                 `${v.sizeLabel} – ${v.frameColor ?? ''} – ${v.orientation}`.replace(
//                   /\s–\s–/,
//                   ' –'
//                 )
//               )
//             }
//             controls={{ showFrame: true }}
//           />

//           <ProductCard
//             title={POSTER.title}
//             artSrc={'/poster_costumes2.png'}
//             mockupSrc="/posterFromGelato.png"
//             variants={posterVariants}
//             onSelect={(v) => checkout(POSTER.title, v, `${v.sizeLabel} – ${v.orientation}`)}
//             onSelectLemonSqueezy={lemonSqueezyCheckout}
//             controls={{ showFrame: false }}
//           />
//         </div>

//         {!canProceed && (
//           <p className="mt-6 text-xs text-yellow-400">
//             Missing <code>fileUrl</code> or <code>imageId</code>.
//           </p>
//         )}

//         <p className="mt-6 text-xs text-white/50">
//           Prices shown are your retail ex-VAT. Shipping/taxes are calculated at checkout.
//         </p>
//       </div>
//     </main>
//   );
// }

// export default function ProductsPage() {
//   return (
//     <CurrencyProvider>
//       <Suspense fallback={<div className="p-6 text-white">Loading…</div>}>
//         <ProductsInner />
//       </Suspense>
//     </CurrencyProvider>
//   );
// }
'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
          <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
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
          Quick heads-up: checkout is in sandbox, so we’ll invoice you right away and get your print moving. 💌
        </p>
      </div>
    </div>
  );
}

function ProductsInner() {
  const sp = useSearchParams();
  const fileUrlQP = sp.get('fileUrl') || '';
  const imageId = sp.get('imageId') || '';
  const canProceed = useMemo(() => !!(fileUrlQP && imageId), [fileUrlQP, imageId]);

  const { currency, setCurrency, options } = useCurrency();

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

  // Ensure fileUrl is public if user arrived with data: URL
  async function ensurePublicUrl(current: string, givenImageId: string) {
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

  // Stripe checkout (kept in code, gated by env)
  async function stripeCheckout(productTitle: string, variant: CardVariant, titleSuffix: string, publicUrl: string) {
    // Persist lightweight order context for the thank-you screen
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

  // LemonSqueezy checkout (kept in code, gated by env)
  function lemonSqueezyCheckout(publicUrlForDisplay?: string) {
    const lemonUrl = 'https://spookify-my-art.lemonsqueezy.com/buy/3c829174-dc02-4428-9123-7652026e6bbf';
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

  // Unified select handler → routes to Stripe/Lemon OR manual modal
  async function onSelect(productTitle: string, variant: CardVariant, titleSuffix: string) {
    try {
      if (!canProceed) {
        alert('Missing fileUrl or imageId.');
        return;
      }

      const publicUrl = await ensurePublicUrl(fileUrlQP, imageId);

      if (PAYMENTS_ENABLED) {
        // Live payments → Stripe by default
        await stripeCheckout(productTitle, variant, titleSuffix, publicUrl);
        return;
      }

      // Payments disabled → open manual order modal
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

    if (PAYMENTS_ENABLED) {
      lemonSqueezyCheckout(publicUrl);
    } else {
      // When payments disabled, use manual modal instead
      setDraft((d) => ({ ...d, fileUrl: publicUrl }));
      setSuccessMsg(null);
      setErrorMsg(null);
      setManualOpen(true);
    }
  }

  async function submitManualOrder() {
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

      setSuccessMsg('Thanks! We’ve received your details and will be in touch shortly to complete your order.');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
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
        <header className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Choose your poster</h1>
          <div className="text-sm">
            <label className="mr-2 text-white/70">Ship to</label>
            <select
              className="bg-white/5 border border-white/10 rounded px-3 py-2"
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value as Currency);
                setDraft((d) => ({ ...d, currency: e.target.value as Currency }));
              }}
            >
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        {!PAYMENTS_ENABLED && (
          <div className="mb-6 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-yellow-200">
            Heads-up: online checkout is in sandbox. Hit “Select” to send us your details — we’ll invoice you and start printing. 💌
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
          />

          <ProductCard
            title={POSTER.title}
            artSrc="/poster_costumes2.png"
            mockupSrc="/posterFromGelato.png"
            variants={posterVariants}
            onSelect={(v) => onSelect(POSTER.title, v, `${v.sizeLabel} – ${v.orientation}`)}
            onSelectLemonSqueezy={onSelectLemon}
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

      {/* Manual order modal */}
      <ManualOrderModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        draft={draft}
        setDraft={setDraft}
        onSubmit={submitManualOrder}
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
