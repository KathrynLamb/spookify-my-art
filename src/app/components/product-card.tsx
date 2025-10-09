'use client'

import Image from 'next/image'

type Props = {
  title: string
  price?: string
  artSrc: string               // user’s spookified image (http(s) or data:)
  mockupSrc: string            // PNG mockup with transparent frame
  onSelect: () => void
}

export default function ProductCard({
  title, price, artSrc, mockupSrc, onSelect,
}: Props) {
  return (
    <div className="rounded-2xl bg-[#0e0e11] border border-white/10 overflow-hidden shadow-lg">
      <div className="relative aspect-[16/9]">
        {/* User art (beneath) */}
        <Image
          src={artSrc}
          alt=""
          fill
          className="object-cover opacity-95"
          sizes="(min-width:1024px) 33vw, 50vw"
          priority={false}
        />
        {/* Mockup overlay (frame PNG with transparent window) */}
        <Image
          src={mockupSrc}
          alt=""
          fill
          className="object-cover"
          sizes="(min-width:1024px) 33vw, 50vw"
        />
      </div>

      <div className="p-4">
        <div className="font-semibold">{title}</div>
        {price && <div className="text-sm text-gray-400 mt-0.5">{price}</div>}

        <button
          onClick={onSelect}
          className="mt-3 inline-flex items-center rounded-full bg-orange-600 hover:bg-orange-500 px-4 py-2 text-sm"
        >
          Select
        </button>
      </div>
    </div>
  )
}
