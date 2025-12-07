"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import CurrencySwitcher, { Currency } from "./CurrencySwitcher";
import { SelectedProduct } from "../types";
import { CanvasStage } from "./CanvasStage";

type ProductInfoProps = {
  product: SelectedProduct | null;
  previewUrl: string | null;
  originalUrl: string | null;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;

  printUrl?: string | null;
  canOrder?: boolean;
  onOrder?: () => void;
  ordering?: boolean;
  orderError?: string | null;
};

const SYMBOLS: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
};

export default function ProductInfo(props: ProductInfoProps) {
  const {
    product,
    previewUrl,
    originalUrl,
    currency,
    printUrl,
    onCurrencyChange,
    canOrder,
    onOrder,
    ordering,
    orderError,
  } = props;

  const [showDetails, setShowDetails] = useState(false);

  // ✅ Hook must be above conditional returns
  const deliveryLines = useMemo(() => {
    if (!product?.shippingTime) return [];
    const t = product.shippingTime;
    const arr: string[] = [];
    if (t.uk) arr.push(`UK: ${t.uk}`);
    if (t.eu) arr.push(`EU: ${t.eu}`);
    if (t.us) arr.push(`USA: ${t.us}`);
    if (t.international) arr.push(`International: ${t.international}`);
    return arr;
  }, [product?.shippingTime]);

  if (!product) return null;

  const price = product.prices?.[currency] ?? product.prices?.GBP ?? 0;
  const showHeroImage = !originalUrl && !previewUrl;
  const heroSrc = product.src || "/placeholder.png";
  const itemName = product.name ?? "item";

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
      {/* Title & Currency */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{product.title}</h2>
          <p className="text-xs text-white/50">
            Printed on demand • Made just for you
          </p>
        </div>
        <CurrencySwitcher value={currency} onChange={onCurrencyChange} />
      </div>

      {/* Price */}
      <div className="text-2xl font-semibold text-pink-400">
        {SYMBOLS[currency] || currency} {price.toFixed(2)}
      </div>

      {/* Product image before AI generates */}
      {showHeroImage && (
        <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40">
          <Image
            src={heroSrc}
            alt={product.title}
            fill
            sizes="400px"
            className="object-contain"
            priority
          />
        </div>
      )}

      {/* AI mockup/preview */}
      <CanvasStage original={originalUrl} result={previewUrl} />

      {/* Description */}
      {product.description && (
        <p className="text-sm text-white/70">{product.description}</p>
      )}

            {/* Expandable details */}
            <button
        className="text-xs text-pink-400 underline"
        onClick={() => setShowDetails((s) => !s)}
      >
        {showDetails ? "Hide details" : "Show details"}
      </button>

      {/* Confidence bullets */}
      {showDetails && (
      <div className="grid grid-cols-1 gap-2 text-xs text-white/70">
        <div className="rounded-lg border border-white/10 bg-white/5 p-2">
          <span className="text-white font-medium">What you get:</span>{" "}
          Your custom AI artwork printed on {itemName}.
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-2">
          <span className="text-white font-medium">Quality:</span>{" "}
          High-resolution print with vibrant colors.
        </div>

        {product.returnPolicy && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <span className="text-white font-medium">Peace of mind:</span>{" "}
            {product.returnPolicy}
          </div>
        )}
      </div>
      )}


      {showDetails && (
        <div className="space-y-4 text-white/70 text-xs border-t border-white/10 pt-4">
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

          {!!deliveryLines.length && (
            <div>
              <h3 className="text-white font-medium mb-1 text-sm">Delivery</h3>
              <ul className="space-y-1 list-disc list-inside">
                {deliveryLines.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </div>
          )}

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

      {/* CTA */}
      {canOrder && printUrl ? (
        <div className="space-y-2">
          <button
            className="w-full mt-3 px-4 py-2 rounded-lg bg-pink-500 text-sm font-semibold hover:bg-pink-600 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={onOrder}
            disabled={!onOrder || ordering}
          >
            {ordering
              ? "Opening PayPal…"
              : `I’m happy with it – order this ${itemName}`}
          </button>

          {!!orderError && (
            <p className="text-[11px] text-red-400">{orderError}</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-white/40">
          Your preview will appear here once generated.
        </p>
      )}
    </div>
  );
}
