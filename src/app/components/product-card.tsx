'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
// import { useCurrency, type Currency } from '..'
import PriceTag from './price-tag'
import { ChipGroup } from '../components/ui/chips'
import { useCurrency } from '@/contexts/CurrencyContext'

type Orientation = 'Vertical' | 'Horizontal'
type FrameColor = 'Black' | 'White' | 'Wood' | 'Dark wood'

export type Variant = {
  sizeLabel: string
  frameColor?: FrameColor
  orientation: Orientation
  productUid: string
  prices: Partial<Record<Currency, number>>
}

type Props = {
  title: string
  artSrc: string
  mockupSrc: string
  variants: Variant[]
  onSelect: (v: Variant) => void
  controls?: { showFrame?: boolean }
}

const isDataOrBlob = (s: string) => /^(data:|blob:)/i.test(s)

export default function ProductCard({
  title, artSrc, mockupSrc, variants, onSelect, controls = { showFrame: true },
}: Props) {
  const { currency } = useCurrency()

  // All options
  const sizeOptions = useMemo(
    () => Array.from(new Set(variants.map(v => v.sizeLabel))),
    [variants],
  )
  const orientationOptions = useMemo(
    () => Array.from(new Set(variants.map(v => v.orientation))),
    [variants],
  )
  const frameOptions = useMemo(
    () => Array.from(new Set(variants.map(v => v.frameColor).filter(Boolean))) as FrameColor[],
    [variants],
  )

  // Local state
  const [size, setSize] = useState<string>(sizeOptions[0])
  const [orientation, setOrientation] = useState<Orientation>(orientationOptions[0]!)
  const [frame, setFrame] = useState<FrameColor | undefined>(
    controls.showFrame ? frameOptions[0] : undefined,
  )

  // Availability helpers
  const isVariantAvailable = (s: string, o: Orientation, f?: FrameColor) =>
    variants.some(v =>
      v.sizeLabel === s &&
      v.orientation === o &&
      (controls.showFrame ? v.frameColor === f : true),
    )

  const isFrameDisabled = (f: FrameColor) => !isVariantAvailable(size, orientation, f)
  const isSizeDisabled = (s: string) => !isVariantAvailable(s, orientation, frame)
  const isOrientationDisabled = (o: Orientation) => !isVariantAvailable(size, o, frame)

  // Active variant
  const active = useMemo(
    () =>
      variants.find(v =>
        v.sizeLabel === size &&
        v.orientation === orientation &&
        (controls.showFrame ? v.frameColor === frame : true),
      ),
    [variants, size, orientation, frame, controls.showFrame],
  )

  const activePrice = active?.prices[currency] ?? active?.prices.GBP

  // Auto-fix illegal selection if user picks a chip that makes current combo invalid
  // (keeps UI “always resolvable”)
  if (controls.showFrame && frame && isFrameDisabled(frame)) {
    const next = frameOptions.find(f => !isFrameDisabled(f))
    if (next && next !== frame) setFrame(next)
  }
  if (isSizeDisabled(size)) {
    const next = sizeOptions.find(s => !isSizeDisabled(s))
    if (next && next !== size) setSize(next)
  }
  if (isOrientationDisabled(orientation)) {
    const next = orientationOptions.find(o => !isOrientationDisabled(o))
    if (next && next !== orientation) setOrientation(next)
  }

  return (
    <div className="rounded-2xl bg-[#0e0e11] border border-white/10 overflow-hidden shadow-lg">
      {/* Artwork + overlay */}
      <div className="relative aspect-[16/9] bg-[#0b0b0e]">
        <Image
          src={artSrc}
          alt=""
          fill
          unoptimized={isDataOrBlob(artSrc)}
          className="object-cover"
          sizes="(min-width:1024px) 40vw, 90vw"
        />
        <Image
          src={mockupSrc}
          alt=""
          fill
          className="object-cover pointer-events-none"
          sizes="(min-width:1024px) 40vw, 90vw"
        />
      </div>

      {/* Content */}
      <div className="p-4 pb-16 space-y-3 relative">
        <div className="flex items-baseline justify-between">
          <div className="font-semibold">{title}</div>
          <PriceTag amount={activePrice} currency={currency} />
        </div>

        {/* Chips */}
        <div className="space-y-3">
          <div>
            <div className="text-xs uppercase text-white/60 mb-1">Size</div>
            <ChipGroup
              options={sizeOptions as readonly string[]}
              value={size}
              onChange={setSize}
              isDisabled={isSizeDisabled}
            />
          </div>

          {controls.showFrame && (
            <div>
              <div className="text-xs uppercase text-white/60 mb-1">Frame</div>
              <ChipGroup
                options={frameOptions as readonly FrameColor[]}
                value={frame as FrameColor}
                onChange={setFrame as (f: FrameColor) => void}
                isDisabled={isFrameDisabled}
              />
            </div>
          )}

          <div>
            <div className="text-xs uppercase text-white/60 mb-1">Orientation</div>
            <ChipGroup
              options={orientationOptions as readonly Orientation[]}
              value={orientation}
              onChange={setOrientation}
              isDisabled={isOrientationDisabled}
            />
          </div>
        </div>

        {/* Sticky CTA inside the card */}
        <div className="pointer-events-none absolute left-0 right-0 bottom-0">
          <div className="h-16 bg-gradient-to-t from-[#0e0e11] to-transparent" />
          <div className="pointer-events-auto flex items-center justify-between px-4 pb-3">
            <div className="text-white/80">
              <PriceTag amount={activePrice} currency={currency} />
            </div>
            <button
              disabled={!active}
              onClick={() => active && onSelect(active)}
              className="inline-flex items-center rounded-full bg-orange-600 hover:bg-orange-500 px-4 py-2 text-sm disabled:opacity-50"
            >
              {active ? 'Select' : 'Not available'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
