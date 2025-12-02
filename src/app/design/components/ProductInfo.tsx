"use client";

import Image from "next/image";
import { useState } from "react";
import CurrencySwitcher, { Currency } from "./CurrencySwitcher";

// import type { Currency, CurrencySwitcher } from "./CurrencySwitcher"; // <-- add this


/* -------------------------------------------------------------
 * TYPES
 * ------------------------------------------------------------- */
type ProductInfoProps = {
  product: {
    title: string;
    src: string;
    description: string;
    prices: Record<string, number>;
    specs?: string[];
    shippingTime?: {
      uk?: string;
      eu?: string;
      us?: string;
      [key: string]: string | undefined;
    };
    returnPolicy?: string;
    care?: string[];
  } | null;

  previewUrl: string | null;
  originalUrl: string | null;

  currency: Currency;                        // <-- updated
  onCurrencyChange: (c: Currency) => void;  
};

const SYMBOLS: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
};

/* -------------------------------------------------------------
 * COMPONENT
 * ------------------------------------------------------------- */
export default function ProductInfo({
  product,
  previewUrl,
  originalUrl,
  currency,
  onCurrencyChange,
}: ProductInfoProps) {
  /** ❗ Must always run */
  const [showDetails, setShowDetails] = useState(false);

  /** Now it's safe to conditionally quit */
  if (previewUrl || originalUrl) return null;
  if (!product) return null;

  const price = product.prices?.[currency] ?? product.prices?.GBP;

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
      {/* Title & Currency Switcher */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{product.title}</h2>
        <CurrencySwitcher value={currency} onChange={onCurrencyChange} />
      </div>

      {/* Price */}
      <div className="text-2xl font-semibold text-pink-400">
        {SYMBOLS[currency] || currency} {price.toFixed(2)}
      </div>

      {/* Product Image */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40">
        <Image
          src={product.src}
          alt={product.title}
          fill
          sizes="400px"
          className="object-contain"
        />
      </div>

      {/* Description */}
      <p className="text-sm text-white/70">{product.description}</p>

      {/* Expandable */}
      <button
        className="text-xs text-pink-400 underline"
        onClick={() => setShowDetails((s) => !s)}
      >
        {showDetails ? "Hide details" : "Show details"}
      </button>

      {showDetails && (
        <div className="space-y-4 text-white/70 text-xs border-t border-white/10 pt-4 animate-fadeIn">
          {/* Specs */}
          {!!product.specs?.length && (
            <div>
              <h3 className="text-white font-medium mb-1 text-sm">Specs</h3>
              <ul className="space-y-1 list-disc list-inside">
                {product.specs.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Delivery */}
          {product.shippingTime && (
            <div>
              <h3 className="text-white font-medium mb-1 text-sm">Delivery</h3>
              <ul className="space-y-1 list-disc list-inside">
                {product.shippingTime.uk && (
                  <li>£{product.shippingTime.uk}</li>
                )}
                {product.shippingTime.eu && (
                  <li>€{product.shippingTime.eu}</li>
                )}
                {product.shippingTime.us && (
                  <li>${product.shippingTime.us}</li>
                )}
              </ul>
            </div>
          )}

          {/* Returns */}
          {product.returnPolicy && (
            <p className="text-white/50 italic">
              {product.returnPolicy}
            </p>
          )}

          {/* Care */}
          {!!product.care?.length && (
            <div>
              <h3 className="text-white font-medium mb-1 text-sm">Care</h3>
              <ul className="list-disc list-inside space-y-1">
                {product.care.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-white/40">
        Your artwork will appear here once generated.
      </p>
    </div>
  );
}
