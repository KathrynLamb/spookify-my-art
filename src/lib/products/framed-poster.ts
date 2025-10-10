// src/data/products/framed-poster.ts
export type Currency = 'GBP' | 'USD' | 'EUR';
export type Orientation = 'Vertical' | 'Horizontal';
export type FrameColor = 'Black' | 'White' | 'Wood' | 'Dark wood';

export type PriceTable = Partial<Record<Currency, number>>; // numeric, major units (e.g., 58.97)

export type FramedPosterVariant = {
  sizeLabel: string;          // human label shown in UI (keep identical to your dropdown)
  sizeToken: string;          // internal token you use (optional but handy)
  orientation: Orientation;   // Vertical | Horizontal
  frameColor: FrameColor;     // Black | White | Wood | Dark wood
  productUid: string;         // <-- <FILL> Gelato productUid for this exact combo
  prices: PriceTable;         // <-- <FILL> e.g. { GBP: 58.97, USD: 69.90 }
};

export type FramedPosterProduct = {
  slug: 'framed-poster';
  title: string;
  description: string;
  baseCategory: 'Wall art';
  paper: 'Premium Semi-Gloss 200 gsm';
  glazing: 'Plexiglass';
  orientations: Orientation[];
  frameColors: FrameColor[];
  sizes: string[];            // list you expose in the UI
  variants: FramedPosterVariant[]; // each concrete, orderable combo
};

