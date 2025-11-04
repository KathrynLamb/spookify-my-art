'use client';

import Link from 'next/link';
import Image from 'next/image';
import React from 'react';

export default function LovifyClient() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0709] text-white">
      {/* BACKDROP */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* deep rose nebula */}
        <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_50%_-120px,#3d0f1f_35%,#190c12_70%,#0a0709_100%)]" />
        {/* aurora wash */}
        <div className="absolute inset-x-0 -top-4 h-48 opacity-80 mix-blend-screen">
          <div className="h-full w-full bg-[radial-gradient(220px_90px_at_18%_32%,rgba(255,107,153,.28),transparent_60%),radial-gradient(260px_100px_at_42%_10%,rgba(255,190,200,.22),transparent_60%),radial-gradient(240px_100px_at_70%_22%,rgba(173,93,255,.22),transparent_65%),radial-gradient(240px_100px_at_90%_12%,rgba(255,120,120,.18),transparent_65%)]" />
        </div>
        {/* soft glows */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-rose-600/20 blur-3xl" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-3xl" />
        {/* petals sparkle */}
        <div className="petals absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_50%_18%,transparent_55%,rgba(0,0,0,.45))]" />
      </div>

      {/* STRING OF HEARTS */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-24">
        <div className="absolute inset-x-0 top-6 mx-auto h-[2px] w-[90%] rounded-full bg-black/40 shadow-[0_1px_0_rgba(255,255,255,.08)_inset]" />
        <div className="hearts-glow absolute inset-x-0 top-0 h-24" />
        <div className="absolute inset-x-0 top-[14px] mx-auto grid h-0 w-[90%] grid-cols-12">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="mx-auto h-3 w-3 rotate-45 rounded-[4px] border border-white/20 shadow"
              style={{
                background: i % 3 === 0 ? '#fb7185' : i % 3 === 1 ? '#f0abfc' : '#f472b6',
                boxShadow: '0 0 12px 2px rgba(255,255,255,0.30)',
            }}
            />
          ))}
        </div>
      </div>

      {/* TOP BAR */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-rose-400 via-pink-400 to-fuchsia-500 shadow-md shadow-rose-500/20" />
          <span className="text-lg font-semibold tracking-wide">lovify</span>
        </div>
        <nav className="hidden gap-6 text-sm text-white/80 md:flex">
          <Link href="/lovify/products" className="hover:text-white">Gifts</Link>
          <Link href="/lovify/design" className="hover:text-white">Create</Link>
          <Link href="/help" className="hover:text-white">Help</Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 pb-16 pt-20 md:grid-cols-2">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <h1 className="mb-4 text-5xl font-extrabold leading-[1.1] sm:text-6xl">
            Turn memories into<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-pink-200 to-fuchsia-300">
              love-soaked keepsakes
            </span> 💘
          </h1>
          <p className="mb-7 max-w-[38rem] text-base text-white/85">
            Anniversaries, proposals, or just because—upload a photo and we Lovify it into
            romantic prints, couple mugs, vow books, cards and more. Elegant, heartfelt, unmistakably you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
            <RibbonButton href="/lovify/design" primary>Start a keepsake</RibbonButton>
            <RibbonButton href="/lovify/products">Browse gifts</RibbonButton>
          </div>
          <div className="mt-5 flex flex-wrap gap-4 text-sm text-white/70">
            <span>💌 Gift-wrapped options</span>
            <span>⏱ Ships in 3–5 days</span>
            <span>✨ Free tiny text engraving on select items</span>
          </div>
        </div>

        {/* Polaroids */}
        <div className="relative mx-auto flex w-full max-w-[560px] items-center justify-center">
          <div className="relative h-[320px] w-[260px] rotate-[-6deg] rounded-[14px] bg-white/95 p-3 shadow-2xl shadow-black/40 ring-1 ring-black/10 md:h-[360px] md:w-[300px]">
            <div className="relative h-full w-full overflow-hidden rounded-[10px] bg-black/5">
              <Image src="/lovify/before.jpg" alt="Before" fill className="object-cover" sizes="(max-width: 768px) 60vw, 300px" priority />
            </div>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-2 py-0.5 text-[11px] font-medium text-white">Before</span>
          </div>
          <div className="absolute -right-4 top-10 hidden rotate-[8deg] rounded-[14px] bg-white/95 p-3 shadow-2xl shadow-black/40 ring-1 ring-black/10 md:block md:h-[380px] md:w-[300px]">
            <div className="relative h-full w-full overflow-hidden rounded-[10px] bg-black/5">
              <Image src="/lovify/after.jpg" alt="After" fill className="object-cover" sizes="300px" />
            </div>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-medium text-white">After</span>
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
        <PriceTile tone="rose" title="Sweetheart" price="from £19" />
        <PriceTile tone="fuchsia" title="Twin-Flame" price="from £49" />
      </section>

      {/* TESTIMONIALS */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Testimonial name="Jade & Milo" quote="Our engagement photo became a museum-worthy print. We cried (happy tears!)." src="/lovify/av-couple1.png" />
          <Testimonial name="Priya" quote="The ‘his & hers’ mugs arrived gift-wrapped with our date on the handle. Perfection." src="/lovify/av-priya.png" />
          <Testimonial name="Noah" quote="Lovify turned an old Polaroid into an anniversary card we’ll keep forever." src="/lovify/av-noah.png" />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/10 bg-black/30 py-8 text-center text-sm text-white/70">
        <p>© {new Date().getFullYear()} Lovify · Made with love by AI Gifts</p>
      </footer>

      {/* Inline CSS for sparkle & hearts */}
      <style jsx>{`
        .hearts-glow {
          background-image:
            radial-gradient(18px 18px at 8% 45%, rgba(251,113,133,.9), transparent 60%),
            radial-gradient(18px 18px at 16% 45%, rgba(240,171,252,.8), transparent 60%),
            radial-gradient(18px 18px at 25% 45%, rgba(244,114,182,.9), transparent 60%),
            radial-gradient(18px 18px at 33% 45%, rgba(251,113,133,.9), transparent 60%),
            radial-gradient(18px 18px at 41% 45%, rgba(240,171,252,.8), transparent 60%),
            radial-gradient(18px 18px at 50% 45%, rgba(244,114,182,.9), transparent 60%),
            radial-gradient(18px 18px at 58% 45%, rgba(251,113,133,.9), transparent 60%),
            radial-gradient(18px 18px at 66% 45%, rgba(240,171,252,.8), transparent 60%),
            radial-gradient(18px 18px at 75% 45%, rgba(244,114,182,.9), transparent 60%),
            radial-gradient(18px 18px at 83% 45%, rgba(251,113,133,.9), transparent 60%),
            radial-gradient(18px 18px at 91% 45%, rgba(240,171,252,.8), transparent 60%);
          filter: blur(8px);
          opacity: 0.85;
          mix-blend-mode: screen;
        }
        .petals:after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(2px 2px at 10% 18%, rgba(255,210,220,0.7), transparent 60%),
            radial-gradient(2px 2px at 22% 12%, rgba(255,180,195,0.55), transparent 60%),
            radial-gradient(2px 2px at 35% 22%, rgba(255,210,220,0.65), transparent 60%),
            radial-gradient(2px 2px at 48% 16%, rgba(255,180,195,0.5), transparent 60%),
            radial-gradient(2px 2px at 61% 26%, rgba(255,210,220,0.7), transparent 60%),
            radial-gradient(2px 2px at 72% 14%, rgba(255,180,195,0.55), transparent 60%),
            radial-gradient(2px 2px at 84% 24%, rgba(255,210,220,0.7), transparent 60%),
            radial-gradient(2px 2px at 93% 16%, rgba(255,180,195,0.55), transparent 60%);
          animation: twinkle 3s linear infinite;
          mix-blend-mode: screen;
        }
        @keyframes twinkle { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.9; } }
      `}</style>
    </main>
  );
}

