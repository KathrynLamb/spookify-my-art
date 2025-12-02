// src/lib/prodigiCatalog.ts

export type Orientation = 'Horizontal' | 'Vertical' | 'Square';

type PrintAreaId = 'front' | 'insideRight' | 'default';

export type SkuCommon = {
  sku: string;
  px: { w: number; h: number };        // target design pixels (safe area @ ~300dpi)
  printAreas: Array<{ id: PrintAreaId; optional?: boolean }>;
  orientation?: Orientation;            // useful for UI defaults
};

export type CardSku = SkuCommon & {
  kind: 'card';
  packSize: 1 | 10;                     // Prodigi pack SKUs are quantity=1 (the pack)
  // Cards often have defined orientation; keep it explicit.
  orientation: Exclude<Orientation, 'Square'>;
};

export type SimpleSku = SkuCommon & {
  // generic products with a single printable surface (mug wrap, pillow face, poster)
  kind: 'mug' | 'pillow' | 'poster' | 'canvas' | 'other';
};

export type AnySku = CardSku | SimpleSku;

/** Master catalog */
export const PRODIGI_SKUS = {
  /* ====== CARDS (your originals) ====== */
  cards_landscape_a6_matte_single: <CardSku>{
    kind: 'card',
    sku: 'CLASSIC-GRE-FEDR-7X5-BLA',
    packSize: 1,
    orientation: 'Horizontal',
    px: { w: 2100, h: 1500 }, // 7x5" @ 300dpi, safe
    printAreas: [{ id: 'front' }, { id: 'insideRight', optional: true }],
  },
  cards_landscape_a6_matte_pack10: <CardSku>{
    kind: 'card',
    sku: 'CLASSIC-GRE-FEDR-7X5-BLA-10',
    packSize: 10,
    orientation: 'Horizontal',
    px: { w: 2100, h: 1500 },
    printAreas: [{ id: 'front' }, { id: 'insideRight', optional: true }],
  },
  cards_a5_matte_single: <CardSku>{
    kind: 'card',
    sku: 'CLASSIC-GRE-FEDR-A5-BLA',
    packSize: 1,
    orientation: 'Vertical',
    px: { w: 1800, h: 2550 }, // A5 vertical safe
    printAreas: [{ id: 'front' }, { id: 'insideRight', optional: true }],
  },
  cards_a5_matte_pack10: <CardSku>{
    kind: 'card',
    sku: 'CLASSIC-GRE-FEDR-A5-BLA-10',
    packSize: 10,
    orientation: 'Vertical',
    px: { w: 1800, h: 2550 },
    printAreas: [{ id: 'front' }, { id: 'insideRight', optional: true }],
  },

  /* ====== MUGS ====== */
  mug_11oz_white: <SimpleSku>{
    kind: 'mug',
    sku: 'GLOBAL-MUG-11OZ-WHITE',
    // Typical wrap printable area ~ 9" x 3.5" @ 300dpi — confirm against your exact SKU sheet.
    px: { w: 2700, h: 1050 },
    printAreas: [{ id: 'default' }],
    orientation: 'Horizontal',
  },

  /* ====== PILLOWS ====== */
  pillow_18in_white: <SimpleSku>{
    kind: 'pillow',
    sku: 'GLOBAL-PILLOW-18IN',
    // 18" @ 300dpi (often includes bleed; check template)
    px: { w: 5400, h: 5400 },
    printAreas: [{ id: 'default' }],
    orientation: 'Square',
  },
} as const;

export type VariantId = keyof typeof PRODIGI_SKUS;

/* ===== Optional: keep legacy name around for older code ===== */
export type CardVariantId =
  | 'cards_landscape_a6_matte_single'
  | 'cards_landscape_a6_matte_pack10'
  | 'cards_a5_matte_single'
  | 'cards_a5_matte_pack10';

/* ===== Helpers you’ll use elsewhere ===== */

/** Aspect ratio w/h for a variant (useful for preview sizing). */
export const getAspect = (id?: VariantId): number => {
  const v = id ? PRODIGI_SKUS[id] : undefined;
  if (!v) return 1;                      // default Square
  return +(v.px.w / v.px.h).toFixed(3);
};

export const getOrientation = (id?: VariantId): 'Horizontal'|'Vertical'|'Square' => {
  const v = id ? PRODIGI_SKUS[id] : undefined;
  if (!v) return 'Square';
  if (v.px.w === v.px.h) return 'Square';
  return v.px.w > v.px.h ? 'Horizontal' : 'Vertical';
};

export const minGeneratorWidth = (id?: VariantId): number => {
  const v = id ? PRODIGI_SKUS[id] : undefined;
  // pick a safe floor if unknown
  return v?.px.w ?? 2048;
};


/** Orientation hint for UI defaults; falls back from pixels if not set. */
// export function getOrientation(variantId: VariantId): Orientation {
//   const v = PRODIGI_SKUS[variantId];
//   if (v.orientation) return v.orientation;
//   const r = v.px.w / v.px.h;
//   if (Math.abs(r - 1) < 0.05) return 'Square';
//   return r > 1 ? 'Horizontal' : 'Vertical';
// }

/** For card pack SKUs, quantity should be 1 (the pack). */
export function normalizeQuantity(variantId: VariantId, qty?: number): number {
  const v = PRODIGI_SKUS[variantId];
  if (v.kind === 'card' && v.packSize === 10) return 1;
  return Math.max(1, qty ?? 1);
}

/** Minimum generator width you should request before sending to print. */
// export function minGeneratorWidth(variantId: VariantId): number {
//   // you already use minWidth: 2048 — map it to the SKU’s safe width
//   return PRODIGI_SKUS[variantId].px.w;
// }

/** Build assets array for a given SKU from your image(s). */
export function buildAssets(variantId: VariantId, opts: { frontUrl?: string; defaultUrl?: string; insideRightUrl?: string }) {
  const sku = PRODIGI_SKUS[variantId];
  return sku.printAreas.flatMap(pa => {
    if (pa.id === 'front' && opts.frontUrl) return [{ printArea: 'front', url: opts.frontUrl }];
    if (pa.id === 'insideRight' && opts.insideRightUrl) return [{ printArea: 'insideRight', url: opts.insideRightUrl }];
    if (pa.id === 'default' && opts.defaultUrl) return [{ printArea: 'default', url: opts.defaultUrl }];
    return pa.optional ? [] : []; // if required but missing, handle earlier with validation
  });
}
