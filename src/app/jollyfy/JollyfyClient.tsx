'use client';

import Link from 'next/link';
import Image from 'next/image';
import React from 'react';

export default function JollyfyClient() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b090a] text-white">
      {/* BACKDROP */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_50%_-200px,#3a0f14_35%,#140b0d_70%,#0b090a_100%)]" />
        <div
          className="absolute inset-x-0 -top-4 h-48 opacity-80 mix-blend-screen"
        >
          <div className="h-full w-full bg-[radial-gradient(180px_70px_at_12%_30%,rgba(255,69,58,.28),transparent_60%),radial-gradient(220px_80px_at_38%_5%,rgba(20,255,120,.22),transparent_60%),radial-gradient(200px_80px_at_68%_18%,rgba(255,171,64,.24),transparent_65%),radial-gradient(200px_80px_at_88%_8%,rgba(120,160,255,.18),transparent_65%)]" />
        </div>
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-red-700/15 blur-3xl" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-green-600/15 blur-3xl" />
        <div className="twinkle absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_50%_20%,transparent_55%,rgba(0,0,0,.45))]" />
      </div>

      {/* LIGHT STRING */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-24">
        <div className="absolute inset-x-0 top-6 mx-auto h-[2px] w-[90%] rounded-full bg-black/40 shadow-[0_1px_0_rgba(255,255,255,.08)_inset]" />
        <div className="bulbs-glow absolute inset-x-0 top-0 h-24" />
        <div className="bulbs absolute inset-x-0 top-[14px] mx-auto grid h-0 w-[90%] grid-cols-12">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="mx-auto h-3 w-3 rounded-full border border-white/20 shadow"
              style={{
                background: i % 3 === 0 ? '#ef4444' : i % 3 === 1 ? '#22c55e' : '#f59e0b',
                boxShadow: '0 0 12px 2px rgba(255,255,255,0.30)',
              }}
            />
          ))}
        </div>
      </div>

      {/* TOP BAR */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-green-500 to-red-500 shadow-md shadow-red-500/20" />
          <span className="text-lg font-semibold tracking-wide">jollyfy</span>
        </div>
        <nav className="hidden gap-6 text-sm text-white/80 md:flex">
          <Link href="/jollyfy/products" className="hover:text-white">Products</Link>
          <Link href="/jollyfy/design" className="hover:text-white">Create</Link>
          <Link href="/help" className="hover:text-white">Help</Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 pb-16 pt-20 md:grid-cols-2">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <h1 className="mb-4 text-5xl font-extrabold leading-[1.1] sm:text-6xl">
            Make anything<br />
            instantly <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-amber-200 to-green-300">jolly</span> 🎄
          </h1>
          <p className="mb-7 max-w-[36rem] text-base text-white/85">
            Turn photos into festive keepsakes—prints, mugs, cushions, calendars, and more.
            Just upload, say your vibe, and we Jollyfy it.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
            <CandyButton href="/jollyfy/design" primary>Start creating</CandyButton>
            <CandyButton href="/jollyfy/products">See products</CandyButton>
          </div>
          <div className="mt-5 flex flex-wrap gap-4 text-sm text-white/70">
            <span>🎄 Mugs & Ornaments live</span>
            <span>📦 Ships in 3–5 days</span>
            <span>💌 Gift-ready packaging</span>
          </div>
        </div>

        {/* Polaroids */}
        <div className="relative mx-auto flex w-full max-w-[560px] items-center justify-center">
          <div className="relative h-[320px] w-[260px] rotate-[-6deg] rounded-[14px] bg-white/95 p-3 shadow-2xl shadow-black/40 ring-1 ring-black/10 md:h-[360px] md:w-[300px]">
            <div className="relative h-full w-full overflow-hidden rounded-[10px] bg-black/5">
              <Image src="/jollyfy/before.jpg" alt="Before" fill className="object-cover" sizes="(max-width: 768px) 60vw, 300px" priority />
            </div>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-2 py-0.5 text-[11px] font-medium text-white">Before</span>
          </div>
          <div className="absolute -right-4 top-10 hidden rotate-[8deg] rounded-[14px] bg-white/95 p-3 shadow-2xl shadow-black/40 ring-1 ring-black/10 md:block md:h-[380px] md:w-[300px]">
            <div className="relative h-full w-full overflow-hidden rounded-[10px] bg-black/5">
              <Image src="/jollyfy/after.jpg" alt="After" fill className="object-cover" sizes="300px" />
            </div>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-2 py-0.5 text-[11px] font-medium text-white">After</span>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {PRODUCTS.map((p) => (
            <ProductCard key={p.title} title={p.title} src={p.src} href={p.href} />
          ))}
        </div>
      </section>

      {/* PRICES */}
      <section className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-6 pb-12 pt-6 md:grid-cols-2">
        <PriceTile tone="green" title="Nice" price="$20" />
        <PriceTile tone="red" title="Naughty" price="$50" />
      </section>

      {/* TESTIMONIALS */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Testimonial name="Emma"   quote="Love frimned an amazing app."            src="/jollyfy/av-snow.png" />
          <Testimonial name="Daniel" quote="I easy to md gift-such as easy for use!" src="/jollyfy/av-guy.png" />
          <Testimonial name="Sarah"  quote="Alove these unique gifts ancist."        src="/jollyfy/av-girl.png" />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/10 bg-black/30 py-8 text-center text-sm text-white/70">
        <p>© {new Date().getFullYear()} Jollyfy · Part of AI Gifts</p>
      </footer>

      {/* Plain ASCII CSS */}
      <style jsx>{`
        .bulbs-glow {
          background-image:
            radial-gradient(18px 18px at 8% 45%, rgba(239, 68, 68, 0.8), transparent 60%),
            radial-gradient(18px 18px at 16% 45%, rgba(34, 197, 94, 0.8), transparent 60%),
            radial-gradient(18px 18px at 25% 45%, rgba(245, 158, 11, 0.85), transparent 60%),
            radial-gradient(18px 18px at 33% 45%, rgba(239, 68, 68, 0.8), transparent 60%),
            radial-gradient(18px 18px at 41% 45%, rgba(34, 197, 94, 0.8), transparent 60%),
            radial-gradient(18px 18px at 50% 45%, rgba(245, 158, 11, 0.85), transparent 60%),
            radial-gradient(18px 18px at 58% 45%, rgba(239, 68, 68, 0.8), transparent 60%),
            radial-gradient(18px 18px at 66% 45%, rgba(34, 197, 94, 0.8), transparent 60%),
            radial-gradient(18px 18px at 75% 45%, rgba(245, 158, 11, 0.85), transparent 60%),
            radial-gradient(18px 18px at 83% 45%, rgba(239, 68, 68, 0.8), transparent 60%),
            radial-gradient(18px 18px at 91% 45%, rgba(34, 197, 94, 0.8), transparent 60%);
          filter: blur(8px);
          opacity: 0.85;
          mix-blend-mode: screen;
        }
        .twinkle:after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(2px 2px at 10% 18%, rgba(255,255,255,0.6), transparent 60%),
            radial-gradient(2px 2px at 22% 12%, rgba(255,255,255,0.45), transparent 60%),
            radial-gradient(2px 2px at 35% 22%, rgba(255,255,255,0.5), transparent 60%),
            radial-gradient(2px 2px at 48% 16%, rgba(255,255,255,0.4), transparent 60%),
            radial-gradient(2px 2px at 61% 26%, rgba(255,255,255,0.55), transparent 60%),
            radial-gradient(2px 2px at 72% 14%, rgba(255,255,255,0.45), transparent 60%),
            radial-gradient(2px 2px at 84% 24%, rgba(255,255,255,0.55), transparent 60%),
            radial-gradient(2px 2px at 93% 16%, rgba(255,255,255,0.45), transparent 60%);
          animation: twinkle 2.8s linear infinite;
          mix-blend-mode: screen;
        }
        @keyframes twinkle { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.9; } }
      `}</style>
    </main>
  );
}

