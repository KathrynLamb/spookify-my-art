"use client";

import Image from "next/image";

/* -------------------------------------------------------------
 * ORDER TYPE — matches what PayPal + Prodigi + Firestore store
 * ------------------------------------------------------------- */
export type OrderAsset = {
  url: string;
  printArea?: string;
};

export type OrderRecord = {
  orderId: string;
  userEmail: string | null;
  createdAt: string; // ISO date
  status: "created" | "processing" | "fulfilled" | "error";
  fileUrl?: string;
  previewUrl?: string;
  assets?: OrderAsset[];
  sku?: string;
};

/* -------------------------------------------------------------
 * ORDER CARD COMPONENT
 * ------------------------------------------------------------- */
export function OrderCard({ order }: { order: OrderRecord }) {
  const thumb =
    order.assets?.[0]?.url ||
    order.previewUrl ||
    order.fileUrl ||
    "/placeholder.png";

  const createdDate = new Date(order.createdAt).toLocaleDateString();

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex gap-4 hover:bg-white/10 transition">
      {/* THUMBNAIL */}
      <div className="relative w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
        <Image src={thumb} alt="Order image" fill className="object-cover" />
      </div>

      {/* INFO */}
      <div className="flex-1">
        <div className="font-semibold text-white text-sm">
          Order #{order.orderId}
        </div>

        <div className="text-xs text-white/60">{createdDate}</div>

        <div className="mt-1">
          <span className="px-2 py-1 rounded-full text-xs bg-white/10 border border-white/10 capitalize">
            {order.status}
          </span>
        </div>

        {/* ACTIONS */}
        <div className="mt-3 flex gap-2">
          <a
            href={`/orders/${order.orderId}`}
            className="px-3 py-1 text-xs rounded-md bg-pink-500 text-black hover:bg-pink-400"
          >
            View Order
          </a>

          <a
            href={`/api/orders/invoice/${order.orderId}`}
            className="px-3 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20"
          >
            Invoice
          </a>
        </div>
      </div>
    </div>
  );
}
