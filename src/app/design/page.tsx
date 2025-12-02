"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import type { Currency } from "./components/CurrencySwitcher";
import { CanvasStage } from "./components/CanvasStage";
import { ChatBox } from "./components/ChatBox";
import { Composer } from "./components/Composer";
import { ReferencePanel } from "./components/ReferencePanel";

import { useUploads } from "./hooks/useUploads";
import { useDesignChat } from "./hooks/useDesignChat";

import ProductInfo from "./components/ProductInfo";

/* -------------------------------------------------------------
 * TYPES
 * ------------------------------------------------------------- */
export type SelectedProduct = {
  title: string;
  src: string;
  name: string;
  description: string;
  productUID: string;
  specs: string[];
  prices: Record<string, number>;
  shippingRegions: string[];
  shippingTime: Record<string, string>;
};

type ReferenceEntry = {
  label: string;
  imageId: string;
  url: string;
};

/* -------------------------------------------------------------
 * COMPONENT
 * ------------------------------------------------------------- */
export default function DesignPage() {
  /* -------------------------------------------------------------
   *  ALWAYS-RUN HOOKS (DO NOT RETURN EARLY)
   * ------------------------------------------------------------- */
  const router = useRouter();
  const search = useSearchParams();

  const productId = search.get("product");

  const [redirecting, setRedirecting] = useState(false);
  const [ready, setReady] = useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState<SelectedProduct | null>(null);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [printUrl, setPrintUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  const [imageId, setImageId] = useState<string | null>(null);
  const [references, setReferences] = useState<ReferenceEntry[]>([]);

  const [generating, setGenerating] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const lastPromptRef = useRef<string | null>(null);

  const { uploading, progress, handleUpload } = useUploads();

  const { messages, plan, sendMessage, startGreeting, addReference } =
    useDesignChat(selectedProduct, imageId);



    const [currency, setCurrency] = useState<Currency>("GBP");
    

  /* -------------------------------------------------------------
   *  REDIRECT LOGIC — STILL SAFE (NO RETURN EARLY)
   * ------------------------------------------------------------- */
  useEffect(() => {
    if (!productId && !redirecting) {
      setRedirecting(true);
      router.replace("/");
    } else {
      setReady(true);
    }
  }, [productId, redirecting, router]);

  /* -------------------------------------------------------------
   *  LOAD CURRENCY
   * ------------------------------------------------------------- */
  useEffect(() => {
    const saved = localStorage.getItem("currency");
    const allowed: Currency[] = ["GBP", "USD", "EUR"];
  
    if (saved && allowed.includes(saved as Currency)) {
      setCurrency(saved as Currency);
    }
  }, []);
  

  const handleCurrencyChange = useCallback((c: Currency) => {
    setCurrency(c);
    localStorage.setItem("currency", c);
  }, []);

  /* -------------------------------------------------------------
   *  LOAD SELECTED PRODUCT
   * ------------------------------------------------------------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("design:selectedProduct");
      if (raw) {
        const parsed = JSON.parse(raw) as SelectedProduct;
        setSelectedProduct(parsed);
      }
    } catch {}
  }, []);

  /* -------------------------------------------------------------
   *  INITIAL GREETING
   * ------------------------------------------------------------- */
  useEffect(() => {
    if (selectedProduct) startGreeting();
  }, [selectedProduct, startGreeting]);

  /* -------------------------------------------------------------
   *  HANDLE REFERENCE UPLOAD
   * ------------------------------------------------------------- */
  const handleReferenceUpload = useCallback(
    async (label: string, file: File) => {
      setUploadError(null);

      try {
        const { imageId: uploadedId, url } = await handleUpload(file);

        setImageId((prev) => prev ?? uploadedId);

        const nextRefs: ReferenceEntry[] = [
          ...references.filter((r) => r.label !== label),
          { label, imageId: uploadedId, url },
        ];

        setReferences(nextRefs);

        if (!originalUrl) {
          setOriginalUrl(nextRefs[0].url);
          setPreviewUrl(nextRefs[0].url);
        }

        addReference(label, uploadedId, url);

        const needed = plan?.referencesNeeded ?? [];
        const remainingNeeded = needed.filter((l) => l !== label);

        const updatedPlan = {
          ...plan,
          references: [
            ...(plan?.references ?? []).filter((r) => r.label !== label),
            { id: uploadedId, url, label },
          ],
          referencesNeeded:
            remainingNeeded.length ? remainingNeeded : undefined,
        };

        const allUploaded =
          needed.length > 0 &&
          needed.every((l) => nextRefs.some((r) => r.label === l));

        const msg = allUploaded
          ? `I've uploaded all the reference photos you asked for: ${needed.join(
              ", "
            )}.`
          : `I've uploaded the ${label.toLowerCase()}.`;

        await sendMessage(msg, updatedPlan);
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Upload failed."
        );
      }
    },
    [handleUpload, references, originalUrl, plan, sendMessage, addReference]
  );

  /* -------------------------------------------------------------
   *  PAYPAL CHECKOUT
   * ------------------------------------------------------------- */
  const handleHappyWithDesign = useCallback(async () => {
    const fileUrl = printUrl || previewUrl;
    if (!fileUrl || !imageId || !selectedProduct) {
      setUploadError("Missing design or product info.");
      return;
    }

    const amount = selectedProduct.prices.GBP ?? 19.99;
    const sku = selectedProduct.productUID ?? "print-at-home";

    setCheckingOut(true);

    try {
      const res = await fetch("/api/paypal/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: "GBP",
          title: selectedProduct.title,
          imageId,
          fileUrl,
          sku,
          vendor: "prodigi",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.approveUrl) {
        setUploadError(data?.error || "Unable to start PayPal checkout.");
        return;
      }

      window.location.href = data.approveUrl;
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Checkout failed."
      );
    } finally {
      setCheckingOut(false);
    }
  }, [printUrl, previewUrl, imageId, selectedProduct]);

  /* -------------------------------------------------------------
   *  GEMINI GENERATION
   * ------------------------------------------------------------- */
  useEffect(() => {
    const finalPrompt = plan?.finalizedPrompt;
    const confirmed = plan?.userConfirmed;

    if (!finalPrompt || !confirmed) return;

    let effectiveId = imageId;
    if (!effectiveId) {
      effectiveId =
        typeof crypto !== "undefined"
          ? crypto.randomUUID()
          : `design-${Date.now()}`;
      setImageId(effectiveId);
    }

    const key = `${effectiveId}::${finalPrompt}`;
    if (lastPromptRef.current === key) return;
    lastPromptRef.current = key;

    const refs = references.map((r) => ({
      url: r.url,
      id: r.imageId,
      role: "subject" as const,
    }));

    async function run() {
      try {
        setGenerating(true);
        setUploadError(null);

        const res = await fetch("/api/design/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageId: effectiveId,
            prompt: finalPrompt,
            productId,
            // printSpec: (selectedProduct as any)?.printSpec,
            references: refs,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setUploadError(data?.error || "Image generation failed.");
          return;
        }

        setPrintUrl(data.masterUrl);
        if (data.previewUrl) setOriginalUrl(data.previewUrl);

        setPreviewUrl(
          data.mockupUrl ?? data.previewUrl ?? data.masterUrl
        );
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Image generation failed."
        );
      } finally {
        setGenerating(false);
      }
    }

    run();
  }, [
    plan?.finalizedPrompt,
    plan?.userConfirmed,
    imageId,
    references,
    selectedProduct,
    productId,
  ]);

  const hasFinalDesign = !!previewUrl && !generating;

  /* -------------------------------------------------------------
   *  UI — SAFE BECAUSE ALL HOOKS HAVE RUN ABOVE
   * ------------------------------------------------------------- */
  if (!ready || redirecting) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-black text-white max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT SIDE */}
      <div className="lg:col-span-1 space-y-4">
        <ProductInfo
          product={selectedProduct}
          previewUrl={previewUrl}
          originalUrl={originalUrl}
          currency={currency}
          onCurrencyChange={handleCurrencyChange}
        />

        {previewUrl ? (
          <CanvasStage original={originalUrl} result={previewUrl} />
        ) : originalUrl ? (
          <CanvasStage original={originalUrl} result={null} />
        ) : null}

        {references.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {references.map((ref) => (
              <div
                key={ref.imageId}
                className="relative aspect-square rounded-md overflow-hidden border border-white/10 bg-black/40"
                title={ref.label}
              >
                <Image
                  src={ref.url}
                  alt={ref.label}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              </div>
            ))}
          </div>
        )}

        {uploading && (
          <div className="text-center text-sm text-white/60">
            Uploading… {progress}%
          </div>
        )}

        {generating && (
          <div className="text-center text-sm text-white/60">
            Creating your design…
          </div>
        )}

        {uploadError && (
          <div className="text-center text-sm text-red-400 border border-red-500/40 rounded-xl p-3">
            {uploadError}
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/70 space-y-2">
          {hasFinalDesign ? (
            <>
              <div className="text-white font-semibold text-sm">
                Next step
              </div>
              <p>
                {`You can tweak anything you see — tell the assistant if you'd
                like changes.`}
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    sendMessage(
                      "I'd like to tweak this design a bit. I'll describe the changes I want next."
                    )
                  }
                  className="flex-1 rounded-lg border border-white/30 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 transition"
                >
                  Ask for changes
                </button>
                <button
                  type="button"
                  onClick={handleHappyWithDesign}
                  className="px-3 py-1.5 text-xs rounded-full bg-pink-500 text-black font-medium hover:bg-pink-400 disabled:opacity-60"
                  disabled={
                    !previewUrl || uploading || generating || checkingOut
                  }
                >
                  {checkingOut ? "Opening PayPal…" : "I'm happy with it"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-white font-semibold text-sm">
                How this works
              </div>
              <p>
                Describe what you’d like. The assistant may request reference
                photos, then create your artwork here.
              </p>
            </>
          )}
        </div>

        <ReferencePanel
          referencesNeeded={plan?.referencesNeeded}
          onUpload={handleReferenceUpload}
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="lg:col-span-2 space-y-4">
        <ChatBox messages={messages} />
        <Composer onSend={sendMessage} disabled={uploading || generating} />
      </div>
    </main>
  );
}
