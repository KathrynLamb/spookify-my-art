// 'use client'

// import { useState, useEffect, useCallback } from 'react'
// import { useRouter } from 'next/navigation'
// import Image from 'next/image'
// import { motion } from 'framer-motion'
// import { ChevronDown } from 'lucide-react'

// import { useUser } from '@/hooks/useUser'
// import { PRODUCTS } from '@/lib/products_gallery_jolly'
// import { HeroImageWithChatBelow } from '@/lib/heroDemo'

// import WaitlistModal from './design/components/WaitlistModal'
// import type { WaitlistProduct } from './design/types'

// export default function HomePage() {
//   const router = useRouter()
//   const { user, loading: userLoading } = useUser()

//   const [showWaitlist, setShowWaitlist] = useState(false)
//   const [waitlistProduct, setWaitlistProduct] =
//     useState<WaitlistProduct | null>(null)

//   const faqs = [
//     {
//       q: 'How does it work?',
//       a: 'Upload a photo, choose a style, personalize captions or text, then preview. We color-manage for print and ship via trusted partners.',
//     },
//     {
//       q: 'What about quality?',
//       a: 'We use archival inks and FSC-certified papers. Metal and acrylic prints include durable finishes with crisp detail.',
//     },
//     {
//       q: 'Where do you ship?',
//       a: 'We ship to 30+ countries, including UK, EU, US & Canada. Shipping windows update at checkout by region.',
//     },
//     {
//       q: 'What if I’m not happy?',
//       a: 'Love-it guarantee: if your order arrives damaged or defective, we’ll reprint or refund within 14 days.',
//     },
//   ]

//   useEffect(() => {
//     // keep this clean: no console spam in prod
//   }, [])

//   const handleProductClick = useCallback(
//     (p: WaitlistProduct) => {
//       if (p.comingSoon) {
//         setWaitlistProduct(p)
//         setShowWaitlist(true)
//         return
//       }

//       // ✅ block guests from entering design
//       if (!userLoading && !user) {
//         const next = `/design?product=${p.productUID}`
//         router.push(`/login?next=${encodeURIComponent(next)}`)
//         return
//       }

//       try {
//         localStorage.setItem(
//           'design:selectedProduct',
//           JSON.stringify({
//             title: p.title,
//             src: p.src,
//             name: p.name,
//             description: p.description,
//             productUID: p.productUID,
//             specs: p.specs,
//             prices: p.prices,
//             shippingRegions: p.shippingRegions,
//             shippingTime: p.shippingTime,
//             mockup: (p as any).mockup, // harmless if absent; remove if you don’t store this
//             printSpec: (p as any).printSpec,
//             prodigiSku: (p as any).prodigiSku,
//           }),
//         )
//       } catch {}

//       router.push(`/design?product=${p.productUID}`)
//     },
//     [router, user, userLoading],
//   )

//   return (
//     <main className="min-h-screen bg-[#0B0B0D] text-white antialiased">
//       {/* Ambient glows */}
//       <div
//         aria-hidden
//         className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
//       >
//         <div className="absolute top-[-260px] left-[30%] h-[720px] w-[720px] rounded-full bg-fuchsia-500/10 blur-3xl" />
//         <div className="absolute bottom-[-340px] left-[8%] h-[560px] w-[560px] rounded-full bg-emerald-500/10 blur-3xl" />
//         <div className="absolute top-[220px] right-[6%] h-[460px] w-[460px] rounded-full bg-orange-400/10 blur-3xl" />
//       </div>

//       {/* HERO */}
//       <section className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 pb-20 pt-28 lg:grid-cols-2">
//         <motion.div
//           initial={{ opacity: 0, y: 18 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.45 }}
//         >
//           <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
//             Turn ideas or photos into{' '}
//             <span className="bg-gradient-to-r from-fuchsia-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
//               museum-quality magic
//             </span>
//           </h1>

//           <p className="mt-3 text-emerald-300/90">
//             Create custom Christmas cards, cushions, ornaments & framed prints in minutes.
//           </p>

//           <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">
//             Upload a photo. Pick a style. Get gallery-grade keepsakes delivered worldwide.
//           </p>