/* UI bits */

function RibbonButton({
  href,
  children,
  primary = false,
}: { href: string; children: React.ReactNode; primary?: boolean }) {
  const ribbon = {
    borderImage:
      'repeating-linear-gradient(45deg,#ffffff 0 6px,#fb7185 6px 12px,#ffffff 12px 18px,#a78bfa 18px 24px) 8',
  } as React.CSSProperties;

  return (
    <Link
      href={href}
      className={[
        'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
        primary
          ? 'bg-gradient-to-r from-rose-600 to-fuchsia-500 text-rose-50 hover:opacity-90'
          : 'text-white hover:bg-white/10',
      ].join(' ')}
      style={!primary ? { borderWidth: 2, borderStyle: 'solid', borderImage: ribbon.borderImage } : undefined}
    >
      {children}
    </Link>
  );
}

function ProductCard({ title, src, href }: { title: string; src: string; href: string }) {
  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-[#101013] transition hover:border-white/20"
    >
      <div className="relative aspect-square">
        <div className="absolute inset-0 m-4 rounded-xl bg-[radial-gradient(260px_140px_at_70%_30%,rgba(251,113,133,.12),transparent_60%),radial-gradient(240px_120px_at_30%_80%,rgba(167,139,250,.12),transparent_60%)]" />
        <div className="relative z-10 h-full w-full p-4">
          <div className="relative h-full w-full overflow-hidden rounded-xl bg-black/20 ring-1 ring-white/10">
            <Image
              src={src}
              alt={title}
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
              sizes="(max-width:768px) 50vw, 25vw"
            />
          </div>
        </div>
      </div>
      <div className="px-4 pb-4 pt-1 text-center text-sm font-medium tracking-wide text-white/90">
        {title}
      </div>
    </Link>
  );
}

