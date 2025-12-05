"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Keep this loose on purpose:
 * - Your API might return { ok: false, error }
 * - Or might throw a generic { error } with non-2xx
 */
type CaptureResult =
  | { ok: true; orderId: string }
  | { ok: false; error?: string }
  | { ok?: false; error?: string };

function pickError(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const maybe = payload as Record<string, unknown>;
  const err = maybe.error;
  return typeof err === "string" && err.trim() ? err : undefined;
}

export default function PayPalReturnPage() {
  const search = useSearchParams();
  const router = useRouter();

  // PayPal will send back token + PayerID when using return_url
  const token = useMemo(() => search.get("token"), [search]);
  const payerId = useMemo(() => search.get("PayerID"), [search]);

  const [status, setStatus] = useState<"idle" | "working" | "ok" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
        setStatus("error");
        setError("Missing PayPal token.");
        return;
      }
      
    const orderId = token; // ✅ now a stable non-null string for this effect
      

    let cancelled = false;

    async function run() {
      try {
        setStatus("working");
        setError(null);
        const res = await fetch("/api/paypal/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderID: orderId }),
          });

        let json: unknown = null;
        try {
          json = await res.json();
        } catch {
          // ignore JSON parse errors; we'll handle via res.ok check
        }

        // 1) Hard fail on non-2xx first (json shape not guaranteed)
        if (!res.ok) {
          throw new Error(pickError(json) || "Payment capture failed.");
        }

        // 2) Now we can treat it as CaptureResult-ish
        const typed = json as CaptureResult;

        if (typed && typeof typed === "object" && "ok" in typed) {
          if (typed.ok === false) {
            throw new Error(typed.error || "Payment capture failed.");
          }
        }

        if (cancelled) return;

        setStatus("ok");

        // Choose your post-payment destination
        router.replace(`/thank-you?orderId=${encodeURIComponent(orderId)}`);
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown capture error";
        if (cancelled) return;
        setStatus("error");
        setError(msg);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
          PayPal return
          {payerId ? <span className="text-white/40">· {payerId}</span> : null}
        </div>

        <h1 className="mt-3 text-xl font-semibold">
          {status === "working" && "Finalizing your order…"}
          {status === "ok" && "Payment captured"}
          {status === "error" && "Something went wrong"}
          {status === "idle" && "Preparing checkout…"}
        </h1>

        <p className="mt-2 text-sm text-white/60">
          {status === "working" &&
            "We’re confirming your payment and sending your file to production."}
          {status === "ok" && "You’ll be redirected to your confirmation page."}
          {status === "error" &&
            "We couldn’t finalize your payment. Please try again."}
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
            {error}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => router.replace("/dashboard")}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10 transition"
          >
            Back to dashboard
          </button>

          {token && status === "error" && (
            <button
              onClick={() => window.location.reload()}
              className="flex-1 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-3 py-2 text-xs font-semibold text-black hover:opacity-90 transition"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