/* UI bits */

function CandyButton({
  href,
  children,
  primary = false,
}: { href: string; children: React.ReactNode; primary?: boolean }) {
  const candy = {
    borderImage:
      'repeating-linear-gradient(45deg,#ffffff 0 6px,#ee1111 6px 12px,#ffffff 12px 18px,#16a34a 18px 24px) 8',
  } as React.CSSProperties;

  return (
    <Link
      href={href}
      className={[
        'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
        primary
          ? 'bg-gradient-to-r from-red-700 to-red-400 text-green-400 hover:opacity-90'
          : 'text-white hover:bg-white/10',
      ].join(' ')}
      style={!primary ? { borderWidth: 2, borderStyle: 'solid', borderImage: candy.borderImage } : undefined}
    >
      {children}
    </Link>
  );
}

function ProductCard({ title, src, href }: { title: string; src: string; href: string }) {
  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f0f] transition hover:border-white/20"
    >
      <div className="relative aspect-square">
        <div className="absolute inset-0 m-4 rounded-xl bg-[radial-gradient(260px_140px_at_70%_30%,rgba(255,106,43,.12),transparent_60%),radial-gradient(240px_120px_at_30%_80%,rgba(16,185,129,.1),transparent_60%)]" />
        <div className="relative z-10 h-full w-full p-4">
          <div className="relative h-full w-full overflow-hidden rounded-xl bg-black/20 ring-1 ring-white/10">
            <Image src={src} alt={title} fill className="object-cover transition duration-300 group-hover:scale-[1.03]" sizes="(max-width:768px) 50vw, 25vw" />
          </div>
        </div>
      </div>
      <div className="px-4 pb-4 pt-1 text-center text-sm font-medium tracking-wide text-white/90">
        {title}
      </div>
    </Link>
  );
}

