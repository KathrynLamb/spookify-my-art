'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  /** Original photo */
  beforeUrl: string
  /** Spookified result */
  afterUrl: string
  /** Alt text should describe the subject; we append “before/after” context where needed */
  alt?: string
  /** Height/width ratio of the stage (e.g., 16/9). Defaults to 16/9 */
  aspect?: number
  /** Auto-reveal animation between 30–70% (disabled if prefers-reduced-motion) */
  autoplay?: boolean
  /** Optional label chips under the stage */
  beforeLabel?: string
  afterLabel?: string
  /** Priority-load the images (use on landing hero only) */
  priority?: boolean
  /** Optional children overlaid (e.g., CTA buttons). Positioned bottom-left. */
  children?: React.ReactNode
}

const isDataOrBlob = (s: string) => /^(data:|blob:)/i.test(s)

/**
 * HeroShowcase
 * - Layered before/after images with a draggable (and keyboard operable) reveal slider.
 * - Responsive, accessible, SSR-safe, and theme-matched (soft neon glow, rounded XL).
 */
export default function HeroShowcase({
  beforeUrl,
  afterUrl,
  alt = 'Before/after artwork showcase',
  aspect = 16 / 9,
  autoplay = true,
  beforeLabel = 'Before',
  afterLabel = 'After',
  priority = false,
  children,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLButtonElement>(null)
  const [reveal, setReveal] = useState<number>(0.62) // 0..1 (portion of AFTER revealed)
  const [mounted, setMounted] = useState(false)

  // Respect reduced motion
  const prefersReducedMotion = usePrefersReducedMotion()
  const enableAutoplay = autoplay && !prefersReducedMotion

  useEffect(() => setMounted(true), [])

  // Autoplay: gently oscillate reveal between 0.3 and 0.7
  useEffect(() => {
    if (!enableAutoplay) return
    let raf = 0
    let dir = 1
    const min = 0.3
    const max = 0.7
    const speed = 0.0007 // smaller = slower
    const tick = () => {
      setReveal(prev => {
        let next = prev + speed * dir
        if (next > max) { next = max; dir = -1 }
        if (next < min) { next = min; dir = 1 }
        return next
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [enableAutoplay])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!containerRef.current) return
    const el = containerRef.current
    el.setPointerCapture(e.pointerId)
    enableAutoplay && e.preventDefault()

    const rect = el.getBoundingClientRect()
    const update = (clientX: number) => {
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width)
      setReveal(x / rect.width)
    }

    update(e.clientX)

    const onMove = (ev: PointerEvent) => update(ev.clientX)
    const onUp = (ev: PointerEvent) => {
      el.releasePointerCapture(ev.pointerId)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
  }, [enableAutoplay])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const STEP = e.shiftKey ? 0.1 : 0.03
    if (e.key === 'ArrowLeft') { setReveal(r => Math.max(0, r - STEP)); e.preventDefault() }
    if (e.key === 'ArrowRight') { setReveal(r => Math.min(1, r + STEP)); e.preventDefault() }
    if (e.key === 'Home') { setReveal(0); e.preventDefault() }
    if (e.key === 'End') { setReveal(1); e.preventDefault() }
  }, [])

  const stageStyle = useMemo(() => {
    // maintain aspect ratio via padding trick
    return { paddingTop: `${100 / (aspect || 16 / 9)}%` }
  }, [aspect])

  // Derive descriptive alts
  const beforeAlt = `${alt} — before`
  const afterAlt = `${alt} — after`

  return (
    <section
      className="relative"
      aria-label="Spookify before and after showcase"
    >
      {/* Soft gradient halo */}
      <div className="pointer-events-none absolute inset-0 -z-10 blur-3xl opacity-40"
           aria-hidden
           style={{
             background:
               'radial-gradient(60% 60% at 20% 10%, rgba(255,153,102,.18), transparent 60%), radial-gradient(60% 60% at 80% 10%, rgba(255,102,204,.14), transparent 60%)'
           }}
      />

      {/* Stage */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0e] shadow-[0_20px_60px_rgba(0,0,0,.35)]"
        style={stageStyle}
      >
        {/* BEFORE layer */}
        <LayeredImage
          src={beforeUrl}
          alt={beforeAlt}
          priority={priority}
          unoptimized={isDataOrBlob(beforeUrl)}
        />

        {/* AFTER layer with masking width */}
        <div
          className="absolute inset-0"
          aria-hidden
          style={{ clipPath: `inset(0 ${100 - reveal * 100}% 0 0)` }}
        >
          <LayeredImage
            src={afterUrl}
            alt={afterAlt}
            priority={priority}
            unoptimized={isDataOrBlob(afterUrl)}
          />
        </div>

        {/* Slider handle */}
        <div
          className="absolute inset-y-0"
          style={{ left: `${reveal * 100}%`, transform: 'translateX(-50%)' }}
          aria-hidden
        >
          {/* line */}
          <div className="h-full w-px bg-white/30 shadow-[0_0_0_1px_rgba(255,255,255,.08),0_0_20px_rgba(255,153,102,.25)]" />
          {/* handle button */}
          <button
            ref={handleRef}
            type="button"
            onPointerDown={onPointerDown}
            onKeyDown={onKeyDown}
            aria-label="Drag to compare before and after"
            title="Drag to compare (← → keys)"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                       h-10 w-10 rounded-full bg-black/70 backdrop-blur
                       border border-white/20
                       shadow-[0_0_0_2px_rgba(0,0,0,.5),0_6px_24px_rgba(0,0,0,.45)]
                       hover:border-white/35 focus:outline-none focus:ring-2 focus:ring-orange-400/60"
          >
            <ArrowsIcon />
          </button>
        </div>

        {/* Children overlay (e.g., CTA buttons) */}
        {children && (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-wrap gap-2">
            <div className="pointer-events-auto">{children}</div>
          </div>
        )}
      </div>

      {/* Labels */}
      <div className="mt-3 flex items-center justify-between text-xs text-white/70">
        <span className="inline-flex items-center gap-2">
          <Dot className="bg-white/30" />
          {beforeLabel}
        </span>
        <span className="inline-flex items-center gap-2">
          {afterLabel}
          <Dot className="bg-orange-400/80" />
        </span>
      </div>
    </section>
  )
}

/* ----------------------------- subcomponents ----------------------------- */

function LayeredImage({
  src,
  alt,
  priority,
  unoptimized,
}: {
  src: string
  alt: string
  priority?: boolean
  unoptimized?: boolean
}) {
  return (
    <div className="absolute inset-0">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        unoptimized={!!unoptimized}
        className="object-cover select-none"
        sizes="(min-width:1280px) 900px, (min-width:768px) 70vw, 95vw"
      />
      {/* subtle inner vignette for mood */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_50%_50%,transparent_55%,rgba(0,0,0,.45))]" aria-hidden />
    </div>
  )
}

function ArrowsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 mx-auto opacity-90" aria-hidden>
      <path
        d="M8.5 7.5 4 12l4.5 4.5M15.5 7.5 20 12l-4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.75"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Dot({ className = '' }: { className?: string }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${className}`} aria-hidden />
}

/* ------------------------------- utilities ------------------------------- */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(m.matches)
    onChange()
    m.addEventListener?.('change', onChange)
    return () => m.removeEventListener?.('change', onChange)
  }, [])
  return reduced
}