function PriceTile({ title, price, tone }: { title: string; price: string; tone: 'rose' | 'fuchsia' }) {
  const ring =
    tone === 'rose'
      ? 'shadow-[0_0_0_1px_rgba(251,113,133,.25)_inset] bg-gradient-to-b from-[#231217] to-[#140d10]'
      : 'shadow-[0_0_0_1px_rgba(167,139,250,.25)_inset] bg-gradient-to-b from-[#1f1828] to-[#130f18]';
  const pill =
    tone === 'rose'
      ? 'bg-rose-600/25 text-rose-200'
      : 'bg-fuchsia-600/25 text-fuchsia-200';
  return (
    <div className={`rounded-2xl border border-white/10 p-6 text-center ${ring}`}>
      <div className="mb-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pill}`}>{title}</span>
      </div>
      <div className="text-4xl font-extrabold tracking-wide">{price}</div>
      <p className="mt-1 text-sm text-white/75">Lovify bundles · premium paper & inks</p>
    </div>
  );
}

function Testimonial({ name, quote, src }: { name: string; quote: string; src: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-[#0f0f10]/70 px-5 py-6 text-center backdrop-blur-sm">
      <div className="relative mb-3 h-16 w-16">
        <Image src={src} alt={name} fill className="rounded-full object-cover ring-2 ring-white/10" sizes="64px" />
      </div>
      <p className="mb-2 max-w-[20rem] text-sm text-white/90">“<span className="font-medium">{quote}</span>”</p>
      <div className="text-xs text-white/70">{name}</div>
    </div>
  );
}

/* DATA — swap to your assets under /public/lovify */
const PRODUCTS = [
  { title: 'Framed love prints', src: '/lovify/prod-framed.png', href: '/lovify/products?cat=prints' },
  { title: 'Anniversary cards',  src: '/lovify/prod-cards.png',  href: '/lovify/products?cat=cards' },
  { title: 'Couple mugs',        src: '/lovify/prod-mugs.png',   href: '/lovify/products?cat=mugs' },
  { title: 'Cushions',           src: '/lovify/prod-cushion.png',href: '/lovify/products?cat=cushions' },
  // extras you can enable later:
  // { title: 'Vow / memory books', src: '/lovify/prod-book.png', href: '/lovify/products?cat=books' },
  // { title: 'Love calendar',      src: '/lovify/prod-calendar.png', href: '/lovify/products?cat=calendars' },
];
