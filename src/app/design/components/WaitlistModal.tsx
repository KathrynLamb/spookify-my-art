'use client';

import { useState } from 'react';
import { WaitlistProduct } from '../types';

/* -------------------------------------------------------------
 * TYPES
 * ------------------------------------------------------------- */
// export type WaitlistProduct = {
//   title: string;
//   productUID: string;
// };

type WaitlistModalProps = {
  product: WaitlistProduct | null;
  isOpen: boolean;
  onClose: () => void;
};

/* -------------------------------------------------------------
 * COMPONENT
 * ------------------------------------------------------------- */
export default function WaitlistModal({
  product,
  isOpen,
  onClose,
}: WaitlistModalProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] =
    useState<'idle' | 'loading' | 'done'>('idle');

  if (!isOpen || !product) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
  
    const p = product!; // TS: product is guaranteed non-null here
  
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          productTitle: p.title,
          productUID: p.productUID,
        }),
        cache: 'no-store',
      });
  
      setStatus('done');
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try later.');
      setStatus('idle');
    }
  }
  

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#111216] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-xl font-semibold mb-2">
          {product.title} is coming soon
        </h3>

        <p className="text-sm text-white/70 mb-3">
          Enter your email and we’ll notify you the moment it launches.
        </p>

        {status === 'done' ? (
          <p className="text-emerald-400 text-sm">
            Thanks! You’re on the list 🎉
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-sm text-white"
            />

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-lg bg-emerald-500 text-black py-2 font-medium hover:bg-emerald-400 disabled:opacity-50"
            >
              {status === 'loading' ? 'Adding…' : 'Notify me'}
            </button>
          </form>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full text-xs text-white/40 hover:text-white/70"
        >
          Close
        </button>
      </div>
    </div>
  );
}