export const FRAMED_POSTER: FramedPosterProduct = {
  slug: 'framed-poster',
  title: 'Premium Wooden Framed Poster',
  description:
    'Semi-gloss 200 gsm poster mounted behind plexiglass in a wooden frame. Ready-to-hang option available in most regions.',
  baseCategory: 'Wall art',
  paper: 'Premium Semi-Gloss 200 gsm',
  glazing: 'Plexiglass',

  orientations: ['Vertical', 'Horizontal'],
  frameColors: ['Black', 'White', 'Wood', 'Dark wood'],

  // Keep the set tight for launch; expand later
  sizes: [
    '15×20 cm / 6×8″',
    '30×40 cm',
    '50×70 cm',
    '70×100 cm / 28×40″',
  ],

  // === Fill these productUid + prices with your real data ===
  variants: [
    // 15×20 cm / 6×8″ — commonly uses 20×20 frame profile on Gelato
    {
      sizeLabel: '15×20 cm / 6×8″',
      sizeToken: '150x200',
      orientation: 'Vertical',
      frameColor: 'White',
      productUid: 'framed_poster_mounted_150x200-mm-6x8-inch_white_wood_w12xt22-mm_plexiglass_150x200-mm-6x8-inch_170-gsm-65lb-coated-silk_4-0_ver',
      prices: { GBP: 24.95, USD: 29.95, EUR: 27.95 }, // <FILL/ADJUST>
    },
    {
      sizeLabel: '15×20 cm / 6×8″',
      sizeToken: '150x200',
      orientation: 'Vertical',
      frameColor: 'Black',
      productUid: 'framed_poster_mounted_150x200-mm-6x8-inch_black_wood_w12xt22-mm_plexiglass_150x200-mm-6x8-inch_170-gsm-65lb-coated-silk_4-0_ver',
      prices: { GBP: 24.95, USD: 29.95, EUR: 27.95 }, // <FILL/ADJUST>
    },
    {
        sizeLabel: '15×20 cm / 6×8″',
        sizeToken: '150x200',
        orientation: 'Vertical',
        frameColor: 'Wood',
        productUid: 'framed_poster_mounted_150x200-mm-6x8-inch_natural-wood_wood_w12xt22-mm_plexiglass_150x200-mm-6x8-inch_170-gsm-65lb-coated-silk_4-0_ver',
        prices: { GBP: 24.95, USD: 29.95, EUR: 27.95 }, // <FILL/ADJUST>
      },
      {
        sizeLabel: '15×20 cm / 6×8″',
        sizeToken: '150x200',
        orientation: 'Vertical',
        frameColor: 'Dark wood',
        productUid: 'framed_poster_mounted_150x200-mm-6x8-inch_dark-wood_wood_w12xt22-mm_plexiglass_150x200-mm-6x8-inch_170-gsm-65lb-coated-silk_4-0_ver',
        prices: { GBP: 24.95, USD: 29.95, EUR: 27.95 }, // <FILL/ADJUST>
      },

    // 30×40 cm
    {
      sizeLabel: '30×40 cm',
      sizeToken: '300x400',
      orientation: 'Vertical',
      frameColor: 'White',
      productUid: 'framed_poster_mounted_300x400-mm-12x16-inch_white_wood_w12xt22-mm_plexiglass_300x400-mm-12x16-inch_170-gsm-65lb-coated-silk_4-0_ver',
      prices: { GBP: 38.95, USD: 46.95, EUR: 43.95 }, // <FILL/ADJUST>
    },
    {
      sizeLabel: '30×40 cm',
      sizeToken: '300x400',
      orientation: 'Vertical',
      frameColor: 'Black',
      productUid: 'framed_poster_mounted_300x400-mm-12x16-inch_black_wood_w12xt22-mm_plexiglass_300x400-mm-12x16-inch_170-gsm-65lb-coated-silk_4-0_ver',
      prices: { GBP: 38.95, USD: 46.95, EUR: 43.95 }, // <FILL/ADJUST>

    },
    {
        sizeLabel: '30×40 cm',
        sizeToken: '300x400',
        orientation: 'Vertical',
        frameColor: 'Wood',
        productUid: 'framed_poster_mounted_300x400-mm-12x16-inch_natural-wood_wood_w12xt22-mm_plexiglass_300x400-mm-12x16-inch_170-gsm-65lb-coated-silk_4-0_ver',
        prices: { GBP: 38.95, USD: 46.95, EUR: 43.95 }, // <FILL/ADJUST>
      },
      {
        sizeLabel: '30×40 cm',
        sizeToken: '300x400',
        orientation: 'Vertical',
        frameColor: 'Dark wood',
        productUid: 'framed_poster_mounted_300x400-mm-12x16-inch_dark-wood_wood_w12xt22-mm_plexiglass_300x400-mm-12x16-inch_170-gsm-65lb-coated-silk_4-0_ver',
        prices: { GBP: 38.95, USD: 46.95, EUR: 43.95 }, // <FILL/ADJUST>
      },


    // 50×70 cm
    {
      sizeLabel: '50×70 cm',
      sizeToken: '500x700',
      orientation: 'Vertical',
      frameColor: 'Dark wood',
      productUid: 'framed_poster_mounted_500x700-mm-20x28-inch_dark-wood_wood_w12xt22-mm_plexiglass_500x700-mm-20x28-inch_170-gsm-65lb-coated-silk_4-0_ver',
      prices: { GBP: 52.95, USD: 64.95, EUR: 59.95 }, // <FILL/ADJUST>
    },
    {
      sizeLabel: '50×70 cm',
      sizeToken: '500x700',
      orientation: 'Vertical',
      frameColor: 'Wood',
      productUid: 'framed_poster_mounted_500x700-mm-20x28-inch_natural-wood_wood_w12xt22-mm_plexiglass_500x700-mm-20x28-inch_170-gsm-65lb-coated-silk_4-0_ver',
      prices: { GBP: 52.95, USD: 64.95, EUR: 59.95 }, // <FILL/ADJUST>
    },
    {
        sizeLabel: '50×70 cm',
        sizeToken: '500x700',
        orientation: 'Vertical',
        frameColor: 'Black',
        productUid: 'framed_poster_mounted_500x700-mm-20x28-inch_black_wood_w12xt22-mm_plexiglass_500x700-mm-20x28-inch_170-gsm-65lb-coated-silk_4-0_ver',
        prices: { GBP: 52.95, USD: 64.95, EUR: 59.95 }, // <FILL/ADJUST>
      },
      {
        sizeLabel: '50×70 cm',
        sizeToken: '500x700',
        orientation: 'Vertical',
        frameColor: 'White',
        productUid: 'framed_poster_mounted_500x700-mm-20x28-inch_white_wood_w12xt22-mm_plexiglass_500x700-mm-20x28-inch_170-gsm-65lb-coated-silk_4-0_ver',
        prices: { GBP: 52.95, USD: 64.95, EUR: 59.95 }, // <FILL/ADJUST>
      },

    // 70×100 cm / 28×40″
    {
      sizeLabel: '70×100 cm / 28×40″',
      sizeToken: '700x1000',
      orientation: 'Vertical',
      frameColor: 'Black',
      productUid: 'framed_poster_mounted_700x1000-mm-28x40-inch_black_wood_w12xt22-mm_plexiglass_700x1000-mm-28x40-inch_170-gsm-65lb-coated-silk_4-0_ver',
      prices: { GBP: 89.99, USD: 112.99, EUR: 103.99 },     },
    {
        sizeLabel: '70×100 cm / 28×40″',
        sizeToken: '700x1000',
        orientation: 'Vertical',
        frameColor: 'White',
        productUid: 'framed_poster_mounted_700x1000-mm-28x40-inch_white_wood_w12xt22-mm_plexiglass_700x1000-mm-28x40-inch_170-gsm-65lb-coated-silk_4-0_ver',
        prices: { GBP: 89.99, USD: 112.99, EUR: 103.99 },       },
    {
      sizeLabel: '70×100 cm / 28×40″',
      sizeToken: '700x1000',
      orientation: 'Vertical',
      frameColor: 'Dark wood',
      productUid:
        'framed_poster_mounted_700x1000-mm-28x40-inch_dark-wood_wood_w12xt22-mm_plexiglass_700x1000-mm-28x40-inch_170-gsm-65lb-coated-silk_4-0_ver',
        prices: { GBP: 89.99, USD: 112.99, EUR: 103.99 },     },
    {
        sizeLabel: '70×100 cm / 28×40″',
        sizeToken: '700x1000',
        orientation: 'Vertical',
        frameColor: 'Wood',
        productUid:
          'framed_poster_mounted_700x1000-mm-28x40-inch_natural-wood_wood_w12xt22-mm_plexiglass_700x1000-mm-28x40-inch_170-gsm-65lb-coated-silk_4-0_ver70 * 100',
          prices: { GBP: 89.99, USD: 112.99, EUR: 103.99 },       },
    // (Optional) horizontal examples
   // ⬇️ Append these to FRAMED_POSTER.variants (after your vertical ones)

// 15×20 cm / 6×8″ — Horizontal
{
    sizeLabel: '15×20 cm / 6×8″',
    sizeToken: '150x200',
    orientation: 'Horizontal',
    frameColor: 'White',
    productUid:
      'framed_poster_mounted_150x200-mm-6x8-inch_white_wood_w12xt22-mm_plexiglass_150x200-mm-6x8-inch_170-gsm-65lb-coated-silk_4-0_hor',
    prices: { GBP: 24.95, USD: 29.95, EUR: 27.95 },
  },
  {
    sizeLabel: '15×20 cm / 6×8″',
    sizeToken: '150x200',
    orientation: 'Horizontal',
    frameColor: 'Black',
    productUid:
      'framed_poster_mounted_150x200-mm-6x8-inch_black_wood_w12xt22-mm_plexiglass_150x200-mm-6x8-inch_170-gsm-65lb-coated-silk_4-0_hor',
    prices: { GBP: 24.95, USD: 29.95, EUR: 27.95 },
  },
  {
    sizeLabel: '15×20 cm / 6×8″',
    sizeToken: '150x200',
    orientation: 'Horizontal',
    frameColor: 'Wood',
    productUid:
      'framed_poster_mounted_150x200-mm-6x8-inch_natural-wood_wood_w12xt22-mm_plexiglass_150x200-mm-6x8-inch_170-gsm-65lb-coated-silk_4-0_hor',
    prices: { GBP: 24.95, USD: 29.95, EUR: 27.95 },
  },
  {
    sizeLabel: '15×20 cm / 6×8″',
    sizeToken: '150x200',
    orientation: 'Horizontal',
    frameColor: 'Dark wood',
    productUid:
      'framed_poster_mounted_150x200-mm-6x8-inch_dark-wood_wood_w12xt22-mm_plexiglass_150x200-mm-6x8-inch_170-gsm-65lb-coated-silk_4-0_hor',
    prices: { GBP: 24.95, USD: 29.95, EUR: 27.95 },
  },
  
  // 30×40 cm — Horizontal
  {
    sizeLabel: '30×40 cm',
    sizeToken: '300x400',
    orientation: 'Horizontal',
    frameColor: 'White',
    productUid:
      'framed_poster_mounted_300x400-mm-12x16-inch_white_wood_w12xt22-mm_plexiglass_300x400-mm-12x16-inch_170-gsm-65lb-coated-silk_4-0_hor',
    prices: { GBP: 38.95, USD: 46.95, EUR: 43.95 },
  },
  {
    sizeLabel: '30×40 cm',
    sizeToken: '300x400',
    orientation: 'Horizontal',
    frameColor: 'Black',
    productUid:
      'framed_poster_mounted_300x400-mm-12x16-inch_black_wood_w12xt22-mm_plexiglass_300x400-mm-12x16-inch_170-gsm-65lb-coated-silk_4-0_hor',
    prices: { GBP: 38.95, USD: 46.95, EUR: 43.95 },
  },
  {
    sizeLabel: '30×40 cm',
    sizeToken: '300x400',
    orientation: 'Horizontal',
    frameColor: 'Wood',
    productUid:
      'framed_poster_mounted_300x400-mm-12x16-inch_natural-wood_wood_w12xt22-mm_plexiglass_300x400-mm-12x16-inch_170-gsm-65lb-coated-silk_4-0_hor',
    prices: { GBP: 38.95, USD: 46.95, EUR: 43.95 },
  },
  {
    sizeLabel: '30×40 cm',
    sizeToken: '300x400',
    orientation: 'Horizontal',
    frameColor: 'Dark wood',
    productUid:
      'framed_poster_mounted_300x400-mm-12x16-inch_dark-wood_wood_w12xt22-mm_plexiglass_300x400-mm-12x16-inch_170-gsm-65lb-coated-silk_4-0_hor',
    prices: { GBP: 38.95, USD: 46.95, EUR: 43.95 },
  },
  
  // 50×70 cm — Horizontal
  {
    sizeLabel: '50×70 cm',
    sizeToken: '500x700',
    orientation: 'Horizontal',
    frameColor: 'Dark wood',
    productUid:
      'framed_poster_mounted_500x700-mm-20x28-inch_dark-wood_wood_w12xt22-mm_plexiglass_500x700-mm-20x28-inch_170-gsm-65lb-coated-silk_4-0_hor',
    prices: { GBP: 52.95, USD: 64.95, EUR: 59.95 },
  },
  {
    sizeLabel: '50×70 cm',
    sizeToken: '500x700',
    orientation: 'Horizontal',
    frameColor: 'Wood',
    productUid:
      'framed_poster_mounted_500x700-mm-20x28-inch_natural-wood_wood_w12xt22-mm_plexiglass_500x700-mm-20x28-inch_170-gsm-65lb-coated-silk_4-0_hor',
    prices: { GBP: 52.95, USD: 64.95, EUR: 59.95 },
  },
  {
    sizeLabel: '50×70 cm',
    sizeToken: '500x700',
    orientation: 'Horizontal',
    frameColor: 'Black',
    productUid:
      'framed_poster_mounted_500x700-mm-20x28-inch_black_wood_w12xt22-mm_plexiglass_500x700-mm-20x28-inch_170-gsm-65lb-coated-silk_4-0_hor',
    prices: { GBP: 52.95, USD: 64.95, EUR: 59.95 },
  },
  {
    sizeLabel: '50×70 cm',
    sizeToken: '500x700',
    orientation: 'Horizontal',
    frameColor: 'White',
    productUid:
      'framed_poster_mounted_500x700-mm-20x28-inch_white_wood_w12xt22-mm_plexiglass_500x700-mm-20x28-inch_170-gsm-65lb-coated-silk_4-0_hor',
    prices: { GBP: 52.95, USD: 64.95, EUR: 59.95 },
  },
  
  // 70×100 cm / 28×40″ — Horizontal
  {
    sizeLabel: '70×100 cm / 28×40″',
    sizeToken: '700x1000',
    orientation: 'Horizontal',
    frameColor: 'Black',
    productUid:
      'framed_poster_mounted_700x1000-mm-28x40-inch_black_wood_w12xt22-mm_plexiglass_700x1000-mm-28x40-inch_170-gsm-65lb-coated-silk_4-0_hor',
    prices: { GBP: 89.99, USD: 112.99, EUR: 103.99 },
  },
  {
    sizeLabel: '70×100 cm / 28×40″',
    sizeToken: '700x1000',
    orientation: 'Horizontal',
    frameColor: 'White',
    productUid:
      'framed_poster_mounted_700x1000-mm-28x40-inch_white_wood_w12xt22-mm_plexiglass_700x1000-mm-28x40-inch_170-gsm-65lb-coated-silk_4-0_hor',
    prices: { GBP: 89.99, USD: 112.99, EUR: 103.99 },
  },
  {
    sizeLabel: '70×100 cm / 28×40″',
    sizeToken: '700x1000',
    orientation: 'Horizontal',
    frameColor: 'Dark wood',
    productUid:
      'framed_poster_mounted_700x1000-mm-28x40-inch_dark-wood_wood_w12xt22-mm_plexiglass_700x1000-mm-28x40-inch_170-gsm-65lb-coated-silk_4-0_hor',
    prices: { GBP: 89.99, USD: 112.99, EUR: 103.99 },
  },
  {
    sizeLabel: '70×100 cm / 28×40″',
    sizeToken: '700x1000',
    orientation: 'Horizontal',
    frameColor: 'Wood',
    productUid:
      'framed_poster_mounted_700x1000-mm-28x40-inch_natural-wood_wood_w12xt22-mm_plexiglass_700x1000-mm-28x40-inch_170-gsm-65lb-coated-silk_4-0_hor',
    prices: { GBP: 89.99, USD: 112.99, EUR: 103.99 },
  },
  
  ],
};
