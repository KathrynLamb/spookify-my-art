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

  // Fetch from backend if sessionId or orderId exists
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!sessionId && !orderId) {
          setError('Missing session or order ID.');
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/orders/get`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, orderId }),
        });

        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else {
          // fallback to URL data if server has nothing
          setOrder({
            orderId: orderId || 'unknown',
            imageId: imageId || undefined,
            fileUrl: fileUrl || undefined,
            title: title || 'Custom Artwork',
            amount: amount ? Number(amount) : undefined,
            currency: currency || 'GBP',
          });
        }
      // } catch (err) {
      //   setError('Could not load order details.'err);
      // } finally {
      //   setLoading(false);
      // }
    } catch {
      setError('Could not load order details.');
    } finally {
      setLoading(false);
    }
    };

    fetchOrder();
  }, [sessionId, orderId, imageId, fileUrl, amount, currency, title]);

  // Format currency
  const fmt = (n?: number, c?: string) => {
    if (!n || !c) return '';
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: c }).format(n);
    } catch {
      return `${n.toFixed(2)} ${c}`;
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
        <a href="mailto:katylamb@gmail.com" className="underline">
          katylamb@gmail.com
        </a>
        .
      </div>
    </div>
  );
}
