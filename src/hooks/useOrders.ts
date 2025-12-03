import { useEffect, useState } from "react";

/* ---------------------------------------------
 * Types
 * --------------------------------------------- */
export interface OrderAsset {
  url: string;
  [key: string]: unknown;
}

export interface PaypalInfo {
  payer?: {
    email_address?: string;
  };
  [key: string]: unknown;
}

export interface OrderRecord {
  orderId: string;
  status: "created" | "processing" | "fulfilled" | "error";
  createdAt: string;
  invoiceId?: string;
  fileUrl?: string;
  assets?: OrderAsset[];
  paypal?: PaypalInfo;
  userEmail: string | null;
  amount?: number;
  currency?: string;
  [key: string]: unknown;
}

export function useOrders(userEmail: string | null) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userEmail) return;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/orders/list?email=${encodeURIComponent(userEmail as string)}`
        );
        const data: { orders?: OrderRecord[] } = await res.json();
        setOrders(data.orders ?? []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userEmail]);

  return { orders, loading };
}
