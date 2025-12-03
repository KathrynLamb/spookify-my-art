// app/not-found.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
// import Image from "next/image";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0B0B0D] text-white px-6 py-20 relative overflow-hidden">
      {/* Soft ambient glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-200px] left-[25%] h-[500px] w-[500px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute bottom-[-220px] right-[10%] h-[420px] w-[420px] rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute top-[200px] right-[30%] h-[380px] w-[380px] rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <h1 className="text-7xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-fuchsia-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
          404
        </h1>

        <p className="text-xl font-semibold mb-3">
          This page wandered into another dimension.
        </p>

        <p className="text-white/70 leading-relaxed mb-8">
          The link you followed doesn’t exist—or it’s been magically turned into 
          something else. Let’s guide you back to the gallery.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
          <Link
            href="/"
            className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-400 px-6 py-3 text-sm font-semibold text-black shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset] hover:opacity-95"
          >
            Go home
          </Link>

        {/* {session && sessionStorage.user && (
          <Link
          href={`/projects/${session.user.id}`}
          className="rounded-xl border border-[#24262B] px-6 py-3 text-sm font-semibold text-white hover:border-emerald-600"
        >
          Start creating
        </Link> */}
        {/* )} */}
      
        </div>
      </motion.div>

      {/* Decorative mini preview */}
      {/* <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, delay: 0.2 }}
        className="mt-12 relative w-[260px] h-[160px] rounded-2xl border border-white/10 overflow-hidden bg-black/20 shadow-lg"
      >
        <Image
          src="/ai_gifts_landing/demo-spookify.jpg"
          alt="Preview artwork"
          fill
          className="object-cover"
        />
        <div className="absolute top-2 left-2 bg-white/10 px-2 py-1 text-xs rounded-full backdrop-blur">
          Lost preview
        </div>
      </motion.div> */}
    </main>
  );
}
