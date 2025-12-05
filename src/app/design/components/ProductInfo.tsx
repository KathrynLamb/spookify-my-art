"use client";

import Image from "next/image";
import { useState } from "react";
import CurrencySwitcher, { Currency } from "./CurrencySwitcher";
import { SelectedProduct } from "../types";
// import { SelectedProduct } from "../page";

// import type { Currency, CurrencySwitcher } from "./CurrencySwitcher"; // <-- add this


/* -------------------------------------------------------------
 * TYPES
 * ------------------------------------------------------------- */
type ProductInfoProps = {
  product: SelectedProduct | null;
  previewUrl: string | null;
  originalUrl: string | null;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  printUrl?: string | null;
  canOrder?: boolean;

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
  printUrl,
  onCurrencyChange,
  canOrder
}: ProductInfoProps) {
  /** ❗ Must always run */
  const [showDetails, setShowDetails] = useState(false);

  /** Now it's safe to conditionally quit */
  if (previewUrl || originalUrl) return null;
  if (!product) return null;

  const price = product.prices?.[currency] ?? product.prices?.GBP;
  const productSrc = product.src ?? "/placeholder.png";

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
      {/* Title & Currency Switcher */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{product.title}</h2>
        <CurrencySwitcher value={currency} onChange={onCurrencyChange} />
      </div>

      {/* Price */}
      <div className="text-2xl font-semibold text-pink-400">
      {SYMBOLS[currency] || currency} {(price ?? 0).toFixed(2)}

      </div>

      {/* Product Image */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40">
        <Image
          src={productSrc}
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
{canOrder && printUrl && (
  <button
    className="w-full mt-3 px-4 py-2 rounded-lg bg-pink-500 text-sm font-semibold hover:bg-pink-600"
    // onClick={() => router.push(`/checkout?projectId=${projectId}`)}
    onClick={() => console.log("got to pay pal check out")}
  >
    I’m happy with it – continue to order
  </button>
)}

      <p className="text-xs text-white/40">
        Your artwork will appear here once generated.
      </p>
    </div>
  );
}
