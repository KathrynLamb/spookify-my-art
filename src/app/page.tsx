'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ChevronDown
} from 'lucide-react'

// import WaitlistModal from '@/components/WaitlistModal';


import { PRODUCTS } from '@/lib/products_gallery_jolly'
import { HeroImageWithChatBelow } from '@/lib/heroDemo'
import WaitlistModal from './design/components/WaitlistModal'
import { WaitlistProduct } from './design/types'




/**
 * Drop-in world-class landing for AI Gifts
 * - Hero with live before/after demo
 * - Outcome-based cards (price + ship time)
 * - How it works strip
 * - Social proof band
 * - FAQ
 * - Performance & a11y friendly
 */

// function GalleryItem({ before, after }: { before: string; after: string }) {

//   return (
//     <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e11]">
//       <LanternSlider
//         beforeSrc={before}
//         afterSrc={after}
//         alt="Family photo comparison"
//         priority
//       />
//       {/* glow + label */}
//       <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
//       <div className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white/85 backdrop-blur">
//         Drag the lantern →
//       </div>
//     </div>
//   );
// }

export default function HomePage() {
 
  const faqs = [
    {
      q: 'How does it work?',
      a: 'Upload a photo, choose a style, personalize captions or text, then preview. We color-manage for print and ship via trusted partners.',
    },
    {
      q: 'What about quality?',
      a: 'We use archival inks and FSC-certified papers. Metal and acrylic prints include durable finishes with crisp detail.',
    },
    {
      q: 'Where do you ship?',
      a: 'We ship to 30+ countries, including UK, EU, US & Canada. Shipping windows update at checkout by region.',
    },
    {
      q: 'What if I’m not happy?',
      a: 'Love-it guarantee: if your order arrives damaged or defective, we’ll reprint or refund within 14 days.',
    },
  ]

  /** ---------- HERO DEMO (before/after slider with rotating styles) ---------- */
  const demoFrames = [
    {
      key: 'original',
      label: 'Original',
      img: '/ai_gifts_landing/demo-original.jpg',
    },
    {
      key: 'spookify',
      label: 'Spookify',
      img: '/ai_gifts_landing/demo-spookify.jpg',
    },
    {
      key: 'jollyfy',
      label: 'Jollyfy',
      img: '/ai_gifts_landing/demo-jollyfy.jpg',
    },
    {
      key: 'lovify',
      label: 'Lovify',
      img: '/ai_gifts_landing/demo-lovify.jpg',
    },
  ]

  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistProduct, setWaitlistProduct] =
  useState<WaitlistProduct | null>(null);


  const [afterIndex, setAfterIndex] = useState(1) // start on Spookify
  console.log(afterIndex)

  useEffect(() => {
    const id = setInterval(() => {
      setAfterIndex((i) => (i + 1) % demoFrames.length)
    }, 3500)
    return () => clearInterval(id)
  }, [demoFrames.length])


  /** ---------- UI ---------- */



  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    console.log(reducedMotion)
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [reducedMotion]);



  return (
    <main className="min-h-screen bg-[#0B0B0D] text-white antialiased">
      {/* Ambient glows (brand + subtle holiday cue) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-260px] left-[30%] h-[720px] w-[720px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute bottom-[-340px] left-[8%] h-[560px] w-[560px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute top-[220px] right-[6%] h-[460px] w-[460px] rounded-full bg-orange-400/10 blur-3xl" />
      </div>

      {/* HERO */}
      <section className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 pb-20 pt-28 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            Turn ideas or photos into{' '}
            <span className="bg-gradient-to-r from-fuchsia-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
              museum-quality magic
            </span>
          </h1>

          {/* Seasonal strap (light touch; remove after season) */}
          <p className="mt-3 text-emerald-300/90">
            Create custom Christmas cards, cushions, ornaments & framed prints in minutes.
          </p>

          <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">
            Upload a photo. Pick a style. Get gallery-grade keepsakes delivered worldwide.
          </p>

          <div className="mt-7 flex flex-wrap gap-4">
            <Link
              href="/upload"
              className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-orange-400 px-6 py-3 text-sm font-semibold text-black shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset] hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              Start now
            </Link>
            <a
              href="#styles"
              className="rounded-2xl border border-[#24262B] px-6 py-3 text-sm font-semibold text-white hover:border-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              Browse styles
            </a>
          </div>

          {/* Micro benefits */}
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/75">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D7B46A]"></span>
              Museum-grade prints
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D7B46A]"></span>
              Ships worldwide
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D7B46A]"></span>
              Ready in minutes
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D7B46A]"></span>
              Love-it guarantee
            </li>
          </ul>
        </motion.div>

        {/* Before/After Demo (with better labels + soft feather seam) */}
      <HeroImageWithChatBelow />
      </section>

      {/* PRODUCTS */}
      <section aria-labelledby="holiday-decorations" className="relative z-10 mx-auto max-w-6xl px-6 pb-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="holiday-decorations" className="text-3xl font-bold tracking-tight">
              Make beautiful holiday decorations
            </h2>
            <p className="mt-1 text-sm text-neutral-300">
              Upload a photo, pick a style, and we’ll print museum-grade keepsakes—delivered worldwide.
            </p>
          </div>

          <a
            href="/products"
            className="hidden shrink-0 rounded-xl border border-[#24262B] px-4 py-2 text-sm font-semibold text-white hover:border-emerald-600 sm:inline-block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            aria-label="Browse all holiday products"
          >
            Browse all
          </a>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {PRODUCTS.map((p) => (
            <a
              key={p.title}
              onClick={() => {
                // console.log('product', p)

                if (p.comingSoon) {
                  setWaitlistProduct(p);
                  setShowWaitlist(true);
                  return;
                } else {
                try {
                  localStorage.setItem('design:selectedProduct', JSON.stringify({
                    title: p.title,
                    src: p.src,
                    name: p.name,
                    description: p.description,
                    productUID: p.productUID,
                    specs: p.specs,
                    prices: p.prices,
                    shippingRegions: p.shippingRegions,
                    shippingTime: p.shippingTime
                  }
                    ));
                } catch {}
                window.location.href = `/design?product=${p.productUID}`;

              }
              }}
              className="group rounded-2xl border border-[#24262B] bg-[#111216] ring-0 transition hover:border-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl">
                <Image
                  src={p.jollySrc}
                  alt={p.title}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold">{p.title}</h3>
                {p.comingSoon &&  <h3 className="text-md font-bold text-red-500">Coming Soon</h3> }
               
              </div>
            </a>
          ))}
        </div>

        {/* tiny trust row */}
        <ul className="mt-4 grid grid-cols-1 gap-2 text-xs text-neutral-400 sm:grid-cols-3">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D7B46A]" />
            Archival inks · FSC-certified papers
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D7B46A]" />
            Printed near you · Ships worldwide
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D7B46A]" />
            Love-it guarantee
          </li>
        </ul>

        {/* mobile browse link */}
        <div className="mt-4 sm:hidden">
          <a
            href="/products"
            className="inline-flex rounded-xl border border-[#24262B] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            Browse all
          </a>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-12 text-center text-3xl font-bold">How it works (about 90 seconds)</h2>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: 'Upload', d: 'Pick your favourite photo.' },
            { t: 'Choose style', d: 'Lovify watercolor, cozy cartoon, classic portrait & more.' },
            { t: 'Personalize', d: 'Add greetings, names, dates—your touch.' },
            { t: 'Print & ship', d: 'Archival quality. Delivered fast.' },
          ].map((s, i) => (
            <li key={s.t} className="rounded-2xl bg-[#111216] p-5 ring-1 ring-[#24262B]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/65">Step {i + 1}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                  {i === 3 ? 'Done' : 'Easy'}
                </span>
              </div>
              <p className="mt-3 text-lg font-semibold">{s.t}</p>
              <p className="mt-1 text-sm text-white/75">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* --- GALLERY / BEFORE-AFTER (static grid) --- */}
      {/* <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <h2 className="mb-8 text-center text-3xl font-bold md:text-4xl">Before → After</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      
          <GalleryItem before="/before_after_gallery/fam_picnic.png" after="/before_after_gallery/fam_picnic_spookified.png" />
          <GalleryItem before="/before_after_gallery/smile.png" after="/before_after_gallery/angel.png" />
          <GalleryItem before="/before_after_gallery/city.png" after="/before_after_gallery/city_spookified.png" />
          <GalleryItem before="/before_after_gallery/landscape.png" after="/before_after_gallery/landscape_spookified.png" />
          <GalleryItem before="/before_after_gallery/pets.png" after="/before_after_gallery/pets_spookified.png" />
          <GalleryItem before="/before_after_gallery/wedding.png" after="/before_after_gallery/wedding_WD_spookified.png" />
        </div>
      </section> */}

      {/* REVIEWS */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-10 text-center text-3xl font-bold">Loved by gift-givers</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { n: 'Sophie, London', t: '“The Lovify comic made him cry—in the best way.”' },
            { n: 'Marcus, Dublin', t: '“Quality feels like a gallery piece. Super fast shipping.”' },
            { n: 'Ava, Seattle', t: '“Our Halloween Spookify is now a year-round conversation starter.”' },
          ].map((r) => (
            <blockquote key={r.n} className="rounded-2xl bg-[#111216] p-5 ring-1 ring-[#24262B]">
              <p className="text-white/90">{r.t}</p>
              <footer className="mt-3 text-sm text-white/65">— {r.n}</footer>
            </blockquote>
          ))}
        </div>
      </section>

            {/* SOCIAL PROOF STRIP */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-[#111216] p-4 ring-1 ring-[#24262B]">
            <p className="text-sm text-white/70">Rating</p>
            <p className="mt-1 text-lg font-semibold">4.9/5 from 1,200+ orders</p>
          </div>
          <div className="rounded-xl bg-[#111216] p-4 ring-1 ring-[#24262B]">
            <p className="text-sm text-white/70">Fulfillment partners</p>
            <p className="mt-1 text-lg font-semibold">Gelato · Prodigi</p>
          </div>
          <div className="rounded-xl bg-[#111216] p-4 ring-1 ring-[#24262B]">
            <p className="text-sm text-white/70">Sustainability</p>
            <p className="mt-1 text-lg font-semibold">FSC-certified papers · Archival inks</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <h2 className="mb-10 text-center text-3xl font-bold">FAQs</h2>
        <div className="overflow-hidden rounded-2xl ring-1 ring-[#24262B]">
          {faqs.map((f, i) => (
            <details key={i} className="group open:bg-[#111216]">
              <summary className="cursor-pointer list-none px-5 py-4 text-left hover:bg-white/5">
                <div className="flex items-center justify-between gap-6">
                  <span className="font-medium">{f.q}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-300 group-open:rotate-180" />
                </div>
              </summary>
              <div className=" -mt-2 px-5 pb-6 text-white/80">{f.a}</div>
            </details>
          ))}

        <WaitlistModal
          product={waitlistProduct}
          isOpen={showWaitlist}
          onClose={() => setShowWaitlist(false)}
        />
      </div>
    </section>
</main>

  );
        }


