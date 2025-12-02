// components/SummaryPanel.tsx
'use client';
import * as React from 'react';

export function SummaryPanel({
  productTitle,
  priceText,
  onChangeProduct,
  onAddToCart,
  addDisabled,
  badges = ['FSC papers', 'Archival inks', 'Made locally', 'Love-it guarantee'],
  children,
}: {
  productTitle: string;
  priceText: string;
  onChangeProduct: () => void;
  onAddToCart: () => void;
  addDisabled?: boolean;
  badges?: string[];
  children?: React.ReactNode; // quantity controls, etc.
}) {
  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
      <div className="text-xs uppercase tracking-wide text-white/60">Chosen product</div>
      <div className="mt-1 text-lg font-semibold">{productTitle}</div>

      {children}

      <div className="mt-3 flex items-center justify-between">
        <button className="text-sm rounded-full border border-white/15 bg-white/5 px-3 py-1.5 hover:bg-white/10" onClick={onChangeProduct}>
          Change product
        </button>
        <div className="text-base font-semibold">{priceText}</div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={onAddToCart}
          disabled={addDisabled}
          className="flex-1 rounded-full bg-white text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Looks good → Add to cart
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/70">
        {badges.map((b) => (
          <span key={b} className="rounded-full border border-white/15 px-2 py-0.5">
            {b}
          </span>
        ))}
      </div>
    </div>
  );
}
