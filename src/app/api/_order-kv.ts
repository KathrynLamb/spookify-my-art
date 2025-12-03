// src/app/api/_order-kv.ts

// --- Types for assets ---
export type DraftAsset = {
  printArea: string;
  url: string;
};

// --- Prodigi + PayPal generic structures ---
export type PayPalData = Record<string, unknown>;
export type ProdigiData = Record<string, unknown>;
export type AssetList = Array<{ url: string; printArea: string }>;

// --- Final captured order type ---
export type OrderCtx = {
  orderId: string;
  userEmail: string | null;

  imageId?: string;
  sku?: string;

  amount?: number | string;
  currency?: string;

  paypal?: PayPalData;
  prodigi?: ProdigiData;
  assets?: AssetList;

  status: string;
  createdAt: number;
};

// --- Pre-capture draft order type ---
export type DraftOrderCtx = {
  imageId: string;
  fileUrl: string;
  sku?: string;
  vendor?: string;
  invoiceId: string;
  status: "CREATED";
};

// --- ORDER_CTX accepts BOTH draft and final ---
export const ORDER_CTX = new Map<string, DraftOrderCtx | OrderCtx>();
