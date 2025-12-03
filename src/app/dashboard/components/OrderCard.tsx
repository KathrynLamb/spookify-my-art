"use client";

import Image from "next/image";
import { motion } from "framer-motion";

/* ---------------------------------------------
 * Order Types
 * --------------------------------------------- */
export type OrderAsset = {
  url: string;
};

export type DashboardOrder = {
  orderId: string;
  createdAt: number | string;
  status: string;
  fileUrl?: string;
  previewUrl?: string;
  assets?: OrderAsset[];
};

/* ---------------------------------------------
 * Component
 * --------------------------------------------- */
export function OrderCard({ order }: { order: DashboardOrder }) {
  const thumb =
    order.assets?.[0]?.url ||
    order.fileUrl ||
    order.previewUrl ||
    "/placeholder.png";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-white/5 p-4 flex gap-4"
    >
      {/* THUMB */}
      <div className="relative w-20 h-20 rounded-lg overflow-hidden">
        <Image src={thumb} alt="Order image" fill className="object-cover" />
      </div>

      {/* INFO */}
      <div className="flex-1">
        <div className="text-white font-semibold">Order #{order.orderId}</div>

        <div className="text-xs text-white/40">
          {new Date(order.createdAt).toLocaleString()}
        </div>

        <div className="text-xs mt-2 px-2 py-1 rounded-md bg-white/10 text-white/70 inline-block">
          {order.status}
        </div>
      </div>
    </motion.div>
  );
}
