'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

type Props = {
  before: string
  after: string
  altBefore?: string
  altAfter?: string
  className?: string
  /** timings (ms) */
  beforeDelay?: number
  fogIn?: number
  crossfade?: number
  settle?: number
  /** reveal tuning */
  flashMs?: number          // how long the white flash lasts
  flashOpacity?: number     // flash intensity 0–1
  afterBrightness?: number  // brighten final image (CSS filter)
  gradeStrength?: number    // 0–1: vignette/grade strength
}

export default function FogAutoplay({
  before,
  after,
  altBefore = 'Before',
  altAfter = 'After',
  className = '',
  beforeDelay = 1800,
  fogIn = 1100,
  crossfade = 1200,
  settle = 800,
  flashMs = 120,             // ⬅ shorter flash
  flashOpacity = 0.45,       // ⬅ softer flash
  afterBrightness = 1.18,    // ⬅ brighten spooky image
  gradeStrength = 0.45,      // ⬅ reduce heavy darkening
}: Props) {
  // 0 pristine, 1 fog-in, 2 crossfade (reveal), 3 settle, 4 fog-out
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), beforeDelay)
    const t2 = setTimeout(() => setPhase(2), beforeDelay + fogIn)
    const t3 = setTimeout(() => setPhase(3), beforeDelay + fogIn + crossfade)
    const t4 = setTimeout(() => setPhase(4), beforeDelay + fogIn + crossfade + settle)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [beforeDelay, fogIn, crossfade, settle])

  const beforeOpacity = useMemo(() => (phase < 2 ? 'opacity-100' : 'opacity-0'), [phase])
  const afterOpacity  = useMemo(() => (phase < 2 ? 'opacity-0'   : 'opacity-100'), [phase])
  const fogOpacity    = useMemo(() => (phase === 0 ? 'opacity-0' : phase < 4 ? 'opacity-95' : 'opacity-0'), [phase])

  const flashNow = phase === 2

  return (
    <div
      className={`relative h-[420px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e11] shadow-xl ${className}`}
      style={
        {
          // CSS vars for easy tuning

          '--flash-ms': `${flashMs}ms`,
          '--flash-op': flashOpacity,
          '--grade-k': gradeStrength,
          '--after-bright': afterBrightness,
        } as React.CSSProperties
      }
    >
      {/* BEFORE */}
      <Image
        src={before}
        alt={altBefore}
        fill
        priority
        sizes="(min-width:1024px) 560px, 100vw"
        className={`object-cover object-[50%_22%] md:object-[50%_26%] transition-opacity duration-[${crossfade}ms] ${beforeOpacity}`}
      />

      {/* AFTER (brightened) */}
      <Image
        src={after}
        alt={altAfter}
        fill
        priority
        sizes="(min-width:1024px) 560px, 100vw"
        className={`object-cover object-[50%_22%] md:object-[50%_26%] transition-opacity duration-[${crossfade}ms] ${afterOpacity}`}
        style={{ filter: 'brightness(var(--after-bright)) contrast(1.05) saturate(1.06)' }}
      />

      {/* Softer color grade & vignette (lighter than before) */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}
        style={{
          background:
            `radial-gradient(140% 100% at 50% 62%, rgba(0,0,0, calc(.25 * var(--grade-k))) 0%, rgba(0,0,0, calc(.42 * var(--grade-k))) 58%, rgba(0,0,0, calc(.58 * var(--grade-k))) 100%),` +
            `linear-gradient(0deg, rgba(0,22,24, calc(.20 * var(--grade-k))), rgba(0,22,24, calc(.20 * var(--grade-k))))`,
          mixBlendMode: 'multiply',
        }}
      />

      {/* FOG */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={`fog fog-a ${fogOpacity}`} style={{ transition: `opacity ${fogIn}ms ease, filter 300ms ease` }} />
        <div className={`fog fog-b ${fogOpacity}`} style={{ transition: `opacity ${fogIn}ms ease, filter 300ms ease` }} />
        <div className={`fog fog-c ${fogOpacity}`} style={{ transition: `opacity ${fogIn}ms ease, filter 300ms ease` }} />
      </div>

      {/* Quick white flash */}
      <div
        className={`pointer-events-none absolute inset-0 bg-white ${flashNow ? 'opacity-[var(--flash-op)]' : 'opacity-0'}`}
        style={{ transition: 'opacity var(--flash-ms) ease-out' }}
      />

      {/* Subtle frame & vignette edge */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
      <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ boxShadow: 'inset 0 0 90px 30px rgba(0,0,0,.4)' }} />

      <style jsx>{`
        .fog { position: absolute; inset: -35%; filter: blur(28px) saturate(115%); will-change: transform, opacity; }
        .fog-a {
          background:
            radial-gradient(1400px 700px at 0% 40%, rgba(4,12,16,.55), transparent 60%),
            radial-gradient(900px 520px  at 35% 20%, rgba(6,12,16,.36), transparent 64%),
            radial-gradient(1100px 780px at 78% 75%, rgba(6,10,14,.32), transparent 62%);
          animation: driftA 12s ease-in-out infinite alternate;
        }
        .fog-b {
          background:
            radial-gradient(900px 560px  at 12% 72%, rgba(6,10,14,.34), transparent 62%),
            radial-gradient(650px 480px  at 55% 35%, rgba(8,12,14,.30), transparent 64%),
            radial-gradient(1100px 760px at 95% 30%, rgba(8,10,12,.28), transparent 62%);
          animation: driftB 16s ease-in-out infinite alternate;
        }
        .fog-c {
          background:
            radial-gradient(1100px 620px at 25% 50%, rgba(8,10,12,.22), transparent 66%),
            radial-gradient(800px 520px  at 70% 40%, rgba(8,10,12,.18), transparent 66%);
          animation: driftC 20s ease-in-out infinite alternate;
        }
        @keyframes driftA { 0% { transform: translateX(-12%) translateY(-2%) } 100% { transform: translateX(12%) translateY(2%) } }
        @keyframes driftB { 0% { transform: translateX(10%) translateY(2%) } 100% { transform: translateX(-10%) translateY(-1%) } }
        @keyframes driftC { 0% { transform: translateX(-6%) translateY(1%) } 100% { transform: translateX(6%) translateY(-2%) } }

        @media (prefers-reduced-motion: reduce) {
          .fog-a, .fog-b, .fog-c { animation: none; }
        }
      `}</style>
    </div>
  )
}
