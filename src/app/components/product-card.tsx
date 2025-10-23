'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, useCallback } from 'react';
import PriceTag from './price-tag';
import { ChipGroup } from '../components/ui/chips';
import { useCurrency } from '@/contexts/CurrencyContext';

type FrameColor = 'Black' | 'White' | 'Wood' | 'Dark wood';
type Currency = 'GBP' | 'USD' | 'EUR';

export type Orientation = 'Vertical' | 'Horizontal';

export type Variant = {
  sizeLabel: string;
  frameColor?: FrameColor;
  orientation: Orientation;
  productUid: string;
  prices: Partial<Record<Currency, number>>;
};

type Props = {
  title: string;
  artSrc: string;
  mockupSrc?: string; // (kept for compatibility, not used here)
  variants: Variant[];
  onSelect?: (v: Variant, titleSuffix: string) => void;  // <— add
  onSelectLemonSqueezy?: (v?: Variant) => void;
  controls?: { showFrame?: boolean };
  canProceed: boolean;
  preselectOrientation?: Orientation | null;

};


const isDataOrBlob = (s: string) => /^(data:|blob:)/i.test(s);

export default function ProductCard({
  title,
  artSrc,
  variants,
  onSelectLemonSqueezy,
  canProceed,
  controls = { showFrame: true },
  onSelect,
  preselectOrientation,

}: Props) {
  const { currency } = useCurrency();
  console.log("preselected orientation", preselectOrientation)

  // Distinct option lists
  const sizeOptions = useMemo(
    () => [...new Set(variants.map((v) => v.sizeLabel))],
    [variants]
  );
  const orientationOptions = useMemo(
    () => [...new Set(variants.map((v) => v.orientation))],
    [variants]
  );
  const frameOptions = useMemo(
    () => [...new Set(variants.map((v) => v.frameColor).filter(Boolean))] as FrameColor[],
    [variants]
  );

  // Selections
  const [size, setSize] = useState<string>(sizeOptions[0]);
  // const [orientation, setOrientation] = useState<Orientation>(orientationOptions[0]!);
  const [orientation, setOrientation] = useState<Orientation>('Vertical');
  const [frame, setFrame] = useState<FrameColor | undefined>(
    controls.showFrame ? frameOptions[0] : undefined
  );

  // Availability helpers
  const isVariantAvailable = useCallback(
    (s: string, o: Orientation, f?: FrameColor) =>
      variants.some(
        (v) => v.sizeLabel === s && v.orientation === o && (controls.showFrame ? v.frameColor === f : true)
      ),
    [variants, controls.showFrame]
  );

  const isFrameDisabled = useCallback(
    (f: FrameColor) => !isVariantAvailable(size, orientation, f),
    [isVariantAvailable, size, orientation]
  );
  const isSizeDisabled = useCallback(
    (s: string) => !isVariantAvailable(s, orientation, frame),
    [isVariantAvailable, orientation, frame]
  );
  const isOrientationDisabled = useCallback(
    (o: Orientation) => !isVariantAvailable(size, o, frame),
    [isVariantAvailable, size, frame]
  );

  // Active variant
  const active = useMemo(
    () =>
      variants.find(
        (v) =>
          v.sizeLabel === size &&
          v.orientation === orientation &&
          (controls.showFrame ? v.frameColor === frame : true)
      ),
    [variants, size, orientation, frame, controls.showFrame]
  );

  const activePrice = active?.prices[currency] ?? active?.prices.GBP;
  
  useEffect(() => {
    if (preselectOrientation && preselectOrientation !== orientation) {
      setOrientation(preselectOrientation); // ✅ now typed as Orientation
    }
  }, [preselectOrientation, orientation]);

  // --- Auto-fix illegal selections (without setting state during render) ---
  // Fix frame if needed
  useEffect(() => {
    if (!controls.showFrame) return;
    if (frame && isFrameDisabled(frame)) {
      const next = frameOptions.find((f) => !isFrameDisabled(f));
      if (next && next !== frame) setFrame(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, orientation, frameOptions.join('|')]); // deliberate deps

  // Fix size if needed
  useEffect(() => {
    if (isSizeDisabled(size)) {
      const next = sizeOptions.find((s) => !isSizeDisabled(s));
      if (next && next !== size) setSize(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orientation, frame, sizeOptions.join('|')]); // deliberate deps

  // Fix orientation if needed
  useEffect(() => {
    if (isOrientationDisabled(orientation)) {
      const next = orientationOptions.find((o) => !isOrientationDisabled(o));
      if (next && next !== orientation) setOrientation(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, frame, orientationOptions.join('|')]); // deliberate deps

  // CTA handlers
  const handlePrimary = async () => {
    if (!active) return;

  // If we came from the upload-first flow (we have fileUrl & imageId on /products)
  // and the parent provided onSelect, hand off to checkout instead of redirecting.
 if (canProceed && onSelect) {
     const titleSuffix = `${active.sizeLabel}${
      active.frameColor ? ` – ${active.frameColor}` : ''
   } – ${active.orientation}`;
   onSelect(active, titleSuffix);
   return;
 }
  
    const selection = {
      productTitle: title,
      variant: {
        sizeLabel: active.sizeLabel,
        orientation: active.orientation,
        productUid: active.productUid,
        prices: active.prices,
        frameColor: active.frameColor,
      },
      titleSuffix: `${active.sizeLabel}${active.frameColor ? ` – ${active.frameColor}` : ''} – ${active.orientation}`,
      currency,
      imageId: '', // will be filled later during upload
      fileUrl: '', // will be replaced once the user uploads
    };
  
    localStorage.setItem('spookify:pending-product', JSON.stringify(selection));
  
    // Go to the upload page
    window.location.href = '/upload?from=products';
  };
  


  const primaryCtaLabel = canProceed
    ? active
      ? 'Select'
      : 'Not available'
    : 'Select, then Spookify';

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
          {/* Size */}
          <div>
            <div className="text-xs text-white/60 uppercase mb-1">Size</div>
            <ChipGroup
              options={sizeOptions as readonly string[]}
              value={size}
              onChange={setSize}
              isDisabled={isSizeDisabled}
            />
          </div>

          {/* Frame (optional) */}
          {controls.showFrame && frameOptions.length > 0 && (
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

          {/* Orientation */}
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
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0f0f11] via-[#0f0f11]/90 to-transparent backdrop-blur-sm p-4 flex items-center justify-between gap-2">
        <span className="text-white/90 font-medium">
          <PriceTag amount={activePrice} currency={currency} />
        </span>

        <div className="flex items-center gap-2">

          <button
            type="button"
            disabled={!active}
            onClick={handlePrimary}
            className="flex items-center justify-center rounded-full bg-orange-600 hover:bg-orange-500 px-5 h-10 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {primaryCtaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
