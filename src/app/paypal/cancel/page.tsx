"use client";

import { useRouter } from "next/navigation";

export default function PayPalCancelPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold">Checkout cancelled</h1>
        <p className="mt-2 text-sm text-white/60">
          No worries — your project is still safe. You can resume anytime.
        </p>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => router.replace("/dashboard")}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10 transition"
          >
            Back to dashboard
          </button>
          <button
            onClick={() => router.replace("/")}
            className="flex-1 rounded-xl bg-white text-black px-3 py-2 text-xs font-semibold hover:opacity-90 transition"
          >
            Browse products
          </button>
        </div>
      </div>
    </main>
  );
}
