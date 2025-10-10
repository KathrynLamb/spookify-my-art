'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

export type Variant = {
  size: string                  // e.g. "15×20 cm / 6×8″"
  frame: 'White' | 'Wood' | 'Dark wood' | 'Black'
  orientation: 'Vertical' | 'Horizontal'
  productUid: string            // exact Gelato UID for this combo
  priceGBP: number              // your sell price for this combo
}

type Props = {
  title: string
  artSrc: string                // user's spookified image (data: or http(s))
  mockupSrc: string             // PNG overlay with transparent window
  variants: Variant[]           // all supported combinations you want to sell
  onSelect: (v: Variant) => void
}

const isDataOrBlob = (s: string) => /^(data:|blob:)/i.test(s)

export default function ProductCard({
  title, artSrc, mockupSrc, variants, onSelect,
}: Props) {
  // Option lists from your variant set
  const sizeOptions = useMemo(
    () => Array.from(new Set(variants.map(v => v.size))),
    [variants]
  )
  const frameOptions = useMemo(
    () => Array.from(new Set(variants.map(v => v.frame))),
    [variants]
  )
  const orientationOptions = useMemo(
    () => Array.from(new Set(variants.map(v => v.orientation))),
    [variants]
  )

  // Seed defaults from the first variant (with safe fallbacks)
  const first = variants[0]
  const [size, setSize] = useState<string>(first?.size ?? sizeOptions[0] ?? '')
  const [frame, setFrame] = useState<Variant['frame']>(
    first?.frame ?? frameOptions[0] ?? 'Black'
  )
  const [orientation, setOrientation] = useState<Variant['orientation']>(
    first?.orientation ?? orientationOptions[0] ?? 'Vertical'
  )

  // Exact variant matching the three selections
  const active = useMemo(
    () =>
      variants.find(
        (v) => v.size === size && v.frame === frame && v.orientation === orientation,
      ),
    [variants, size, frame, orientation]
  )

  const disabled = variants.length === 0

  return (
    <div className="rounded-2xl bg-[#0e0e11] border border-white/10 overflow-hidden shadow-lg">
      <div className="relative aspect-[16/9] bg-[#0b0b0e]">
        {/* User art (beneath) */}
        <Image
          src={artSrc}
          alt=""
          fill
          unoptimized={isDataOrBlob(artSrc)}
          className="object-cover"
          sizes="(min-width:1024px) 33vw, 50vw"
        />
        {/* Mockup overlay (frame PNG with transparent window) */}
        <Image
          src={mockupSrc}
          alt=""
          fill
          className="object-cover pointer-events-none"
          sizes="(min-width:1024px) 33vw, 50vw"
          priority={false}
        />
      </div>

      <div className="p-4 space-y-3">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-gray-400 mt-0.5">
            {active ? `£${active.priceGBP.toFixed(2)}` : '—'}
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <label className="text-sm">
            <span className="block text-gray-300 mb-1">Size</span>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full rounded border border-white/10 bg-gray-900 px-2 py-1.5"
              disabled={disabled || sizeOptions.length === 0}
            >
              {sizeOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="block text-gray-300 mb-1">Frame</span>
            <select
              value={frame}
              onChange={(e) => setFrame(e.target.value as Variant['frame'])}
              className="w-full rounded border border-white/10 bg-gray-900 px-2 py-1.5"
              disabled={disabled || frameOptions.length === 0}
            >
              {frameOptions.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="block text-gray-300 mb-1">Orientation</span>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as Variant['orientation'])}
              className="w-full rounded border border-white/10 bg-gray-900 px-2 py-1.5"
              disabled={disabled || orientationOptions.length === 0}
            >
              {orientationOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
        </div>

        <button
          disabled={!active}
          onClick={() => active && onSelect(active)}
          className="mt-1 inline-flex items-center rounded-full bg-orange-600 hover:bg-orange-500 px-4 py-2 text-sm disabled:opacity-50"
        >
          {active ? 'Select' : 'Not available'}
        </button>
      </div>
    </div>
  )
}
