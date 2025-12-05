// src/types/order.ts

export type OrderAsset = {
    url: string;
    printArea?: string;
    [key: string]: unknown;
  };
  
  export type PaypalInfo = {
    payer?: {
      email_address?: string;
    };
    [key: string]: unknown;
  };
  
  /**
   * Canonical OrderRecord for Spookify.
   * - Works with Firestore docs, your /api/orders/list output,
   *   PayPal creation/capture flows, and Prodigi handoff.
   * - Allows createdAt/updatedAt to be number (ms) or ISO string.
   * - Keeps status flexible enough for legacy values.
   */
  export type OrderRecord = {
    orderId: string;
  
    userEmail?: string | null;
  
    status?: "created" | "processing" | "fulfilled" | "error" | "unknown" | string;
  
    amount?: number | null;
    currency?: string | null;
  
    createdAt?: number | string | null;
    updatedAt?: number | string | null;
  
    fileUrl?: string | null;
    previewUrl?: string | null;
  
    assets?: OrderAsset[];
  
    sku?: string | null;
    invoiceId?: string | null;
  
    paypal?: PaypalInfo;
  
    // Allow forward-compat fields from vendors
    [key: string]: unknown;
  };
  
  /** Small shared helper for UI */
  export function normalizeOrderDate(
    value: OrderRecord["createdAt"]
  ): Date | null {
    if (typeof value === "number") {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === "string") {
      const ms = Date.parse(value);
      return Number.isNaN(ms) ? null : new Date(ms);
    }
    return null;
  }
  