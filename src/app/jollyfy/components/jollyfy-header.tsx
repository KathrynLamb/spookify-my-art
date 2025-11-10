"use client";

import { useState, useEffect } from "react";
// import { AuthDialog } from "./auth-dialog";
import Link from "next/link";
import Image from "next/image";

import type { Session } from "next-auth";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/app/spookify/components/auth-dialog";
import { UserButton } from "@/app/spookify/components/user-button";

export default function JollyfyHeader({ session }: { session: Session | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = () => "text-white/70 hover:text-white";

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all ${
          scrolled
            ? "backdrop-blur bg-black/70 supports-[backdrop-filter]:bg-black/40 shadow-[0_10px_30px_rgba(0,0,0,.35)] border-b border-white/10"
            : "bg-black border-b border-transparent"
        }`}
      >
        <div className="h-[3px] w-full bg-[linear-gradient(90deg,#8B73FF,transparent_18%,#FF6A2B_55%,transparent_82%)] opacity-60" />

        <div className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/spookify" className="flex items-center gap-2 group">
            <div className="relative h-7 w-7 rounded-lg overflow-hidden ring-1 ring-white/15">
              <Image src="/favicon.ico" alt="" fill className="object-cover" />
            </div>
            <span className="font-extrabold tracking-tight text-xl">
              <span className="bg-clip-text text-transparent bg-[linear-gradient(90deg,#8B73FF_0%,##8a1115_60%,#32a852_100%)]">
                Jollyfy
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/upload" className={isActive()}>Upload</Link>
            <Link href="/products" className={isActive()}>Products</Link>
            <Link href="/help" className={isActive()}>Help</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center rounded-full border border-[#7B5CFF] px-3 py-1.5 text-sm text-white hover:bg-[#7B5CFF]/10"
            >
              View products
            </Link>

            {session ? (
              <UserButton />
            ) : (
              <Button
                onClick={() => setShowDialog(true)}
                // onClick={() => console.log('true hould open dialog')}
                className="inline-flex items-center rounded-full bg-[#FF6A2B] hover:bg-[#FF814E] px-3 py-1.5 text-sm text-black font-medium shadow-[0_0_0_6px_rgba(255,106,43,.15)]"
              >
                Sign Up
              </Button>
            )}
          </div>
        </div>
      </header>

      <AuthDialog open={showDialog} onClose={() => setShowDialog(false)} />
    </>
  );
}
