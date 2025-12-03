"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/* ---------------------------------------------
 * Types
 * --------------------------------------------- */
export type OrderAsset = {
  url: string;
  [key: string]: unknown;
};

export type PaypalInfo = {
  payer?: {
    email_address?: string;
  };
  [key: string]: unknown;
};

export type OrderRecord = {
  orderId: string;
  status: "created" | "processing" | "fulfilled" | "error";
  invoiceId?: string;
  createdAt: string;
  fileUrl?: string;
  assets?: OrderAsset[];
  paypal?: PaypalInfo;
  userEmail: string | null;
  [key: string]: unknown;
};

/* ---------------------------------------------
 * Page Component
 * --------------------------------------------- */
export default function OrderDetail({
  params,
}: {
  params: { orderId: string };
}) {
  const [order, setOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/orders/${params.orderId}`);
      const data: OrderRecord = await res.json();
      setOrder(data);
    }
    load();
  }, [params.orderId]);

  if (!order) {
    return <div className="p-6 text-white">Loading…</div>;
  }

  const thumb =
    order.assets?.[0]?.url || order.fileUrl || "/placeholder.png";

  return (
    <main className="max-w-3xl mx-auto p-6 text-white space-y-6">
      <h1 className="text-2xl font-bold">Order #{order.orderId}</h1>

      <div className="relative w-full h-72 rounded-xl overflow-hidden border border-white/10">
        <Image src={thumb} alt="Artwork" fill className="object-cover" />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
        <div>Status: {order.status}</div>
        {order.invoiceId && <div>Invoice: {order.invoiceId}</div>}
        <div>Date: {new Date(order.createdAt).toLocaleString()}</div>
        <div>Email: {order.paypal?.payer?.email_address ?? "—"}</div>
      </div>

      <a
        href={`/api/orders/invoice/${order.orderId}`}
        className="inline-block px-4 py-2 rounded-md bg-pink-500 text-black hover:bg-pink-400"
      >
        Download Invoice
      </a>
    </main>
  );
}
