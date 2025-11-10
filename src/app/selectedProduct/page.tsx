'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { CATALOG } from '@/lib/catalog'; // adjust path if needed

type Orientation = 'Horizontal' | 'Vertical' | 'Square';
type Variant = {
  id: string;
  label: string;
  orientation: Orientation;
  priceGBP?: number;
  thumbnail?: string;
};
type Product = {
  id: string;
  title: string;
  image?: string;
  variants: Variant[];
};

type Address = {
  name: string;
  email?: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  stateOrCounty?: string;
  postalCode: string;
  countryCode: string; // GB, US, IE, etc.
};

type CartItem = {
    productId: string;
    productTitle: string;
    variantId: string;
    variantLabel: string;
    priceGBP: number | null;
    imageUrl: string;
    imageId: string;
    orientation: Orientation;
    mode: string;
    source: string;
    greetingText?: string;
    qty: number;
    addedAt: number;
  };
  

export default function SelectedProductPage() {
  const router = useRouter();
  const search = useSearchParams();

  // -------- handoff params --------------------------------------------------
  const preselectProductId = search.get('productId') || '';
  const preselectOrientation = (search.get('orientation') as Orientation | null) || null;
  const imageId = search.get('imageId') || '';
  const fileUrl = search.get('fileUrl') || '';
  const source = search.get('source') || 'recommend';
  const mode = search.get('mode') || '';

// -------- catalog ---------------------------------------------------------
const catalog = useMemo(() => (CATALOG as unknown as Product[]) ?? [], []);


  const [selectedProductId, setSelectedProduct] = useState<string>('');
  const product: Product | undefined = useMemo(
    () => catalog.find((p) => p.id === selectedProductId),
    [catalog, selectedProductId]
  );

  // variant helpers
  const findVariantForOrientation = useCallback(
    (pid: string, orient: Orientation | null): Variant | null => {
      const p = catalog.find((x) => x.id === pid);
      if (!p) return null;
      if (orient) {
        const byOrient = p.variants.find((v) => v.orientation === orient);
        if (byOrient) return byOrient;
      }
      return p.variants[0] ?? null;
    },
    [catalog]
  );

  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const selectedVariant = useMemo(
    () => product?.variants.find((v) => v.id === selectedVariantId) || null,
    [product, selectedVariantId]
  );

  // -------- prefill on load -------------------------------------------------
  useEffect(() => {
    if (!preselectProductId) return;
    setSelectedProduct(preselectProductId);
  }, [preselectProductId]);

  useEffect(() => {
    if (!product) return;
    const best = findVariantForOrientation(product.id, preselectOrientation);
    if (best) setSelectedVariantId(best.id);

    const el = document.querySelector<HTMLElement>(`[data-product-id="${product.id}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  // -------- checkout form state --------------------------------------------
  const [userGreeting, setUserGreeting] = useState('');
  const [shippingAddress, setShippingAddress] = useState<Address>({
    name: '',
    email: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    stateOrCounty: '',
    postalCode: '',
    countryCode: 'GB',
  });

  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readyToAdd =
    Boolean(selectedProductId) &&
    Boolean(selectedVariantId) &&
    Boolean(imageId) &&
    Boolean(fileUrl);

  const readyToBuy =
    readyToAdd &&
    Boolean(shippingAddress.name) &&
    Boolean(shippingAddress.line1) &&
    Boolean(shippingAddress.city) &&
    Boolean(shippingAddress.postalCode) &&
    Boolean(shippingAddress.countryCode);

  // -------- actions ---------------------------------------------------------
  const handleChangeProduct = () => {
    const qp = new URLSearchParams({
      imageId,
      fileUrl,
      source,
      mode,
    });
    if (preselectOrientation) qp.set('orientation', preselectOrientation);
    router.push(`/products?${qp.toString()}`);
  };

  const handleAddToCart = () => {
    if (!readyToAdd || !product || !selectedVariant) return;

    const item = {
      productId: product.id,
      productTitle: product.title,
      variantId: selectedVariant.id, // must map to your PRODIGI_SKUS keys
      variantLabel: selectedVariant.label,
      priceGBP: selectedVariant.priceGBP ?? null,
      imageUrl: fileUrl,
      imageId,
      orientation: selectedVariant.orientation,
      mode,
      source,
      greetingText: userGreeting || undefined,
      qty: 1,
      addedAt: Date.now(),
    };



      let cart: CartItem[] = [];
      try {
        const raw = localStorage.getItem('cart:v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) cart = parsed as CartItem[];
        }
      } catch {
        /* ignore parse error */
      }
      cart.push(item);
      localStorage.setItem('cart:v1', JSON.stringify(cart));
      

    router.push('/cart');
  };

  async function placeOrder() {
    if (!selectedVariant || !fileUrl || !readyToBuy) return;
    setBuying(true);
    setError(null);
    try {
      const res = await fetch('/api/print/prodigi/order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          variantId: selectedVariant.id, // must map to keys of PRODIGI_SKUS
          imageUrl: fileUrl,
          greetingText: userGreeting || undefined,
          shipping: shippingAddress,
          reference: imageId,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Order failed');
      router.push(`/order/placed?orderId=${encodeURIComponent(j.order?.id ?? '')}`);
    } catch (e: unknown) {
        const message =
        e instanceof Error ? e.message : 'Something went wrong placing your order.';
      setError(message);
    
    } finally {
      setBuying(false);
    }
  }

  // -------- render ----------------------------------------------------------
  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-6 pt-6 pb-28">
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Confirm your selection</h1>
            <p className="text-white/60 text-sm mt-1">
              We’ve preselected a product based on your design. You can change it anytime.
            </p>
          </div>
          <button
            onClick={handleChangeProduct}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            Change product
          </button>
        </header>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {!product ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/80">
              {preselectProductId
                ? `Loading product "${preselectProductId}"…`
                : 'No product selected.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3" data-product-id={product.id}>
            {/* LEFT: large visual */}
            <section className="lg:col-span-1 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg bg-black">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="(max-width:1024px) 100vw, 33vw"
                    priority
                  />
                ) : (
                  <div className="grid h-full place-items-center text-white/40">
                    No preview
                  </div>
                )}
              </div>
              <div className="mt-3">
                <h2 className="text-lg font-semibold">{product.title}</h2>
                <p className="text-white/70 text-sm mt-1">
                  Image: <span className="text-white/90 font-medium">{imageId.slice(0, 8)}…</span>
                </p>
              </div>
            </section>

            {/* MIDDLE: variants */}
            <section className="lg:col-span-1 rounded-xl border border-white/10 bg-white/5 p-3">
              <h3 className="text-sm uppercase tracking-wide text-white/50">Variant</h3>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.variants.map((v) => {
                  const active = v.id === selectedVariantId;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`text-left rounded-lg border px-3 py-2 transition ${
                        active
                          ? 'border-white bg-white text-black'
                          : 'border-white/10 bg-black/30 text-white hover:border-white/30'
                      }`}
                    >
                      <div className="text-sm font-medium">{v.label}</div>
                      <div className={`text-xs ${active ? 'text-black/70' : 'text-white/60'}`}>
                        {v.orientation}
                        {typeof v.priceGBP === 'number' ? ` · £${v.priceGBP.toFixed(2)}` : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 text-xs text-white/60">
                Orientation hint: {preselectOrientation ?? '—'}
              </div>

              {/* Optional greeting text */}
              <div className="mt-4">
                <label className="text-sm text-white/70">Inside greeting (optional)</label>
                <textarea
                  value={userGreeting}
                  onChange={(e) => setUserGreeting(e.target.value)}
                  rows={3}
                  placeholder="e.g., Wishing you a warm & joyful holiday!"
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm placeholder-white/40"
                />
                <p className="mt-1 text-xs text-white/50">
                  We’ll typeset this neatly on the inside-right page.
                </p>
              </div>
            </section>

            {/* RIGHT: shipping */}
            <section className="lg:col-span-1 rounded-xl border border-white/10 bg-white/5 p-3">
              <h3 className="text-sm uppercase tracking-wide text-white/50">Shipping</h3>

              <div className="mt-2 grid grid-cols-1 gap-2">
                <input
                  className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                  placeholder="Full name"
                  value={shippingAddress.name}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                />
                <input
                  className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                  placeholder="Email (for updates)"
                  value={shippingAddress.email ?? ''}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })}
                />
                <input
                  className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                  placeholder="Phone (optional)"
                  value={shippingAddress.phone ?? ''}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                />
                <input
                  className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                  placeholder="Address line 1"
                  value={shippingAddress.line1}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, line1: e.target.value })}
                />
                <input
                  className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                  placeholder="Address line 2 (optional)"
                  value={shippingAddress.line2 ?? ''}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, line2: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                    placeholder="City"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  />
                  <input
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                    placeholder="County / State"
                    value={shippingAddress.stateOrCounty ?? ''}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, stateOrCounty: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                    placeholder="Postcode"
                    value={shippingAddress.postalCode}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                  />
                  <input
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                    placeholder="Country code (GB, US, IE)"
                    value={shippingAddress.countryCode}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, countryCode: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Sticky confirm bar */}
      <div className="fixed left-0 right-0 bottom-0 z-30 mx-auto max-w-6xl p-3">
        <div className="rounded-2xl border border-white/10 bg-black/70 backdrop-blur px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-white/80">
            {product ? (
              <>
                {product.title}
                {selectedVariant ? (
                  <>
                    {' — '}
                    <span className="text-white/90">{selectedVariant.label}</span>
                  </>
                ) : null}
              </>
            ) : (
              'No product selected'
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleChangeProduct}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              Change product
            </button>

            <button
              onClick={handleAddToCart}
              disabled={!readyToAdd}
              className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm hover:bg-white/20 disabled:opacity-50"
            >
              Add to cart
            </button>

            <button
              onClick={placeOrder}
              disabled={!readyToBuy || buying}
              className="rounded-full bg-white text-black px-4 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {buying ? 'Placing order…' : 'Buy now'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
