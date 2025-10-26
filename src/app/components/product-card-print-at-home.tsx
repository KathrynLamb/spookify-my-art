// app/components/product-card-print-at-home.tsx
'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';

export type Currency = 'GBP' | 'USD' | 'EUR';
export type Orientation = 'Vertical' | 'Horizontal';

type PriceRow = { currency: string; price: number };
type Prices = PriceRow[] | Partial<Record<Currency, number>>;

type Props = {
  title: string;
  artSrc: string;
  productUid: string;          // single digital SKU
  prices: Prices;              // accepts array OR object map
  defaultOrientation?: Orientation;
  canProceed?: boolean;        // true => image already uploaded, go straight to checkout
  onSelect?: (
    v: {
      aspectRatio: string;
      orientation: Orientation;
      productUid: string;
      price: number;
    },
    titleSuffix: string,
    fromPrintAtHome: boolean
  ) => void;
};

const fmt = (n: number, c: Currency = 'GBP') => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: c }).format(n);
  } catch {
    return `${n.toFixed(2)} ${c}`;
  }
};

export default function ProductCardPrintAtHome({
  title,
  artSrc,
  productUid,
  prices,
  defaultOrientation = 'Vertical',
  canProceed = false,
  onSelect,
}: Props) {
  // 🔑 read currency from context so changing "Ship to" updates prices live
  const { currency } = useCurrency();

  // Normalize prices -> lookup (supports array or object)
  const priceByCurrency = useMemo(() => {
    const map: Partial<Record<Currency, number>> = {};
    if (Array.isArray(prices)) {
      for (const p of prices) {
        const key = (p?.currency ?? 'GBP').toUpperCase() as Currency;
        if (key === 'GBP' || key === 'USD' || key === 'EUR') map[key] = Number(p.price);
      }
    } else if (prices && typeof prices === 'object') {
      for (const [k, v] of Object.entries(prices)) {
        const key = k.toUpperCase() as Currency;
        if (key === 'GBP' || key === 'USD' || key === 'EUR') map[key] = Number(v as number);
      }
    }
    return map;
  }, [prices]);

  const activePrice =
    priceByCurrency[currency] ??
    priceByCurrency.GBP ??
    (Array.isArray(prices) ? prices[0]?.price : undefined) ??
    0;

  const orientations = ['Vertical', 'Horizontal'] as const;
  const aspectOptions = useMemo(
    () => ['2:3', '3:4', '4:5', '5:7', 'A-Series'] as const,
    []
  );

  const [orientation, setOrientation] = useState<Orientation>(defaultOrientation);
  const [aspect, setAspect] = useState<(typeof aspectOptions)[number]>(aspectOptions[0]);

  // Keep the two-path CTA behavior
  const primaryLabel = canProceed ? 'Select' : 'Select, then Spookify';

  const handlePrimary = () => {
    const variant = { aspectRatio: aspect, orientation, productUid, price: activePrice };
    const titleSuffix = `${aspect} – ${orientation}`;
    const fromPrintAtHome = true;

    if (canProceed && onSelect) {
      onSelect(variant, titleSuffix, fromPrintAtHome);
      return;
    }

    const selection = {
      productTitle: title,
      variant,
      titleSuffix,
      currency, // from context
      imageId: '',
      fileUrl: '',
    };
    try {
      localStorage.setItem('spookify:pending-product', JSON.stringify(selection));
    } catch {}
    window.location.href = '/upload?from=products';
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e11]">
      {/* media */}
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          src={artSrc}
          alt={title}
          fill
          sizes="(min-width:1024px) 420px, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
      </div>

      {/* content */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-tight">{title}</h3>
          <div className="shrink-0 rounded-md bg-white/5 px-2.5 py-1 text-sm font-semibold">
            {fmt(activePrice, currency)}
          </div>
        </div>

        {/* Orientation */}
        <fieldset>
          <legend className="mb-2 text-xs text-white/55">Orientation</legend>
          <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1">
            {orientations.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOrientation(o)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md',
                  orientation === o
                    ? 'bg-orange-600 text-white'
                    : 'text-white/80 hover:bg-white/10'
                )}
              >
                {o}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Aspect ratio */}
        <fieldset>
          <legend className="mb-2 text-xs text-white/55">Aspect ratio</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {aspectOptions.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAspect(a)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm',
                  a === aspect
                    ? 'border-orange-500 bg-orange-500/10 text-white'
                    : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                )}
                aria-pressed={a === aspect}
              >
                {a}
              </button>
            ))}
          </div>
        </fieldset>

        <p className="text-xs text-white/55">
          Instant download • Print guide included • Master + ratios (2:3 · 3:4 · 4:5 · 5:7 · A-Series)
        </p>

        {/* footer actions */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-white/55">Ready for home printing</p>
          <button
            type="button"
            onClick={handlePrimary}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition text-white',
              'bg-orange-600 hover:bg-orange-500'
            )}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
