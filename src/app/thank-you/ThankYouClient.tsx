'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';

type OrderData = {
  orderId: string;
  imageId?: string;
  fileUrl?: string;
  title?: string;
  amount?: number;
  currency?: string;
  createdAt?: string;
  frameColor?: string;
  size?: string;
  orientation?: string;
  gelato?: { ok?: boolean; digital?: boolean; note?: string };
};

export default function ThankYouPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const sessionId = sp.get('sessionId');
  const orderId = sp.get('orderId');
  const imageId = sp.get('imageId');
  const fileUrl = sp.get('fileUrl');
  const amount = sp.get('amount');
  const currency = sp.get('currency');
  const title = sp.get('title');




  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDigital =
  sp.get('digital') === '1' || order?.gelato?.digital === true;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!sessionId && !orderId) {
          // Don't hard error—fallback to URL params below
          setOrder({
            orderId: orderId || 'unknown',
            imageId: imageId || undefined,
            fileUrl: fileUrl || undefined,
            title: title || 'Custom Artwork',
            amount: amount ? Number(amount) : undefined,
            currency: currency || 'GBP',
            gelato: sp.get('digital') === '1' ? { digital: true } : undefined,
          });
          setLoading(false);
          return;
        }
  
        const res = await fetch(`/api/orders/get`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, orderId }),
        });
  
        if (res.ok) {
          const data = await res.json();              // ✅ parse ONCE
          setOrder({
            ...data,
            fileUrl: data.fileUrl ?? fileUrl ?? undefined,       // ✅ URL fallback
            imageId: data.imageId ?? imageId ?? undefined,
            gelato: data.gelato ?? (sp.get('digital') === '1' ? { digital: true } : undefined),
          });
        } else {
          // ✅ server couldn’t fetch PayPal—still use URL data so download works
          setOrder({
            orderId: orderId || 'unknown',
            imageId: imageId || undefined,
            fileUrl: fileUrl || undefined,
            title: title || 'Custom Artwork',
            amount: amount ? Number(amount) : undefined,
            currency: currency || 'GBP',
            gelato: sp.get('digital') === '1' ? { digital: true } : undefined,
          });
        }
      } catch {
        setError('Could not load order details.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchOrder();
  }, [sessionId, orderId, imageId, fileUrl, amount, currency, title, sp]);
  

  const fmt = (n?: number, c?: string) => {
    if (!n || !c) return '';
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: c }).format(n);
    } catch {
      return `${n.toFixed(2)} ${c}`;
    }
  };

  const handleDownload = async () => {
    console.log("ORDERE", order)
    if (!order?.fileUrl || !order?.imageId) return;
    try {
      const res = await fetch('/api/generate-print-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: order.fileUrl, imageId: order.imageId }),
      });

      if (!res.ok) throw new Error('Failed to generate print package');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spookify-print-package-${order.imageId}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch  {
      alert('Could not download your print package. Please contact support.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white/70">
        Loading your order…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white/70">
        No order data found.
      </div>
    );
  }



  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-white">
      <h1 className="text-3xl font-bold mb-4">🎉 Thank you for your order!</h1>

      <p className="text-white/70 mb-8">
        Your {order.title || 'custom artwork'} has been successfully ordered.
        {order.orderId && (
          <>
            <br />
            <span className="text-sm text-white/50">Order ID: {order.orderId}</span>
          </>
        )}
      </p>

      {order.fileUrl && (
        <div className="relative mx-auto mb-8 aspect-square w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-black/20">
          <Image
            src={order.fileUrl}
            alt="Your artwork"
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-contain"
          />
        </div>
      )}

      <div className="mb-8 text-lg font-medium">
        {order.amount && order.currency ? fmt(order.amount, order.currency) : null}
      </div>

      <div className="flex flex-col items-center gap-3">
        {isDigital ? (
          <button
            onClick={handleDownload}
            className="rounded-lg bg-green-600 px-5 py-2.5 font-semibold text-white hover:bg-green-500"
          >
            ⬇️ Download Your Print Package
          </button>
        ) : (
          <p className="text-white/60">
            Your order will be printed and shipped soon.
          </p>
        )}

        <a
          href="/products"
          className="rounded-lg bg-[#FF6A2B] px-5 py-2.5 font-semibold text-white hover:bg-[#FF814E]"
        >
          Browse More Products
        </a>
        <button
          onClick={() => router.push('/upload')}
          className="rounded-lg border border-white/20 bg-transparent px-5 py-2.5 font-semibold text-white/80 hover:bg-white/10"
        >
          Spookify Another Image
        </button>
      </div>

      <div className="mt-12 text-xs text-white/40">
        If you don’t receive a confirmation email soon, check your spam folder or contact us at{' '}
        <a href="mailto:support@gaigifts.org" className="underline">
        support@gaigifts.org
        </a>
        .
      </div>
    </div>
  );
}
