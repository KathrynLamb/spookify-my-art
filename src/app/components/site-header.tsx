'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) =>
    pathname === href ? 'text-white' : 'text-white/70 hover:text-white';

  return (
    <header
      className={`sticky top-0 z-40 transition-all ${
        scrolled
          ? 'backdrop-blur bg-black/70 supports-[backdrop-filter]:bg-black/40 shadow-[0_10px_30px_rgba(0,0,0,.35)] border-b border-white/10'
          : 'bg-black border-b border-transparent'
      }`}
    >
      {/* brand glow bar */}
      <div className="h-[3px] w-full bg-[linear-gradient(90deg,#8B73FF,transparent_18%,#FF6A2B_55%,transparent_82%)] opacity-60" />

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-7 w-7 rounded-lg overflow-hidden ring-1 ring-white/15">
            <Image src="/favicon.ico" alt="" fill className="object-cover" />
          </div>
          <span className="font-extrabold tracking-tight text-xl">
            <span className="bg-clip-text text-transparent bg-[linear-gradient(90deg,#8B73FF_0%,#FF6A2B_60%,#FF8A53_100%)]">
              Spookify
            </span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/upload"   className={isActive('/upload')}>Upload</Link>
          <Link href="/products" className={isActive('/products')}>Products</Link>
          <Link href="/help"     className={isActive('/help')}>Help</Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/products"
            className="hidden sm:inline-flex items-center rounded-full border border-[#7B5CFF] px-3 py-1.5 text-sm text-white hover:bg-[#7B5CFF]/10"
          >
            View products
          </Link>
          <Link
            href="/upload"
            className="inline-flex items-center rounded-full bg-[#FF6A2B] hover:bg-[#FF814E] px-3 py-1.5 text-sm text-black font-medium shadow-[0_0_0_6px_rgba(255,106,43,.15)]"
          >
            New image
          </Link>
        </div>
      </div>
    </header>
  );
}
