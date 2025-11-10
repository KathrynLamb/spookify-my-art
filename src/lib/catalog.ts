// src/lib/catalog.ts
export type Orientation = 'Horizontal' | 'Vertical' | 'Square';

export type CatalogItem = {
  productId: string;                // stable id you control
  title: string;                    // for UI copy
  kind: 'card' | 'framed_print' | 'canvas' | 'cushion' | 'poster';
  orientations: Orientation[];      // must be compatible with plan.orientation
  notes?: string;                   // short merchandising hints for the model
  defaultVariant: {
    sizeLabel: string;
    frameColor?: 'Black' | 'White' | 'Natural' | string;
  };
};

// ====== 👇 Replace with your actual short list of SKUs you want to sell
export const CATALOG: CatalogItem[] = [
  {
    productId: 'cards_landscape_a6_matte',
    title: 'Holiday Card Set · A6 Landscape · Matte',
    kind: 'card',
    orientations: ['Horizontal'],
    notes: 'greeting to send, envelopes included; works with short festive text',
    defaultVariant: { sizeLabel: 'A6 landscape' },
  },
  {
    productId: 'framed_print_30x40_black',
    title: 'Framed Print · 30×40cm · Black Frame',
    kind: 'framed_print',
    orientations: ['Vertical'],
    notes: 'keepsake for wall display; memorial / family portrait',
    defaultVariant: { sizeLabel: '30×40 cm', frameColor: 'Black' },
  },
  {
    productId: 'canvas_square_20in',
    title: 'Canvas Wrap · 20″ Square',
    kind: 'canvas',
    orientations: ['Square'],
    notes: 'bold wall art; looks good with graphic/illustrative styles',
    defaultVariant: { sizeLabel: '20″ square' },
  },
  {
    productId: 'throw_pillow_18in',
    title: 'Throw Pillow · 18″ Square',
    kind: 'cushion',
    orientations: ['Square'],
    notes: 'cozy, comforting, sofa; initials or small text can work',
    defaultVariant: { sizeLabel: '18″ square' },
  },
];
