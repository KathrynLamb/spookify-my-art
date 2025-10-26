// src/data/products/poster.ts
export type Currency = 'GBP' | 'USD' | 'EUR'
export type Orientation = 'Vertical' | 'Horizontal' | "Square";

export type PosterPriceTable = Partial<Record<Currency, number>> // major units

export type PosterVariant = {
  sizeLabel: string        // shown in UI
  sizeToken: string        // internal key you prefer (mm)
  orientation: Orientation // Vertical | Horizontal
  productUid: string       // <FILL> exact Gelato productUid for this size+orientation
  prices: PosterPriceTable // <FILL> e.g. { GBP: 6.21, USD: 7.49 }
}

export type PosterProduct = {
  slug: 'poster'
  title: string
  description: string
  baseCategory: 'Wall art'
  paper: 'Museum-Quality Matte 200 gsm'
  orientations: Orientation[]
  sizes: string[]              // what you expose in the UI
  variants: PosterVariant[]    // concrete, orderable combos
}

export const POSTER: PosterProduct = {
  slug: 'poster',
  title: 'Museum-Quality Matte Paper Poster',
  description:
    'Matte, museum-quality poster printed on 200 gsm archival paper. Rich color, glare-free finish.',
  baseCategory: 'Wall art',
  paper: 'Museum-Quality Matte 200 gsm',
  orientations: ['Vertical', 'Horizontal'],

  // Keep it focused; you can expand later
  sizes: [
    '13×18 cm / 5×7″',
    '30×40 cm',
    '50×70 cm',
    '70×100 cm / 28×40″',
  ],

  // === Fill these UIDs + prices from the Gelato product page/API ===
  variants: [
    // 13×18 cm / 5×7″
    {
      sizeLabel: '13×18 cm / 5×7″',
      sizeToken: '130x180',
      orientation: 'Vertical',
      productUid: 'flat_130x180-mm-5r_250-gsm-100lb-uncoated-offwhite-archival_4-0_ver',
      prices: { GBP: 16.99, USD: 19.99, EUR: 18.99  },
    },
    {
      sizeLabel: '13×18 cm / 5×7″',
      sizeToken: '130x180',
      orientation: 'Horizontal',
      productUid: 'flat_130x180-mm-5r_250-gsm-100lb-uncoated-offwhite-archival_4-0_hor',
      prices: { GBP: 16.99, USD: 19.99, EUR: 18.99  },
    },

    // 30×40 cm
    {
      sizeLabel: '30×40 cm',
      sizeToken: '300x400',
      orientation: 'Vertical',
      productUid: 'flat_300x400-mm-12x16-inch_250-gsm-100lb-uncoated-offwhite-archival_4-0_ver',
      prices: { GBP: 12.95, USD: 16.95, EUR: 15.49 },

    },
    {
      sizeLabel: '30×40 cm',
      sizeToken: '300x400',
      orientation: 'Horizontal',
      productUid: 'flat_300x400-mm-12x16-inch_250-gsm-100lb-uncoated-offwhite-archival_4-0_hor',
      prices: { GBP: 12.95, USD: 16.95, EUR: 15.49 },

    },

    // 50×70 cm
    {
      sizeLabel: '50×70 cm',
      sizeToken: '500x700',
      orientation: 'Vertical',
      productUid: 'flat_500x700-mm-20x28-inch_250-gsm-100lb-uncoated-offwhite-archival_4-0_ver',
      prices: { GBP: 19.95, USD: 25.95, EUR: 23.95 },

    },
    {
      sizeLabel: '50×70 cm',
      sizeToken: '500x700',
      orientation: 'Horizontal',
      productUid: 'flat_500x700-mm-20x28-inch_250-gsm-100lb-uncoated-offwhite-archival_4-0_hor',
      prices: { GBP: 19.95, USD: 25.95, EUR: 23.95 },

    },

    // 70×100 cm / 28×40″
    {
      sizeLabel: '70×100 cm / 28×40″',
      sizeToken: '700x1000',
      orientation: 'Vertical',
      productUid: 'flat_700x1000-mm-28x40-inch_250-gsm-100lb-uncoated-offwhite-archival_4-0_ver',
      prices: { GBP: 25.95, USD: 32.95, EUR: 30.95 },

    },
    {
      sizeLabel: '70×100 cm / 28×40″',
      sizeToken: '700x1000',
      orientation: 'Horizontal',
      productUid: 'flat_700x1000-mm-28x40-inch_250-gsm-100lb-uncoated-offwhite-archival_4-0_hor',
      prices: { GBP: 25.95, USD: 32.95, EUR: 30.95 },

    },
  ],
}
