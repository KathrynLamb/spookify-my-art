// Dev-only in-memory store for order context.
// NOTE: resets on deployment/restart. Use Redis/DB for production.
export type OrderCtx = {
    fileUrl?: string;
    imageId?: string;
  };
  
  export const ORDER_CTX = new Map<string, OrderCtx>();
  