function PriceTile({ title, price, tone }: { title: string; price: string; tone: 'green' | 'red' }) {
  const ring =
    tone === 'green'
      ? 'shadow-[0_0_0_1px_rgba(34,197,94,.25)_inset] bg-gradient-to-b from-[#152017] to-[#0e1410]'
      : 'shadow-[0_0_0_1px_rgba(239,68,68,.25)_inset] bg-gradient-to-b from-[#231315] to-[#141011]';
  return (
    <div className={`rounded-2xl border border-white/10 p-6 text-center ${ring}`}>
      <div className="mb-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone === 'green' ? 'bg-green-600/25 text-green-300' : 'bg-red-600/25 text-red-300'}`}>{title}</span>
      </div>
      <div className="text-4xl font-extrabold tracking-wide">{price}</div>
      <p className="mt-1 text-sm text-white/75">Seasonal specials</p>
    </div>
  );
}

function Testimonial({ name, quote, src }: { name: string; quote: string; src: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-[#0f0f0f]/70 px-5 py-6 text-center backdrop-blur-sm">
      <div className="relative mb-3 h-16 w-16">
        <Image src={src} alt={name} fill className="rounded-full object-cover ring-2 ring-white/10" sizes="64px" />
      </div>
      <p className="mb-2 max-w-[20rem] text-sm text-white/90">“<span className="font-medium">{quote}</span>”</p>
      <div className="text-xs text-white/70">{name}</div>
    </div>
  );
}

/* DATA */
const PRODUCTS = [
  { title: 'Framed prints',  src: '/jollyfy/framed.png',   href: '/jollyfy/products?cat=prints' },
  { title: 'Holiday cards',   src: '/jollyfy/cards.png',     href: '/jollyfy/products?cat=posters' },
  { title: 'Cushions',       src: '/jollyfy/prod-cushion.png',  href: '/jollyfy/products?cat=cushions' },
  { title: 'Mugs',           src: '/jollyfy/mug.png',      href: '/jollyfy/products?cat=mugs' },
  // { title: 'FlipWhizz.book', src: '/jollyfy/prod-book.jpg',     href: '/jollyfy/products?cat=books' },
  // { title: 'Calendars',      src: '/jollyfy/prod-calendar.jpg', href: '/jollyfy/products?cat=calendars' },

  // { title: 'Mugs',           src: '/jollyfy/mug.jpg',      href: '/jollyfy/products?cat=mugs' },
  // { title: 'Phone cases',    src: '/jollyfy/prod-phone.jpg',    href: '/jollyfy/products?cat=phone' },
  // { title: 'Gift cards',     src: '/jollyfy/prod-gift.jpg',     href: '/jollyfy/products?cat=giftcards' },
];
