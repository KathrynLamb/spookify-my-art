// src/data/products/framed-poster.ts
export type Currency = 'GBP' | 'USD' | 'EUR';
export type Orientation = 'Portrait' | 'Landscape' | 'Square';
export type FrameColor = 'Black' | 'White' | 'Wood' | 'Dark wood';

export type PriceTable = Partial<Record<Currency, number>>; // major units

export type FramedPosterVariant = {
  sizeLabel: string;        // shown in UI
  sizeToken: string;        // internal key (e.g. "300x400")
  orientation: Orientation; // Portrait | Landscape | Square
  frameColor: FrameColor;
  productUid: string;       // Gelato productUid for this combo
  prices: PriceTable;
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
  sizes: string[];              // all labels exposed in UI
  variants: FramedPosterVariant[]; // concrete, orderable combos
};

/* ----------------- Config ----------------- */

const FRAME_COLORS: FrameColor[] = ['Black', 'White', 'Wood', 'Dark wood'];

// Retail prices by UI size label (rectangular)
export const PRICE_BY_SIZE: Record<string, PriceTable> = {
  '15×20 cm / 6×8″':          { GBP: 29.99, USD: 34.99, EUR: 32.99 },
  '30×40 cm':                 { GBP: 47.99, USD: 57.99, EUR: 53.99 },
  '50×70 cm':                 { GBP: 69.99, USD: 84.99, EUR: 79.99 },
  '70×100 cm / 28×40″':       { GBP: 104.99, USD: 124.99, EUR: 114.99 },
};

// Rectangular sizes (Portrait/Landscape)
const RECT_SIZES = [
  { sizeLabel: '15×20 cm / 6×8″',   mm: '150x200-mm',  inches: '6x8-inch',   token: '150x200'  },
  { sizeLabel: '30×40 cm',          mm: '300x400-mm',  inches: '12x16-inch', token: '300x400'  },
  { sizeLabel: '50×70 cm',          mm: '500x700-mm',  inches: '20x28-inch', token: '500x700'  },
  { sizeLabel: '70×100 cm / 28×40″',mm: '700x1000-mm', inches: '28x40-inch', token: '700x1000' },
] as const;

// Square sizes (Square orientation)
const SQUARE_SIZES = [
  { sizeLabel: '20×20 cm / 8″×8″',   mm: '200x200-mm', inches: '8x8-inch',   token: '200x200'  },
  { sizeLabel: '30×30 cm / 12″×12″', mm: '300x300-mm', inches: '12x12-inch', token: '300x300'  },
  { sizeLabel: '40×40 cm / 16″×16″', mm: '400x400-mm', inches: '16x16-inch', token: '400x400'  },
  { sizeLabel: '50×50 cm / 20″×20″', mm: '500x500-mm', inches: '20x20-inch', token: '500x500'  },
  { sizeLabel: '70×70 cm / 28″×28″', mm: '700x700-mm', inches: '28x28-inch', token: '700x700'  },
] as const;

// Square price table (set/adjust as you like)
const SQUARE_PRICE_TABLE = new Map<string, PriceTable>([
  ['200x200-mm', { GBP: 19.99, USD: 22.99, EUR: 21.99 }],
  ['300x300-mm', { GBP: 24.99, USD: 28.99, EUR: 26.99 }],
  ['400x400-mm', { GBP: 34.99, USD: 39.99, EUR: 37.99 }],
  ['500x500-mm', { GBP: 44.99, USD: 51.99, EUR: 48.99 }],
  ['700x700-mm', { GBP: 64.99, USD: 74.99, EUR: 69.99 }],
]);

/* ----------------- UID helpers ----------------- */
/** Map UI frame color to Gelato token segment */
const frameToken = (fc: FrameColor) =>
  fc === 'Black' ? 'black_wood'
: fc === 'White' ? 'white_wood'
: fc === 'Wood'  ? 'natural-wood_wood' // matches Gelato’s “natural-wood_wood” in your examples
:                  'dark-wood_wood';

/**
 * Build Gelato productUid for framed mounted prints.
 * Adjust this pattern if your catalog uses different segments (paper stock, glazing, frame profile, etc).
 *
 * @param mm      e.g. "300x400-mm"
 * @param inches  e.g. "12x16-inch"
 * @param fc      frame color
 * @param suffix  'ver' | 'hor' (Gelato often uses these even for square)
 */
const buildFramedMountedUid = (
  mm: string,
  inches: string,
  fc: FrameColor,
  suffix: 'ver' | 'hor' = 'ver'
) =>
  `framed_poster_mounted_${mm}-${inches}_${frameToken(fc)}_w12xt22-mm_plexiglass_${mm}-${inches}_170-gsm-65lb-coated-silk_4-0_${suffix}`;

/* ----------------- Generators ----------------- */

const buildRectVariants = (): FramedPosterVariant[] =>
  RECT_SIZES.flatMap(({ sizeLabel, mm, inches, token }) =>
    FRAME_COLORS.flatMap<FramedPosterVariant>((fc) => ([
      // Portrait
      {
        sizeLabel,
        sizeToken: token,
        orientation: 'Portrait',
        frameColor: fc,
        productUid: buildFramedMountedUid(mm, inches, fc, 'ver'),
        prices: PRICE_BY_SIZE[sizeLabel] ?? { GBP: 0, USD: 0, EUR: 0 },
      },
      // Landscape
      {
        sizeLabel,
        sizeToken: token,
        orientation: 'Landscape',
        frameColor: fc,
        productUid: buildFramedMountedUid(mm, inches, fc, 'hor'),
        prices: PRICE_BY_SIZE[sizeLabel] ?? { GBP: 0, USD: 0, EUR: 0 },
      },
    ]))
  );

const buildSquareVariants = (): FramedPosterVariant[] =>
  SQUARE_SIZES.flatMap(({ sizeLabel, mm, inches, token }) =>
    FRAME_COLORS.map<FramedPosterVariant>((fc) => ({
      sizeLabel,
      sizeToken: token,
      orientation: 'Square',
      frameColor: fc,
      // Square prints don't change with rotation, but many Gelato UIDs still use a suffix; 'ver' is fine.
      productUid: buildFramedMountedUid(mm, inches, fc, 'ver'),
      prices: SQUARE_PRICE_TABLE.get(mm) ?? { GBP: 0, USD: 0, EUR: 0 },
    }))
  );

/* ----------------- Export product ----------------- */

export const FRAMED_POSTER: FramedPosterProduct = {
  slug: 'framed-poster',
  title: 'Premium Wooden Framed Poster',
  description:
    'Semi-gloss 200 gsm poster mounted behind plexiglass in a wooden frame. Ready-to-hang option available in most regions.',
  baseCategory: 'Wall art',
  paper: 'Premium Semi-Gloss 200 gsm',
  glazing: 'Plexiglass',

  orientations: ['Portrait', 'Landscape', 'Square'],
  frameColors: FRAME_COLORS,

  sizes: [
    // rectangular
    '15×20 cm / 6×8″',
    '30×40 cm',
    '50×70 cm',
    '70×100 cm / 28×40″',
    // square
    '20×20 cm / 8×8″',
    '30×30 cm / 12×12″',
    '40×40 cm / 16×16″',
    '50×50 cm / 20×20″',
    '70×70 cm / 28×28″',
  ],

  variants: [
    ...buildRectVariants(),
    ...buildSquareVariants(),
  ],
};
