// src/data/products.ts
export type Sellable = {
    code: string;               // your SKU
    title: string;              // UI
    kind: 'poster'|'frame'|'canvas'|'metal';
    sizeCm: [number, number];   // for aspect validation/preview
    stripePriceCents: number;   // your price
    // Optional: if you insist on ProductUID path later:
    gelatoProductUid?: string;  // fill once you know it
  };
  
  export const CATALOG: Sellable[] = [
    { code:'POSTER_M200_A4',     title:'Poster – A4 (21×30)', kind:'poster', sizeCm:[21,30], stripePriceCents:1499 },
    { code:'POSTER_M200_A3',     title:'Poster – A3 (30×42)', kind:'poster', sizeCm:[30,42], stripePriceCents:1999 },
    { code:'POSTER_M200_A2',     title:'Poster – A2 (42×59.4)', kind:'poster', sizeCm:[42,59.4], stripePriceCents:2999 },
    { code:'POSTER_M200_30x40',  title:'Poster – 30×40', kind:'poster', sizeCm:[30,40], stripePriceCents:2499 },
    { code:'POSTER_M200_50x70',  title:'Poster – 50×70', kind:'poster', sizeCm:[50,70], stripePriceCents:3499 },
    { code:'POSTER_M200_60x90',  title:'Poster – 60×90', kind:'poster', sizeCm:[60,90], stripePriceCents:4499 },
  
    { code:'FRAME_BLK_A4',       title:'Framed Poster – A4 (Black)', kind:'frame', sizeCm:[21,30], stripePriceCents:2999 },
    { code:'FRAME_BLK_30x40',    title:'Framed Poster – 30×40 (Black)', kind:'frame', sizeCm:[30,40], stripePriceCents:3999 },
    { code:'FRAME_BLK_50x70',    title:'Framed Poster – 50×70 (Black)', kind:'frame', sizeCm:[50,70], stripePriceCents:5999 },
  
    { code:'CANVAS_30x40',       title:'Canvas Wrap – 30×40', kind:'canvas', sizeCm:[30,40], stripePriceCents:4499 },
    { code:'CANVAS_40x50',       title:'Canvas Wrap – 40×50', kind:'canvas', sizeCm:[40,50], stripePriceCents:5999 },
    { code:'CANVAS_50x70',       title:'Canvas Wrap – 50×70', kind:'canvas', sizeCm:[50,70], stripePriceCents:7499 },
  
    { code:'METAL_30x40',        title:'Metal Print – 30×40', kind:'metal', sizeCm:[30,40], stripePriceCents:6499 },
    { code:'METAL_50x70',        title:'Metal Print – 50×70', kind:'metal', sizeCm:[50,70], stripePriceCents:9999 },
  ];
  