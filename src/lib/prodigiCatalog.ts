// src/lib/prodigiCatalog.ts
export type Orientation = 'Horizontal' | 'Vertical' | 'Square';

export type CardVariantId =
  | 'cards_landscape_a6_matte_single'
  | 'cards_landscape_a6_matte_pack10'
  | 'cards_a5_matte_single'
  | 'cards_a5_matte_pack10';

export const PRODIGI_SKUS: Record<CardVariantId, {
  sku: string;
  orientation: Orientation;
  packSize: 1 | 10;
  // output pixel targets at 300dpi (safe, no bleed). You can adjust if you adopt official bleed templates.
  // 7x5" = 2100x1500, A5 ~ 6x8.5" = 2550x1800
  px: { w: number; h: number };
}> = {
  cards_landscape_a6_matte_single: { sku: 'CLASSIC-GRE-FEDR-7X5-BLA',     orientation: 'Horizontal', packSize: 1,  px: { w: 2100, h: 1500 } },
  cards_landscape_a6_matte_pack10: { sku: 'CLASSIC-GRE-FEDR-7X5-BLA-10',  orientation: 'Horizontal', packSize: 10, px: { w: 2100, h: 1500 } },
  cards_a5_matte_single:            { sku: 'CLASSIC-GRE-FEDR-A5-BLA',     orientation: 'Vertical',   packSize: 1,  px: { w: 1800, h: 2550 } },
  cards_a5_matte_pack10:            { sku: 'CLASSIC-GRE-FEDR-A5-BLA-10',  orientation: 'Vertical',   packSize: 10, px: { w: 1800, h: 2550 } },
};
