// src/hooks/useOrders.ts
"use client";

import { OrderRecord } from "@/app/design/types/order";
import { useEffect, useState } from "react";



interface OrdersResponse {
  ok: boolean;
  orders?: OrderRecord[];
  error?: string;
}

export function useOrders(userEmail: string | null) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userEmail) return;

    const email = userEmail; // ✅ narrow to string

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/orders/list?email=${encodeURIComponent(email)}`,
        );

        if (!res.ok) {
          console.error("Orders fetch failed with status", res.status);
          setOrders([]);
          return;
        }

        const data: OrdersResponse = await res.json();
        setOrders(data.orders ?? []);
      } catch (err) {
        console.error("Failed loading orders", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userEmail]);


  return { orders, loading };
}
