import React, { useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";

export type Currency = "GBP" | "USD" | "EUR";

export type Variant = {
  sizeLabel: string; // e.g. "30×40 cm"
  orientation: "Portrait" | "Landscape" | "Square";
  frameColor?: "Black" | "White" | "Wood" | "Dark wood";
  productUid?: string;
  prices: Record<Currency, number> & { GBP: number };
};

export type ProductCardV2Props = {
  title: string;
  artSrc: string;
  badge?: string;
  variants: Variant[];
  /** legacy support: page passes controls={{ showFrame: true }} */
  controls?: { showFrame?: boolean };
  /** direct flag also supported */
  showFrame?: boolean;
  preselectOrientation?: "Portrait" | "Landscape" | "Square" | null;
  /** true if image already exists (upload-first flow) */
  canProceed?: boolean;
  onSelect: (
    variant: Variant,
    titleSuffix?: string,
    fromPrintAtHome?: boolean
  ) => void;
};

const fmt = (n: number, c: Currency = "GBP") => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: c }).format(n);
  } catch {
    return `${n.toFixed(2)} ${c}`;
  }
};

export default function ProductCardV2({
  title,
  artSrc,
  badge,
  variants,
  controls,
  showFrame,
  preselectOrientation = null,
  canProceed = false,
  onSelect,
}: ProductCardV2Props) {

  console.log("Variants", variants, "PS", preselectOrientation, badge)
  // 🔑 react to “Ship to” changes
  const { currency } = useCurrency();

  // resolve frame toggle from either prop shape
  const showFrameOn = (controls?.showFrame ?? showFrame) ?? false;

  // Options
  const orientations = useMemo(
    () => Array.from(new Set(variants.map(v => v.orientation))),
    [variants]
  );
  const sizes = useMemo(
    () => Array.from(new Set(variants.map(v => v.sizeLabel))),
    [variants]
  );
  const frameColors = useMemo(
    () =>
      Array.from(new Set(variants.map(v => v.frameColor).filter(Boolean))) as NonNullable<
        Variant["frameColor"]
      >[],
    [variants]
  );

  // State
  const [orientation, setOrientation] = useState<"Portrait" | "Landscape" | "Square" | null>(
    preselectOrientation ?? orientations[0] ?? null
  );
  const [size, setSize] = useState<string>(sizes[0] || "");
  const [frame, setFrame] = useState<Variant["frameColor"] | undefined>(frameColors[0]);

  // Find exact match for current selection
  const selected = useMemo(() => {
    if (!orientation) return undefined;
    return variants.find(
      v =>
        v.sizeLabel === size &&
        v.orientation === orientation &&
        (!showFrameOn || v.frameColor === frame)
    );
  }, [variants, size, orientation, frame, showFrameOn]);

  const price = selected?.prices?.[currency] ?? selected?.prices?.GBP ?? 0;

  // CTA label + disabled state
  const primaryLabel = !selected ? "Not available" : canProceed ? "Select" : "Select, then Spookify";
  const primaryDisabled = !selected;

  const handlePrimary = () => {
    if (!selected) return;

    const fromPrintAtHome = false;
    const titleSuffix = buildTitleSuffix(selected);

    if (canProceed) {
      onSelect(selected, titleSuffix, fromPrintAtHome);
      return;
    }

    // Product-first flow: stash choice and move to upload
    const selection = {
      productTitle: title,
      variant: {
        sizeLabel: selected.sizeLabel,
        orientation: selected.orientation,
        productUid: selected.productUid,
        prices: selected.prices,
        frameColor: selected.frameColor,
      },
      titleSuffix,
      currency, // from context
      imageId: "",
      fileUrl: "",
    };

    try {
      localStorage.setItem("spookify:pending-product", JSON.stringify(selection));
    } catch {}
    window.location.href = "/upload?from=products";
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e11]">
      {/* media */}
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          src={artSrc}
          alt={title}
          fill
          sizes="(min-width:1024px) 480px, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {badge && (
          <span className="pointer-events-none absolute right-3 top-3 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white/80 backdrop-blur">
            {badge}
          </span>
        )}
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
      </div>

      {/* content */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-tight">{title}</h3>
          <div className="shrink-0 rounded-md bg-white/5 px-2.5 py-1 text-sm font-semibold">
            {fmt(price, currency)}
          </div>
        </div>

        {/* Orientation */}
        {orientations.length > 1 && (
          <fieldset>
            <legend className="mb-2 text-xs text-white/55">Orientation</legend>
            <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1">
              {orientations.map(o => (
                <button
                  key={o}
                  type="button"
                   onClick={() => setOrientation(o)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md",
                    orientation === o
                      ? "bg-orange-600 text-white"
                      : "text-white/80 hover:bg-white/10"
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {/* Size grid */}
        <fieldset>
          <legend className="mb-2 text-xs text-white/55">Size</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {sizes.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm",
                  s === size
                    ? "border-orange-500 bg-orange-500/10 text-white"
                    : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                )}
                aria-pressed={s === size}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Frame colors */}
        {showFrameOn && frameColors.length > 0 && (
          <fieldset>
            <legend className="mb-2 text-xs text-white/55">Frame</legend>
            <div className="flex flex-wrap gap-2">
              {frameColors.map(fc => (
                <button
                  key={fc}
                  type="button"
                  onClick={() => setFrame(fc)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                    fc === frame
                      ? "border-orange-500 bg-orange-500/10 text-white"
                      : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                  )}
                >
                  <span
                    className={cn(
                      "h-3 w-3 rounded-full",
                      fc === "Black" && "bg-black",
                      fc === "White" && "bg-white",
                      fc === "Wood" && "bg-amber-700",
                      fc === "Dark wood" && "bg-stone-700"
                    )}
                  />
                  {fc}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {/* Footer actions */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-white/55">Archival paper • Fast fulfillment</p>
          <button
            type="button"
            disabled={primaryDisabled}
            onClick={handlePrimary}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              primaryDisabled
                ? "bg-white/10 text-white/50 cursor-not-allowed"
                : "bg-orange-600 hover:bg-orange-500 text-white"
            )}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function buildTitleSuffix(v: Variant) {
  const bits = [v.sizeLabel];
  if (v.frameColor) bits.push(v.frameColor);
  bits.push(v.orientation);
  return bits.join(" – ");
}
