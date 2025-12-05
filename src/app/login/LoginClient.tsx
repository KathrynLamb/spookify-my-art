// src/app/login/LoginClient.tsx
"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginClient({ nextUrl }: { nextUrl?: string }) {
  const callbackUrl = nextUrl || "/dashboard";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0B0D] text-white">
      {/* Ambient gradient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute bottom-[-160px] left-[10%] h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute top-[22%] right-[6%] h-[380px] w-[380px] rounded-full bg-orange-400/10 blur-3xl" />
      </div>

      {/* Subtle noise layer (optional vibe) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-soft-light"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="mx-auto grid min-h-screen max-w-6xl place-items-center px-6 py-16">
        <div className="w-full max-w-md">
          {/* Brand mini header */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <span className="text-lg">🎁</span>
            </span>
            <span className="text-lg font-semibold tracking-tight">
              <span className="bg-gradient-to-r from-fuchsia-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
                AI Gifts
              </span>
            </span>
          </div>

          {/* Card */}
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            {/* Gradient hairline */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-[2px] rounded-t-3xl bg-gradient-to-r from-fuchsia-500/60 via-orange-400/60 to-amber-300/60"
            />

            <h1 className="text-center text-2xl font-bold tracking-tight">
              Join AI Gifts
            </h1>
            <p className="mt-2 text-center text-sm text-white/65">
              Save your creations, redo images, and track orders.
            </p>

            {/* Value bullets */}
            <ul className="mt-5 grid gap-2 text-xs text-white/60 sm:grid-cols-3">
              <li className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-center">
                Auto-save projects
              </li>
              <li className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-center">
                One-click reprints
              </li>
              <li className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-center">
                Order history
              </li>
            </ul>

            {/* CTA */}
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => signIn("google", { callbackUrl })}
                className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF6A2B] to-[#FF9A3D] px-4 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(255,106,43,0.25)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0D]"
              >
                {/* Simple Google-ish mark */}
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/10">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    aria-hidden
                    className="opacity-80"
                  >
                    <path
                      fill="currentColor"
                      d="M12 2a10 10 0 0 0 0 20c2.7 0 5-1 6.8-2.7l-2.8-2.2A5.9 5.9 0 1 1 16.4 9H12v4h8a10 10 0 0 0-8-11Z"
                    />
                  </svg>
                </span>
                Continue with Google
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full ring-1 ring-white/10"
                />
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] uppercase tracking-widest text-white/35">
                  or
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0D]"
              >
                Maybe later
              </Link>
            </div>

            {/* Trust + small print */}
            <p className="mt-5 text-center text-[10px] text-white/40">
              By continuing, you agree to our Terms and acknowledge our Privacy
              Policy.
            </p>
          </div>

          {/* Secondary footer */}
          <div className="mt-6 text-center text-[11px] text-white/35">
            Tip: signing in unlocks saved designs and faster checkout.
          </div>
        </div>
      </div>
    </main>
  );
}
