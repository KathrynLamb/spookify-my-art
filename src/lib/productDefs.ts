// lib/productDefs.ts

// -----------------------------
// Types
// -----------------------------
export type Orientation = 'Square' | 'Landscape' | 'Portrait';
export type CropMode = 'cover' | 'contain';

export type OverlaySpec = {
  /** Percent padding between the preview frame and the product's printable panel */
  panelInsetPct: number;
  /** Percent inset representing trim / seam / cut line */
  trimInsetPct: number;
  /** Percent inset for "safe" content (e.g., keep text inside) */
  safeInsetPct: number;
  /** Optional rounded corner radius (px) for the panel viz only */
  roundedPx?: number;
};

// export type ProductDef = {
//   /** Your internal id (stable key for routing/state) */
//   id: string;
//   displayName: string;

//   /** Default preview orientation (used to pick aspect class, etc.) */
//   defaultOrientation: Orientation;

//   /** Default crop behavior for the stage (cover = edge-to-edge) */
//   defaultCropMode?: CropMode;

//   /**
//    * Real Prodigi SKU you intend to order (used later when creating the order).
//    * Example: GLOBAL-CUSH-18X18-SUE-SINGLE
//    */
//   prodigiSku: string;

//   /**
//    * Internal print-spec key that maps to required render pixels (used in /api/print-assets/prepare).
//    * Example: cushion.18in.single
//    */
//   printSpecId: string;

//   /**
//    * Aspect ratio (w/h) for stage. If omitted, we infer from orientation:
//    * - Square = 1
//    * - Landscape = 4/3
//    * - Portrait = 3/4
//    */
//   aspectRatio?: number;

//   /** Optional overlay guides for the preview */
//   overlay?: OverlaySpec;

//   /** Optional decorative background hint for the preview stage */
//   backdrop?: 'none' | 'soft-shadow' | 'desk' | 'sofa';
// };

// src/lib/productDefs.ts
export type Vendor = 'prodigi' | 'gelato';

export type ProductDef = {
  id: string;
  displayName: string;
  vendor: Vendor;         // <-- REQUIRED
  gelatoSku?: string;
  prodigiSku?: string;
  printSpecId?: string;
  overlay?: OverlaySpec;
  defaultCropMode?: 'cover' | 'contain';
  aspectRatio?: number;
  defaultOrientation: Orientation;
  backdrop?: 'none' | 'soft-shadow' | 'desk' | 'sofa';
};


// -----------------------------
// Product catalog (minimal seed)
// Add more entries as needed.
// -----------------------------
export const PRODUCT_DEFS: Record<string, ProductDef> = {
  // ---- Cushions ----
  'cushion_18in_single': {
    id: 'cushion_18in_single',
    displayName: 'Throw cushion 18in (single-sided)',
    defaultOrientation: 'Square',
    vendor: 'prodigi',
    defaultCropMode: 'cover',
    prodigiSku: 'GLOBAL-CUSH-18X18-SUE-SINGLE',
    printSpecId: 'cushion.18in.single',
    aspectRatio: 1,
    overlay: { panelInsetPct: 6, trimInsetPct: 3, safeInsetPct: 7.5, roundedPx: 16 },
    backdrop: 'sofa',
  },

  cushion_24x24_suede_single_prodigi: {
    id: 'cushion_24x24_suede_single_prodigi',
    displayName: 'Faux Suede Cushion 24×24 (single-sided) — Prodigi',
    vendor: 'prodigi',
    prodigiSku: 'GLOBAL-CUSH-24X24-SUE',         // from your screenshot
    printSpecId: 'cushion.24x24.single',
    defaultOrientation: 'Square',
    defaultCropMode: 'cover',
  },


  // ---- Cards (examples) ----
  'cards_a6_landscape_matte': {
    id: 'cards_a6_landscape_matte',
    displayName: 'Cards A6 Landscape (Matte)',
    defaultOrientation: 'Landscape',
    defaultCropMode: 'cover',
    vendor: 'prodigi',
    prodigiSku: 'EXAMPLE-CARDS-A6-LANDSCAPE-MATTE',   // replace when wiring real SKU
    printSpecId: 'cards.a6.landscape.matte',          // add matching print spec in prodigiSpecs
    aspectRatio: 4 / 3,
    overlay: { panelInsetPct: 2, trimInsetPct: 3, safeInsetPct: 6, roundedPx: 8 },
    backdrop: 'desk',
  },

  'cards_a6_portrait_matte': {
    id: 'cards_a6_portrait_matte',
    displayName: 'Cards A6 Portrait (Matte)',
    defaultOrientation: 'Portrait',
    defaultCropMode: 'cover',
    vendor: 'prodigi',
    prodigiSku: 'EXAMPLE-CARDS-A6-PORTRAIT-MATTE',    // replace when wiring real SKU
    printSpecId: 'cards.a6.portrait.matte',
    aspectRatio: 3 / 4,
    overlay: { panelInsetPct: 2, trimInsetPct: 3, safeInsetPct: 6, roundedPx: 8 },
    backdrop: 'desk',
  },

  // ---- Canvas (example) ----
  'canvas_12x16': {
    id: 'canvas_12x16',
    displayName: 'Canvas 12×16',
    defaultOrientation: 'Portrait',
    defaultCropMode: 'cover',
    vendor: 'prodigi',
    prodigiSku: 'EXAMPLE-CANVAS-12X16',               // replace when wiring real SKU
    printSpecId: 'canvas.12x16',
    aspectRatio: 3 / 4,
    overlay: { panelInsetPct: 0, trimInsetPct: 2, safeInsetPct: 6, roundedPx: 4 },
    backdrop: 'soft-shadow',
  },
};

// A sensible default so pages can always render
export const DEFAULT_PRODUCT_ID: keyof typeof PRODUCT_DEFS = 'cushion_18in_single';

// -----------------------------
// Helpers
// -----------------------------

/** Resolve a product definition safely, with a fallback. */
export function getProductDef(id?: string | null): ProductDef {
  if (id && PRODUCT_DEFS[id]) return PRODUCT_DEFS[id];
  return PRODUCT_DEFS[DEFAULT_PRODUCT_ID];
}

/** Derive a Tailwind aspect class from a ratio (limited to common cases). */
export function aspectClassFromRatio(ratio?: number, orientation?: Orientation): string {
  // If ratio is not provided, infer a common default from orientation.
  const r =
    ratio ??
    (orientation === 'Landscape' ? 4 / 3 : orientation === 'Portrait' ? 3 / 4 : 1);

  if (Math.abs(r - 1) < 0.001) return 'aspect-square';
  if (Math.abs(r - 4 / 3) < 0.001) return 'aspect-[4/3]';
  if (Math.abs(r - 3 / 4) < 0.001) return 'aspect-[3/4]';
  return `aspect-[${r}]`;
}
