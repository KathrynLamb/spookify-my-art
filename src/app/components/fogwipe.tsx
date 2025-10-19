'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

type Props = {
  before: string
  after: string
  altBefore?: string
  altAfter?: string
  className?: string
  /** ms timings */
  fogIn?: number         // fog fade-in time
  crossfade?: number     // before→after fade time
  settle?: number        // time to linger with fog on
  fogOut?: number        // fog fade-out time
}

export default function FogAutoplay({
  before,
  after,
  altBefore = 'Before',
  altAfter = 'After',
  className = '',
  fogIn = 700,
  crossfade = 800,
  settle = 700,
  // fogOut = 900,
}: Props) {
  // phases: 0=before visible, 1=fog in, 2=crossfade, 3=settle, 4=fog out (done)
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0)

  useEffect(() => {
    // Run once on mount
    const t1 = setTimeout(() => setPhase(1), 50)                   // fog in
    const t2 = setTimeout(() => setPhase(2), 50 + fogIn)           // swap under fog
    const t3 = setTimeout(() => setPhase(3), 50 + fogIn + crossfade) // linger with fog
    const t4 = setTimeout(
      () => setPhase(4),
      50 + fogIn + crossfade + settle
    ) // fog out
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [fogIn, crossfade, settle])

  // precompute opacity classes
  const beforeOpacity = useMemo(() => {
    if (phase < 2) return 'opacity-100'
    return 'opacity-0'
  }, [phase])

  const afterOpacity = useMemo(() => {
    if (phase < 2) return 'opacity-0'
    return 'opacity-100'
  }, [phase])

  const fogOpacity = useMemo(() => {
    if (phase === 0) return 'opacity-0'
    if (phase === 1 || phase === 2 || phase === 3) return 'opacity-90'
    return 'opacity-0'
  }, [phase])

  return (
    <div className={`relative h-[420px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e11] shadow-xl ${className}`}>
      {/* BEFORE */}
      <Image
        src={before}
        alt={altBefore}
        fill
        priority
        sizes="(min-width:1024px) 560px, 100vw"
        className={`object-cover transition-opacity duration-[${crossfade}ms] ${beforeOpacity} mt-100`}
      />
      {/* AFTER */}
      <Image
        src={after}
        alt={altAfter}
        fill
        priority
        sizes="(min-width:1024px) 560px, 100vw"
        className={`object-cover transition-opacity duration-[${crossfade}ms] ${afterOpacity} mt-50`}
      />

      {/* FOG (3 parallax layers that drift) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`fog fog-a ${fogOpacity}`}
          style={{ transition: `opacity ${fogIn}ms ease, filter 300ms ease` }}
        />
        <div
          className={`fog fog-b ${fogOpacity}`}
          style={{ transition: `opacity ${fogIn}ms ease, filter 300ms ease` }}
        />
        <div
          className={`fog fog-c ${fogOpacity}`}
          style={{ transition: `opacity ${fogIn}ms ease, filter 300ms ease` }}
        />
      </div>

      {/* frame ring */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />

      <style jsx>{`
        .fog {
          position: absolute;
          inset: -35%;
          filter: blur(28px) saturate(110%);
          will-change: transform, opacity;
        }
        .fog-a {
          background:
            radial-gradient(1200px 600px at 0% 45%, rgba(0,0,0,.55), transparent 60%),
            radial-gradient(700px 520px  at 35% 20%, rgba(0,0,0,.35), transparent 62%),
            radial-gradient(900px 680px  at 78% 75%, rgba(0,0,0,.28), transparent 60%);
          animation: driftA 12s ease-in-out infinite alternate;
        }
        .fog-b {
          background:
            radial-gradient(900px 560px  at 10% 70%, rgba(0,0,0,.35), transparent 60%),
            radial-gradient(650px 480px  at 55% 35%, rgba(0,0,0,.30), transparent 62%),
            radial-gradient(1000px 700px at 95% 30%, rgba(0,0,0,.26), transparent 60%);
          animation: driftB 16s ease-in-out infinite alternate;
        }
        .fog-c {
          background:
            radial-gradient(1100px 620px at 25% 50%, rgba(0,0,0,.22), transparent 62%),
            radial-gradient(800px 520px  at 70% 40%, rgba(0,0,0,.20), transparent 64%);
          animation: driftC 20s ease-in-out infinite alternate;
        }
        @keyframes driftA {
          0%   { transform: translateX(-12%) translateY(-2%); }
          100% { transform: translateX(12%)  translateY(2%);  }
        }
        @keyframes driftB {
          0%   { transform: translateX(10%) translateY(2%); }
          100% { transform: translateX(-10%) translateY(-1%); }
        }
        @keyframes driftC {
          0%   { transform: translateX(-6%) translateY(1%); }
          100% { transform: translateX(6%)  translateY(-2%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .fog-a, .fog-b, .fog-c { animation: none; }
        }
      `}</style>
    </div>
  )
}