//           <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/75">
//             <li className="flex items-center gap-2">
//               <span className="h-1.5 w-1.5 rounded-full bg-[#D7B46A]" />
//               Museum-grade prints
//             </li>
//             <li className="flex items-center gap-2">
//               <span className="h-1.5 w-1.5 rounded-full bg-[#D7B46A]" />
//               Ships worldwide
//             </li>
//             <li className="flex items-center gap-2">
//               <span className="h-1.5 w-1.5 rounded-full bg-[#D7B46A]" />
//               Ready in minutes
//             </li>
//             <li className="flex items-center gap-2">
//               <span className="h-1.5 w-1.5 rounded-full bg-[#D7B46A]" />
//               Love-it guarantee
//             </li>
//           </ul>
//         </motion.div>

//         <HeroImageWithChatBelow />
//       </section>

//       {/* PRODUCTS */}
//       <section
//         aria-labelledby="holiday-decorations"
//         className="relative z-10 mx-auto max-w-6xl px-6 pb-12"
//       >
//         <div className="mb-4 flex items-end justify-between gap-4">
//           <div>
//             <h2
//               id="holiday-decorations"
//               className="text-3xl font-bold tracking-tight"
//             >
//               Make beautiful holiday decorations
//             </h2>
//             <p className="mt-1 text-sm text-neutral-300">
//               Upload a photo, pick a style, and we’ll print museum-grade keepsakes—delivered worldwide.
//             </p>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
//           {PRODUCTS.map((p) => (
//             <button
//               key={p.title}
//               type="button"
//               onClick={() => handleProductClick(p as WaitlistProduct)}
//               className="group text-left rounded-2xl border border-[#24262B] bg-[#111216] ring-0 transition hover:border-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
//             >
//               <div className="relative aspect-square overflow-hidden rounded-2xl">
//                 <Image
//                   src={(p as any).jollySrc ?? p.src}
//                   alt={p.title}
//                   fill
//                   sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
//                   className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
//                   loading="lazy"
//                   decoding="async"
//                 />
//               </div>
//               <div className="p-4">
//                 <h3 className="text-sm font-semibold">{p.title}</h3>
//                 {(p as any).comingSoon && (
//                   <div className="mt-1 text-xs font-bold text-red-500">
//                     Coming Soon
//                   </div>
//                 )}
//               </div>
//             </button>
//           ))}
//         </div>

//         <ul className="mt-4 grid grid-cols-1 gap-2 text-xs text-neutral-400 sm:grid-cols-3">
//           <li className="flex items-center gap-2">
//             <span className="h-1.5 w-1.5 rounded-full bg-[#D7B46A]" />
//             Printed near you · Ships worldwide
//           </li>
//           <li className="flex items-center gap-2">
//             <span className="h-1.5 w-1.5 rounded-full bg-[#D7B46A]" />
//             Love-it guarantee
//           </li>
//         </ul>

//         <div className="mt-4 sm:hidden">
//           <a
//             href="/products"
//             className="inline-flex rounded-xl border border-[#24262B] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
//           >
//             Browse all
//           </a>
//         </div>
//       </section>

//       {/* HOW IT WORKS */}
//       <section className="mx-auto max-w-6xl px-6 pb-24">
//         <h2 className="mb-12 text-center text-3xl font-bold">
//           How it works (about 90 seconds)
//         </h2>
//         <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
//           {[
//             { t: 'Upload', d: 'Pick your favourite photo.' },
//             { t: 'Choose style', d: 'Lovify watercolor, cozy cartoon, classic portrait & more.' },
//             { t: 'Personalize', d: 'Add greetings, names, dates—your touch.' },
//             { t: 'Print & ship', d: 'Archival quality. Delivered fast.' },
//           ].map((s, i) => (
//             <li
//               key={s.t}
//               className="rounded-2xl bg-[#111216] p-5 ring-1 ring-[#24262B]"
//             >
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-white/65">Step {i + 1}</span>
//                 <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
//                   {i === 3 ? 'Done' : 'Easy'}
//                 </span>
//               </div>
//               <p className="mt-3 text-lg font-semibold">{s.t}</p>
//               <p className="mt-1 text-sm text-white/75">{s.d}</p>
//             </li>
//           ))}
//         </ol>
//       </section>

//       {/* REVIEWS */}
//       <section className="mx-auto max-w-6xl px-6 pb-24">
//         <h2 className="mb-10 text-center text-3xl font-bold">
//           Loved by gift-givers
//         </h2>
//         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
//           {[
//             { n: 'Sophie, London', t: '“The Lovify comic made him cry—in the best way.”' },
//             { n: 'Marcus, Dublin', t: '“Quality feels like a gallery piece. Super fast shipping.”' },
//             { n: 'Ava, Seattle', t: '“Our Halloween Spookify is now a year-round conversation starter.”' },
//           ].map((r) => (
//             <blockquote
//               key={r.n}
//               className="rounded-2xl bg-[#111216] p-5 ring-1 ring-[#24262B]"
//             >
//               <p className="text-white/90">{r.t}</p>
//               <footer className="mt-3 text-sm text-white/65">— {r.n}</footer>
//             </blockquote>
//           ))}
//         </div>
//       </section>

