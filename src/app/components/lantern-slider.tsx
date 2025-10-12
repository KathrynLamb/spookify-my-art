// src/app/components/before-after/LanternSlider.tsx
'use client'

import Image from 'next/image'
import { CSSProperties, useEffect, useRef, useState } from 'react'

type Props = {
  before: string
  after: string
  alt?: string
  start?: number // 0..1
  className?: string
}

export default function LanternSlider({ before, after, alt = '', start = 0.55, className = '' }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [reveal, setReveal] = useState(start)

  // keyboard accessibility
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (!el.contains(document.activeElement)) return
      const step = e.shiftKey ? 0.1 : 0.03
      if (e.key === 'ArrowLeft') setReveal(r => Math.max(0, +(r - step).toFixed(4)))
      if (e.key === 'ArrowRight') setReveal(r => Math.min(1, +(r + step).toFixed(4)))
      if (e.key === ' ' || e.key === 'Enter') setReveal(r => (r < 0.5 ? 1 : 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // drag / tap
  function updateFromClientX(clientX: number) {
    const r = boxRef.current?.getBoundingClientRect()
    if (!r) return
    const x = (clientX - r.left) / r.width
    setReveal(Math.min(1, Math.max(0, x)))
  }

  return (
    <div
    ref={boxRef}
    className={`relative overflow-hidden rounded-2xl bg-[#0c0d10] ${className}`}
    style={{ '--reveal': reveal } as CSSProperties}  // ✅ no `any`
    tabIndex={0}
    aria-label="Before and after slider"
  >
      {/* Before */}
      <Image src={before} alt={alt} width={1200} height={800} className="block w-full h-auto select-none" />

      {/* After (clipped) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          clipPath: 'inset(0 calc((1 - var(--reveal)) * 100%) 0 0)',
          transition: 'clip-path 220ms ease',
        }}
      >
        <Image src={after} alt="" width={1200} height={800} className="block w-full h-auto select-none" />
      </div>

      {/* Lantern handle */}
      <Handle
        reveal={reveal}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture(e.pointerId)
          updateFromClientX(e.clientX)
        }}
        onPointerMove={(e) => e.pressure !== 0 && updateFromClientX(e.clientX)}
        onClick={(e) => updateFromClientX(e.clientX)}
      />
    </div>
  )
}

function Handle({
  reveal,
  onPointerDown,
  onPointerMove,
  onClick,
}: {
  reveal: number
  onPointerDown: React.PointerEventHandler
  onPointerMove: React.PointerEventHandler
  onClick: React.MouseEventHandler
}) {
  return (
    <div
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(reveal * 100)}
      aria-label="Drag to reveal"
      className="absolute inset-y-0"
      style={{ left: `calc(${reveal * 100}% - 20px)` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onClick={onClick}
    >
      {/* center line */}
      <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-white/15" />
      {/* lantern button */}
      <button
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1b1722] p-2 shadow-lg outline-offset-4"
        style={{ filter: 'drop-shadow(0 0 10px rgba(255,140,0,.5))' }}
      >
        <span className="relative grid place-items-center h-10 w-10 rounded-full bg-[#2a2232]">
          {/* “lantern” */}
          <span className="absolute inset-0 rounded-full" style={{
            background: 'radial-gradient(closest-side, rgba(255,156,64,.55), rgba(255,156,64,.15) 60%, transparent 70%)'
          }} />
          {/* tiny bat accent */}
          <span aria-hidden className="text-2xl text-white/80">🕯️</span>
        </span>
      </button>
    </div>
  )
}
