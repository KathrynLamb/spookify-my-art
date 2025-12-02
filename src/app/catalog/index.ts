// catalog/index.ts
import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 'mug',
    title: 'Mugs',
    category: 'drinkware',
    thumbnail: '/jollyfy/mug.png',
    route: '/jollyfy/products?cat=mugs',
    orientations: ['Horizontal'], // artwork wraps horizontally
    sizes: [
      {
        id: 'mug_11oz',
        widthIn: 9, heightIn: 3.5, // printable wrap area
        orientation: 'Horizontal',
        dpiRecommended: 300,
        printableAreaIn: { widthIn: 9, heightIn: 3.5, offsetLeftIn: 0.25 }, // handle clearance buffer
        safeMarginIn: 0.25,
      },
      {
        id: 'mug_15oz',
        widthIn: 9.5, heightIn: 4,
        orientation: 'Horizontal',
        dpiRecommended: 300,
        printableAreaIn: { widthIn: 9.5, heightIn: 4, offsetLeftIn: 0.25 },
        safeMarginIn: 0.25,
      },
    ],
    variants: [
      { id: 'mug_white_11oz', sizeId: 'mug_11oz', material: 'ceramic', color: 'white',
        providerSku: { gelato: 'mug_white_11oz_sku' } },
      { id: 'mug_white_15oz', sizeId: 'mug_15oz', material: 'ceramic', color: 'white',
        providerSku: { gelato: 'mug_white_15oz_sku' } },
    ],
    aiHints: {
      promptDo: [
        'Center key subject away from edges',
        'Design as a wide banner; avoid tall compositions',
      ],
      promptDont: ['Avoid tiny text near handle area', 'No critical details within 0.25in margins'],
      colorProfile: 'sRGB',
      backgroundAdvice: 'Use full-bleed color or soft pattern; leave rim/handle plain',
      textAdvice: 'Short phrases work best; 20–40 pt at 300 dpi',
    },
  },

  {
    id: 'holiday_card',
    title: 'Holiday cards',
    category: 'cards',
    thumbnail: '/jollyfy/cards.png',
    route: '/jollyfy/products?cat=posters',
    orientations: ['Horizontal', 'Vertical'],
    sizes: [
      { id: 'card_5x7_vert',  widthIn: 5, heightIn: 7, orientation: 'Vertical',   dpiRecommended: 300, bleedIn: 0.125, safeMarginIn: 0.25 },
      { id: 'card_5x7_horiz', widthIn: 7, heightIn: 5, orientation: 'Horizontal', dpiRecommended: 300, bleedIn: 0.125, safeMarginIn: 0.25 },
    ],
    variants: [
      { id: 'card_folded_5x7_matte_v',  sizeId: 'card_5x7_vert',  finish: 'matte', providerSku: { gelato: 'folded_5x7_matte_v' } },
      { id: 'card_folded_5x7_matte_h',  sizeId: 'card_5x7_horiz', finish: 'matte', providerSku: { gelato: 'folded_5x7_matte_h' } },
    ],
    aiHints: {
      promptDo: ['Leave safe area for text', 'Seasonal motifs welcome, no heavy black fills for matte stock'],
      promptDont: ['Do not place faces at trim edges', 'Avoid micro text < 8pt'],
      colorProfile: 'sRGB',
      backgroundAdvice: 'Allow 0.125in bleed on all sides',
      textAdvice: 'Plan headline + short message; keep inside margins 0.25in',
    },
  },

  {
    id: 'cushion',
    title: 'Cushions',
    category: 'soft',
    thumbnail: '/jollyfy/prod-cushion.png',
    route: '/jollyfy/products?cat=cushions',
    orientations: ['Square'],
    sizes: [
      { id: 'cushion_18', widthIn: 18, heightIn: 18, orientation: 'Square', dpiRecommended: 200, bleedIn: 0.5, safeMarginIn: 0.5 },
    ],
    variants: [
      { id: 'cushion_18_satin', sizeId: 'cushion_18', material: 'poly', finish: 'satin', providerSku: { gelato: 'cushion_18_satin' } },
    ],
    aiHints: {
      promptDo: ['Use bold shapes and readable contrast', 'Consider seamless patterns'],
      promptDont: ['Avoid fine linework at seams'],
      colorProfile: 'sRGB',
      backgroundAdvice: 'Design full-bleed; account for seam loss ~0.5in',
      textAdvice: 'If adding initials, keep at least 1in from edges',
    },
  },

  {
    id: 'framed_print',
    title: 'Framed prints',
    category: 'wall',
    thumbnail: '/jollyfy/framed.png',
    route: '/jollyfy/products?cat=prints',
    orientations: ['Horizontal', 'Vertical', 'Square'],
    sizes: [
      { id: 'print_11x14_v', widthIn: 11, heightIn: 14, orientation: 'Vertical', dpiRecommended: 300, bleedIn: 0.125, safeMarginIn: 0.25 },
      { id: 'print_16x20_h', widthIn: 20, heightIn: 16, orientation: 'Horizontal', dpiRecommended: 240, bleedIn: 0.125, safeMarginIn: 0.25 },
      { id: 'print_12x12_s', widthIn: 12, heightIn: 12, orientation: 'Square', dpiRecommended: 300, bleedIn: 0.125, safeMarginIn: 0.25 },
    ],
    variants: [
      { id: 'framed_black_11x14', sizeId: 'print_11x14_v', frameColor: 'black', finish: 'matte', providerSku: { gelato: 'framed_black_11x14' } },
    ],
    aiHints: {
      promptDo: ['Gallery-style compositions, clean edges'],
      promptDont: ['Avoid text too close to frame rebate'],
      colorProfile: 'sRGB',
      backgroundAdvice: 'Design for slight mat overlap; keep key content inside safe area',
      textAdvice: 'Prefer no text or minimal captions',
    },
  },
];
