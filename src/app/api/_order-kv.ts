// src/app/api/_order-kv.ts

// Dev-only in-memory store for order context.
// NOTE: resets on deployment/restart. Use Redis/DB for production.

export type DraftAsset = {
  printArea: string;
  url: string;
};

export type OrderDraft = {
  prodigiSku: string;
  printSpecId?: string;
  assets: DraftAsset[];
};

/**
 * A fully typed order context.
 */
export type OrderCtx = {
  fileUrl?: string;
  imageId?: string;
  vendor?: string;
  sku?: string;
  draft?: OrderDraft;
};

export const ORDER_CTX = new Map<string, OrderCtx>();
