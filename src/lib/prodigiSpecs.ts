// src/lib/prodigiSpecs.ts
export type Px = { w: number; h: number };
export type PrintSpec = {
  id: string;                // e.g., "cushion.18in.single"
  sides: 1 | 2;
  px: Px[];                  // target pixel(s) per side
  fileType: 'jpeg' | 'png';
};

// ✅ central place for sizes you support
const PRINT_SPECS: Record<string, PrintSpec> = {
  'cushion.18in.single': {
    id: 'cushion.18in.single',
    sides: 1,
    // Prodigi recommends ≥150–300 dpi. 18" @300dpi ~= 5400 px; add a little bleed.
    px: [{ w: 5700, h: 5700 }],
    fileType: 'jpeg',
  },
  // add more here...
};

// (optional) map Prodigi SKUs -> your PrintSpec id
const SKU_TO_SPEC: Record<string, string> = {
  'GLOBAL-CUSH-18X18-SUE-SINGLE': 'cushion.18in.single',
  // add more here...
};

export function getSpecOrThrowById(printSpecId: string): PrintSpec {
  const spec = PRINT_SPECS[printSpecId];
  if (!spec) throw new Error(`Unknown printSpecId: ${printSpecId}`);
  return spec;
}

export function getSpecOrThrowBySku(prodigiSku: string): PrintSpec {
  const id = SKU_TO_SPEC[prodigiSku];
  if (!id) throw new Error(`No PrintSpec mapped for SKU ${prodigiSku}`);
  return getSpecOrThrowById(id);
}
