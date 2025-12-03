
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
// import { usePathname } from 'next/navigation';
import type { Session } from 'next-auth';
import { Button } from '@/components/ui/button';
import { UserButton } from './user-button';
import { Menu, X } from 'lucide-react';
import { AuthDialog } from './auth-dialog';

type Props = { session: Session | null };

export default function SiteHeaderClient({ session }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [open, setOpen] = useState(false);

  console.log("SESSION", session)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={[
          'sticky top-0 z-50 transition-all',
          scrolled
            ? 'backdrop-blur bg-black/70 supports-[backdrop-filter]:bg-black/45 shadow-[0_10px_30px_rgba(0,0,0,.35)] border-b border-[#24262B]'
            : 'bg-[#0B0B0D] border-b border-transparent',
        ].join(' ')}
      >
        {/* Gradient hairline (brand) */}
        <div
          aria-hidden
          className="h-[3px] w-full bg-[linear-gradient(90deg,#F15BB5,transparent_18%,#FF8A34_55%,transparent_82%)] opacity-70"
        />

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          {/* Brand */}
          <Link href="/" className="group flex items-center gap-2" aria-label="AI Gifts home">
            <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg ring-1 ring-white/15">
              {/* <Image src="/favicon.ico" alt="" fill className="object-cover" /> */}
              <Image src="/favicon.svg" alt="" fill className="object-cover" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              <span className="bg-[linear-gradient(90deg,#F15BB5_0%,#FF8A34_60%,#FFB057_100%)] bg-clip-text text-transparent">
                AI Gifts
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          {/* <nav className="hidden items-center gap-7 text-sm md:flex">
            <Link href="/upload" className={isActive('/upload')}>
              Upload
            </Link>
            <Link href="/products" className={isActive('/products')}>
              Products
            </Link>
            <Link href="/help" className={isActive('/help')}>
              Help
            </Link>
          </nav> */}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* <Link
              href="/products"
              className="hidden rounded-full border border-[#24262B] px-3 py-1.5 text-sm text-white hover:border-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 sm:inline-flex"
            >
              View products
            </Link> */}

            {session ? (
              <UserButton />
            ) : (
              <Button
                onClick={() => setShowDialog(true)}
                className="inline-flex cursor-pointer items-center rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400 px-3 py-1.5 text-sm font-semibold text-black shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset] hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              >
                Sign Up
              </Button>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((v) => !v)}
              className="ml-1 inline-flex items-center rounded-lg p-2 text-white/80 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 md:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {open && (
          <div className="mx-auto max-w-7xl px-4 pb-3 md:hidden">
            <nav className="grid gap-1 rounded-2xl border border-[#24262B] bg-[#111216] p-2">
              <Link
                href="/upload"
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 text-sm text-white/90 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              >
                Upload
              </Link>
              <Link
                href="/products"
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 text-sm text-white/90 hover:bg:white/5 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              >
                Products
              </Link>
              <Link
                href="/help"
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 text-sm text-white/90 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              >
                Help
              </Link>
              {!session && (
                <button
                  onClick={() => {
                    setOpen(false);
                    setShowDialog(true);
                  }}
                  className="mt-1 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-400 px-3 py-2 text-sm font-semibold text-black"
                >
                  Sign up
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Auth dialog lives at the root so it can be triggered from header */}
      <AuthDialog open={showDialog} onClose={() => setShowDialog(false)} />
    </>
  );
}

