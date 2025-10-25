'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import PriceTag from './price-tag';
import { ChipGroup } from '../components/ui/chips';
import { useCurrency } from '@/contexts/CurrencyContext';

export type Orientation = 'Vertical' | 'Horizontal';
type Currency = 'GBP' | 'USD' | 'EUR';

type Props = {
  title: string;
  artSrc: string;
  productUid: string;                      // single digital SKU
  prices: Partial<Record<Currency, number>>;
  canProceed: boolean;
  onSelect?: (
    v: {
      aspectRatio: string;
      orientation: Orientation;
      productUid: string;
      prices: Partial<Record<Currency, number>>;

    },
    titleSuffix: string,
    fromPrintAtHome: boolean
  ) => void;
  defaultOrientation?: Orientation;
};

/**
 * Print-at-home card
 * - “Size” is aspect ratio (2:3, 3:4, 4:5, 5:7, A-Series)
 * - One digital product; orientation/ratio guide composition only
 * - Shows “What’s included”
 */
export default function ProductCardPrintAtHome({
  title,
  artSrc,
  productUid,
  prices,
  canProceed,
  onSelect,
  defaultOrientation = 'Vertical',
}: Props) {
  const { currency } = useCurrency();

  const aspectOptions = useMemo(
    () => ['2:3', '3:4', '4:5', '5:7', 'A-Series'] as const,
    []
  );
  const [aspect, setAspect] =
    useState<(typeof aspectOptions)[number]>(aspectOptions[0]);
  const [orientation, setOrientation] = useState<Orientation>(defaultOrientation);

  const activePrice = prices[currency] ?? prices.GBP;

  const handlePrimary = () => {
    const variant = { aspectRatio: aspect, orientation, productUid, prices };
    const titleSuffix = `${aspect} – ${orientation}`;
    const fromPrintAtHome = true
    if (canProceed && onSelect) {
      onSelect(variant, titleSuffix, fromPrintAtHome);
      return;
    }

    // Fallback: persist and route to upload
    const selection = {
      productTitle: title,
      variant,
      titleSuffix,
      currency,
      imageId: '',
      fileUrl: '',
    };
    localStorage.setItem('spookify:pending-product', JSON.stringify(selection));
    window.location.href = '/upload?from=products';
  };

  const primaryCtaLabel = canProceed ? 'Select' : 'Select, then Spookify';

  return (
    <div className="relative flex flex-col rounded-xl overflow-hidden bg-[#0f0f11] border border-white/10 shadow-sm hover:shadow-lg transition">
      {/* Image */}
      {artSrc && (
        <div className="relative w-full bg-black">
          <Image
            src={artSrc}
            alt="Artwork preview"
            width={800}
            height={1000}
            unoptimized={/^(data:|blob:)/i.test(artSrc)}
            className="w-full h-auto object-contain"
          />
        </div>
      )}

      {/* Info + Options */}
      <div className="flex flex-col gap-4 p-4 pb-24">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold">{title}</h3>
          <PriceTag amount={activePrice} currency={currency} />
        </div>

        <div className="flex flex-col gap-3">
          {/* Aspect ratio */}
          <div>
            <div className="text-xs text-white/60 uppercase mb-1">Aspect ratio</div>
            <ChipGroup
              options={aspectOptions as unknown as readonly string[]}
              value={aspect}
              onChange={setAspect as (s: string) => void}
              isDisabled={() => false}
            />
          </div>

          {/* Orientation */}
          <div>
            <div className="text-xs text-white/60 uppercase mb-1">Orientation</div>
            <ChipGroup
              options={['Vertical', 'Horizontal'] as const}
              value={orientation}
              onChange={setOrientation}
              isDisabled={() => false}
            />
          </div>

          {/* What's included */}
          <div className="mt-1 rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-white/70 font-medium mb-1">What you’ll receive</div>
            <ul className="text-sm text-white/80 space-y-1 list-disc pl-5">
              <li>High-res JPGs for <span className="font-medium">2:3</span> (8×12, 12×18, 20×30, 24×36 in)</li>
              <li>High-res JPGs for <span className="font-medium">3:4</span> (6×8, 9×12, 18×24 in)</li>
              <li>High-res JPGs for <span className="font-medium">4:5</span> (8×10, 11×14, 16×20 in)</li>
              <li>High-res JPGs for <span className="font-medium">5:7</span> (5×7, 10×14 in)</li>
              <li><span className="font-medium">A-Series</span> JPG/PDFs (A5, A4, A3)</li>
              <li>1-page Print Guide</li>
            </ul>
            <p className="text-xs text-white/60 mt-2">
              Files are in <span className="font-medium">sRGB</span> and include all ratios; the selection above only previews crop/orientation.
            </p>
          </div>
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0f0f11] via-[#0f0f11]/90 to-transparent backdrop-blur-sm p-4 flex items-center justify-between gap-2">
        <span className="text-white/90 font-medium">
          <PriceTag amount={activePrice} currency={currency} />
        </span>
        <button
          type="button"
          onClick={handlePrimary}
          className="flex items-center justify-center rounded-full bg-orange-600 hover:bg-orange-500 px-5 h-10 text-sm font-medium text-white transition"
        >
          {primaryCtaLabel}
        </button>
      </div>
    </div>
  );
}
