'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import PriceTag from './price-tag'
import { ChipGroup } from '../components/ui/chips'
import { useCurrency } from '@/contexts/CurrencyContext'

type Orientation = 'Vertical' | 'Horizontal'
type FrameColor = 'Black' | 'White' | 'Wood' | 'Dark wood'
type Currency = 'GBP' | 'USD' | 'EUR'

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
  mockupSrc?: string
  variants: Variant[]
  onSelect: (v: Variant) => void
  onSelectLemonSqueezy?: (v: Variant) => void
  controls?: { showFrame?: boolean }
}

const isDataOrBlob = (s: string) => /^(data:|blob:)/i.test(s)

export default function ProductCard({
  title,
  artSrc,
  variants,
  onSelect,
  onSelectLemonSqueezy,
  controls = { showFrame: true },
}: Props) {
  const { currency } = useCurrency()

  const sizeOptions = useMemo(() => [...new Set(variants.map(v => v.sizeLabel))], [variants])
  const orientationOptions = useMemo(() => [...new Set(variants.map(v => v.orientation))], [variants])
  const frameOptions = useMemo(() => [...new Set(variants.map(v => v.frameColor).filter(Boolean))] as FrameColor[], [variants])

  const [size, setSize] = useState<string>(sizeOptions[0])
  const [orientation, setOrientation] = useState<Orientation>(orientationOptions[0]!)
  const [frame, setFrame] = useState<FrameColor | undefined>(controls.showFrame ? frameOptions[0] : undefined)

  const isVariantAvailable = (s: string, o: Orientation, f?: FrameColor) =>
    variants.some(v =>
      v.sizeLabel === s &&
      v.orientation === o &&
      (controls.showFrame ? v.frameColor === f : true)
    )

  const isFrameDisabled = (f: FrameColor) => !isVariantAvailable(size, orientation, f)
  const isSizeDisabled = (s: string) => !isVariantAvailable(s, orientation, frame)
  const isOrientationDisabled = (o: Orientation) => !isVariantAvailable(size, o, frame)

  const active = useMemo(() => {
    return variants.find(v =>
      v.sizeLabel === size &&
      v.orientation === orientation &&
      (controls.showFrame ? v.frameColor === frame : true)
    )
  }, [variants, size, orientation, frame, controls.showFrame])

  const activePrice = active?.prices[currency] ?? active?.prices.GBP

  // Auto-fix illegal selections
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

  const handleBuy = () => {
    if (!active) return
    ;(onSelectLemonSqueezy ?? onSelect)(active)
  }
  

  return (
    <div className="relative flex flex-col rounded-xl overflow-hidden bg-[#0f0f11] border border-white/10 shadow-sm hover:shadow-lg transition">
      {/* Image Preview */}
      {artSrc && (
        <div className="relative w-full bg-black">
          <Image
            src={artSrc}
            alt="Artwork preview"
            width={800}
            height={1000}
            unoptimized={isDataOrBlob(artSrc)}
            className="w-full h-auto object-contain"
          />
        </div>
      )}

      {/* Info + Options */}
      <div className="flex flex-col gap-4 p-4 pb-20">
        {/* Title + Price */}
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold">{title}</h3>
          <PriceTag amount={activePrice} currency={currency} />
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-xs text-white/60 uppercase mb-1">Size</div>
            <ChipGroup
              options={sizeOptions as readonly string[]}
              value={size}
              onChange={setSize}
              isDisabled={isSizeDisabled}
            />
          </div>

          {controls.showFrame && (
            <div>
              <div className="text-xs text-white/60 uppercase mb-1">Frame</div>
              <ChipGroup
                options={frameOptions as readonly FrameColor[]}
                value={frame as FrameColor}
                onChange={setFrame as (f: FrameColor) => void}
                isDisabled={isFrameDisabled}
              />
            </div>
          )}

          <div>
            <div className="text-xs text-white/60 uppercase mb-1">Orientation</div>
            <ChipGroup
              options={orientationOptions as readonly Orientation[]}
              value={orientation}
              onChange={setOrientation}
              isDisabled={isOrientationDisabled}
            />
          </div>
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0f0f11] via-[#0f0f11]/90 to-transparent backdrop-blur-sm p-4 flex items-center justify-between">
        <span className="text-white/90 font-medium">
          <PriceTag amount={activePrice} currency={currency} />
        </span>
        {/* <button
  disabled={!active}
  onClick={() => active && onSelect(active)}
  className="flex items-center justify-center rounded-full bg-orange-600 hover:bg-orange-500 px-5 h-10 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
>
  {active ? 'Select' : 'Not available'}
</button> */}


<button
disabled={!active}
onClick={handleBuy}
className="flex items-center justify-center rounded-full bg-orange-600 hover:bg-orange-500 px-5 h-10 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
>
{active ? 'Buy Now' : 'Not available'}
</button>

      </div>
    </div>
  )
}
