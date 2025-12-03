"use client";

import { useUser } from "@/hooks/useUser"; // your existing auth hook
import { useOrders } from "@/hooks/useOrders";
import { OrderCard } from "@/app/SharedComponents/OrderCard";


export default function OrdersDashboard() {
  const { user } = useUser(); // must return { email }
  const email = user?.email ?? null;

  const { orders, loading } = useOrders(email);

  return (
    <main className="max-w-4xl mx-auto p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Your Orders</h1>

      {loading && <div>Loading orders…</div>}

      {!loading && orders.length === 0 && (
        <div className="text-white/60">{`You haven't ordered any prints yet.`}</div>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.orderId} order={order} />
        ))}
      </div>
    </main>
  );
}
