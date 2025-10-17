import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Suspense fallback={<div className="p-6 text-white/70">Loading…</div>}>
        <CheckoutClient />
      </Suspense>
    </main>
  );
}