//       {/* FAQ */}
//       <section className="mx-auto max-w-4xl px-6 pb-24">
//         <h2 className="mb-10 text-center text-3xl font-bold">FAQs</h2>
//         <div className="overflow-hidden rounded-2xl ring-1 ring-[#24262B]">
//           {faqs.map((f, i) => (
//             <details key={i} className="group open:bg-[#111216]">
//               <summary className="cursor-pointer list-none px-5 py-4 text-left hover:bg-white/5">
//                 <div className="flex items-center justify-between gap-6">
//                   <span className="font-medium">{f.q}</span>
//                   <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-300 group-open:rotate-180" />
//                 </div>
//               </summary>
//               <div className="-mt-2 px-5 pb-6 text-white/80">{f.a}</div>
//             </details>
//           ))}
//         </div>

//         <WaitlistModal
//           product={waitlistProduct}
//           isOpen={showWaitlist}
//           onClose={() => setShowWaitlist(false)}
//         />
//       </section>
//     </main>
//   )
// }
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { useUser } from "@/hooks/useUser";
import { PRODUCTS } from "@/lib/products_gallery_jolly";
import { HeroImageWithChatBelow } from "@/lib/heroDemo";

import WaitlistModal from "./design/components/WaitlistModal";
import type { WaitlistProduct } from "./design/types";

/* -------------------------------------------------------------
 * Local types (avoid any)
 * ------------------------------------------------------------- */

type FaqItem = {
  q: string;
  a: string;
};

type DemoFrame = {
  key: "original" | "spookify" | "jollyfy" | "lovify";
  label: string;
  img: string;
};

/**
 * Best-effort shape of PRODUCTS for this page.
 * If your PRODUCTS export already has a type you can import,
 * replace this with that.
 */
type GalleryProduct = WaitlistProduct & {
  title: string;
  jollySrc: string;
  src?: string;
  name?: string;
  description?: string;
  productUID: string;
  specs?: string[];
  prices?: Record<string, number>;
  shippingRegions?: string[];
  shippingTime?: {
    uk?: number;
    eu?: number;
    us?: number;
  };
  comingSoon?: boolean;
};

/* -------------------------------------------------------------
 * Component
 * ------------------------------------------------------------- */

export default function HomePage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const faqs: FaqItem[] = useMemo(
    () => [
      {
        q: "How does it work?",
        a: "Upload a photo, choose a style, personalize captions or text, then preview. We color-manage for print and ship via trusted partners.",
      },
      {
        q: "What about quality?",
        a: "We use archival inks and FSC-certified papers. Metal and acrylic prints include durable finishes with crisp detail.",
      },
      {
        q: "Where do you ship?",
        a: "We ship to 30+ countries, including UK, EU, US & Canada. Shipping windows update at checkout by region.",
      },
      {
        q: "What if I’m not happy?",
        a: "Love-it guarantee: if your order arrives damaged or defective, we’ll reprint or refund within 14 days.",
      },
    ],
    [],
  );

  const demoFrames: DemoFrame[] = useMemo(
    () => [
      {
        key: "original",
        label: "Original",
        img: "/ai_gifts_landing/demo-original.jpg",
      },
      {
        key: "spookify",
        label: "Spookify",
        img: "/ai_gifts_landing/demo-spookify.jpg",
      },
      {
        key: "jollyfy",
        label: "Jollyfy",
        img: "/ai_gifts_landing/demo-jollyfy.jpg",
      },
      {
        key: "lovify",
        label: "Lovify",
        img: "/ai_gifts_landing/demo-lovify.jpg",
      },
    ],
    [],
  );

  const [afterIndex, setAfterIndex] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);

  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistProduct, setWaitlistProduct] =
    useState<WaitlistProduct | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);

    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const id = window.setInterval(() => {
      setAfterIndex((i) => (i + 1) % demoFrames.length);
    }, 3500);

    return () => window.clearInterval(id);
  }, [demoFrames.length, reducedMotion]);

  const products = PRODUCTS as unknown as GalleryProduct[];

  function handleProductClick(p: GalleryProduct) {
    if (p.comingSoon) {
      setWaitlistProduct(p);
      setShowWaitlist(true);
      return;
    }

    // ✅ block guests from design
    if (!userLoading && !user) {
      const next = `/design?product=${p.productUID}`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    try {
      localStorage.setItem(
        "design:selectedProduct",
        JSON.stringify({
          title: p.title,
          src: p.src,
          name: p.name,
          description: p.description,
          productUID: p.productUID,
          specs: p.specs,
          prices: p.prices,
          shippingRegions: p.shippingRegions,
          shippingTime: p.shippingTime,
        }),
      );
    } catch {
      // ignore localStorage failures
    }

    router.push(`/design?product=${p.productUID}`);
  }

  return (
    <main className="min-h-screen bg-[#0B0B0D] text-white antialiased">
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
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
            Turn ideas or photos into{" "}
            <span className="bg-gradient-to-r from-fuchsia-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
              museum-quality magic
            </span>
          </h1>

          <p className="mt-3 text-emerald-300/90">
            Create custom Christmas cards, cushions, ornaments & framed prints
            in minutes.
          </p>

          <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">
            Upload a photo. Pick a style. Get gallery-grade keepsakes delivered
            worldwide.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/75">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D7B46A]" />
              Museum-grade prints
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D7B46A]" />
              Ships worldwide
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D7B46A]" />
              Ready in minutes
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D7B46A]" />
              Love-it guarantee
            </li>
          </ul>
        </motion.div>

        {/* You already have this hero demo */}
        <HeroImageWithChatBelow />
      </section>

      {/* PRODUCTS */}
      <section
        aria-labelledby="holiday-decorations"
        className="relative z-10 mx-auto max-w-6xl px-6 pb-12"
      >
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2
              id="holiday-decorations"
              className="text-3xl font-bold tracking-tight"
            >
              Make beautiful holiday decorations
            </h2>
            <p className="mt-1 text-sm text-neutral-300">
              Upload a photo, pick a style, and we’ll print museum-grade
              keepsakes—delivered worldwide.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p) => (
            <button
              key={p.title}
              type="button"
              onClick={() => handleProductClick(p)}
              className="group text-left rounded-2xl border border-[#24262B] bg-[#111216] ring-0 transition hover:border-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
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
                {p.comingSoon && (
                  <div className="text-md font-bold text-red-500">
                    Coming Soon
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-2 text-xs text-neutral-400 sm:grid-cols-3">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D7B46A]" />
            Printed near you · Ships worldwide
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D7B46A]" />
            Love-it guarantee
          </li>
        </ul>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-12 text-center text-3xl font-bold">
          How it works (about 90 seconds)
        </h2>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Upload", d: "Pick your favourite photo." },
            {
              t: "Choose style",
              d: "Lovify watercolor, cozy cartoon, classic portrait & more.",
            },
            { t: "Personalize", d: "Add greetings, names, dates—your touch." },
            { t: "Print & ship", d: "Archival quality. Delivered fast." },
          ].map((s, i) => (
            <li
              key={s.t}
              className="rounded-2xl bg-[#111216] p-5 ring-1 ring-[#24262B]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/65">Step {i + 1}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                  {i === 3 ? "Done" : "Easy"}
                </span>
              </div>
              <p className="mt-3 text-lg font-semibold">{s.t}</p>
              <p className="mt-1 text-sm text-white/75">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* REVIEWS */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-10 text-center text-3xl font-bold">
          Loved by gift-givers
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              n: "Sophie, London",
              t: "“The Lovify comic made him cry—in the best way.”",
            },
            {
              n: "Marcus, Dublin",
              t: "“Quality feels like a gallery piece. Super fast shipping.”",
            },
            {
              n: "Ava, Seattle",
              t: "“Our Halloween Spookify is now a year-round conversation starter.”",
            },
          ].map((r) => (
            <blockquote
              key={r.n}
              className="rounded-2xl bg-[#111216] p-5 ring-1 ring-[#24262B]"
            >
              <p className="text-white/90">{r.t}</p>
              <footer className="mt-3 text-sm text-white/65">— {r.n}</footer>
            </blockquote>
          ))}
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
              <div className="-mt-2 px-5 pb-6 text-white/80">{f.a}</div>
            </details>
          ))}
        </div>

        <WaitlistModal
          product={waitlistProduct}
          isOpen={showWaitlist}
          onClose={() => setShowWaitlist(false)}
        />
      </section>
    </main>
  );
}
