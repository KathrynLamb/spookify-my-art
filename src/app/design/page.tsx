"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import type { Reference } from "./types";
import type { Currency } from "./components/CurrencySwitcher";

import { ChatBox } from "./components/ChatBox";
import { Composer } from "./components/Composer";
import { ReferencePanel } from "./components/ReferencePanel";

import { useUploads } from "./hooks/useUploads";
import { useDesignChat } from "./hooks/useDesignChat";
import { useUser } from "@/hooks/useUser";

import ProductInfo from "./components/ProductInfo";
import { PRODUCTS } from "@/lib/products_gallery_jolly";
import { ChatMessage, Plan, SelectedProduct } from "./types";

/* -------------------------------------------------- */
/* TYPES                                               */
/* -------------------------------------------------- */

export interface ReferenceEntry {
  label: string;
  imageId: string;
  url: string;
}

export interface LoadedProject {
  id?: string;
  title: string;
  productId: string;
  originalUrl: string | null;
  previewUrl: string | null;
  mockupUrl?: string | null;
  finalImage?: string | null;
  resultUrl?: string | null;
  messages: ChatMessage[];
  references: ReferenceEntry[];
  plan?: Plan | null;
}

/* -------------------------------------------------- */
/* RANDOM GREETING                                     */
/* -------------------------------------------------- */

function getRandomGreeting(p: { greetings?: string[] } | null): string {
  if (!p?.greetings?.length) return "Hello! Let's create something wonderful!";
  const list = p.greetings;
  return list[Math.floor(Math.random() * list.length)];
}

/* -------------------------------------------------- */
/* DESIGN PAGE                                         */
/* -------------------------------------------------- */

export default function DesignPage() {
  const router = useRouter();
  const search = useSearchParams();

  const productParam = search.get("product");
  const projectParam = search.get("projectId");

  const { user, loading: userLoading } = useUser();

  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] =
    useState<SelectedProduct | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  const projectCreated = useRef(false);
  const greetingSent = useRef(false);

  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [_printUrl, setPrintUrl] = useState<string | null>(null);

  const [references, setReferences] = useState<ReferenceEntry[]>([]);
  const [title, setTitle] = useState("Untitled Project");
  const [savedPlan, setSavedPlan] = useState<Plan | null>(null);

  const [currency, setCurrency] = useState<Currency>("GBP");
  const [generating, setGenerating] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [debugOpen, setDebugOpen] = useState(false);

  const { uploading, progress, handleUpload } = useUploads();

  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const redirectingRef = useRef(false);
  const initialLoadDone = useRef(false);

  // ✅ track prompt to allow regen on change
  const lastPromptRef = useRef<string | null>(null);

  /* -------------------------------------------------- */
  /* AUTH REDIRECT                                      */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (redirectingRef.current) return;
    if (userLoading) return;
    if (user) return;

    redirectingRef.current = true;

    const params = new URLSearchParams();
    if (productParam) params.set("product", productParam);
    if (projectParam) params.set("projectId", projectParam);

    const qs = params.toString();
    const next = qs ? `/design?${qs}` : "/design";

    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [userLoading, user, router, productParam, projectParam]);



  /* -------------------------------------------------- */
  /* updateProject                                      */
  /* -------------------------------------------------- */

  const updateProject = useCallback(
    async (changes: Record<string, unknown>) => {
      if (!projectId || !user?.email) return;

      try {
        await fetch("/api/projects/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            email: user.email,
            updates: changes,
          }),
        });
      } catch (err) {
        console.error("Project update failed:", err);
      }
    },
    [projectId, user?.email]
  );

  /* -------------------------------------------------- */
  /* HOOK: useDesignChat                                */
  /* -------------------------------------------------- */

  const {
    messages,
    plan: chatPlan,
    sendMessage,
    startGreeting,
    addReference,
    restoreMessages,
    restorePlan,
    newProjectName,
  } = useDesignChat({
    selectedProduct,
    imageId: null,
    projectId,
    userEmail: user?.email ?? null,
    updateProject,
  });


  const hasFinalDesign = !!previewUrl && !generating;

  // ✅ Prefer the most recent plan source
  const activePlan = savedPlan ?? chatPlan;

  const canOrder =
    !!_printUrl &&
    !!projectId &&
    !!selectedProduct &&
    !!activePlan?.userConfirmed;

  useEffect(() => {
    if (chatPlan) setSavedPlan(chatPlan);
  }, [chatPlan]);

  useEffect(() => {
    if (newProjectName && projectId) {
      updateProject({ title: newProjectName });
      setTitle(newProjectName);
    }
  }, [newProjectName, projectId, updateProject]);

  /* -------------------------------------------------- */
  /* LOAD EXISTING PROJECT                              */
  /* -------------------------------------------------- */

  const loadExistingProject = useCallback(async () => {
    if (!projectParam || !user?.email) return;

    try {
      const res = await fetch(
        `/api/projects/get?projectId=${projectParam}&email=${user.email}`
      );

      const json = await res.json();

      if (!json.ok || !json.project) {
        console.error("[design] loadExistingProject – no project found", json);
        router.replace("/dashboard");
        return;
      }

      const projectData = json.project as LoadedProject;

      const project: LoadedProject = {
        id: projectData.id ?? projectParam,
        ...projectData,
      };

      setProjectId(project.id!);
      setTitle(project.title);
      setOriginalUrl(project.originalUrl);
      setPreviewUrl(project.mockupUrl ?? project.previewUrl);
      setPrintUrl(project.finalImage ?? project.resultUrl ?? null);
      setReferences(project.references ?? []);

      restoreMessages(structuredClone(project.messages ?? []));
      restorePlan(project.plan ?? null);

      // ✅ CRITICAL FIX:
      // Seed lastPromptRef from the stored plan so the generation
      // effect doesn't think a restore is a user prompt change.
      if (project.plan?.finalizedPrompt) {
        lastPromptRef.current = project.plan.finalizedPrompt;
      }

      const found = PRODUCTS.find((p) => p.productUID === project.productId);
      if (found) setSelectedProduct(found);
    } catch (err) {
      console.error("[design] loadExistingProject error", err);
      router.replace("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [projectParam, user?.email, router, restoreMessages, restorePlan]);

  /* -------------------------------------------------- */
  /* LOAD NEW PRODUCT                                   */
  /* -------------------------------------------------- */

  const loadNewProduct = useCallback(() => {
    if (projectParam) return;
    if (!productParam) return router.replace("/");

    const prod = PRODUCTS.find((p) => p.productUID === productParam);
    if (!prod) return router.replace("/");

    setSelectedProduct(prod);
    setOriginalUrl(prod.mockup?.template ?? null);

    if (!greetingSent.current) {
      greetingSent.current = true;
      startGreeting(getRandomGreeting(prod));
    }

    setLoading(false);
  }, [productParam, projectParam, router, startGreeting]);

  /* -------------------------------------------------- */
  /* INITIAL LOAD (guard against loops)                 */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (userLoading) return;
    if (!user) return;
    if (initialLoadDone.current) return;

    initialLoadDone.current = true;

    if (projectParam) loadExistingProject();
    else loadNewProduct();
  }, [userLoading, user, projectParam, loadExistingProject, loadNewProduct]);

  /* -------------------------------------------------- */
  /* PAY & ORDER (PayPal → Prodigi)                     */
  /* -------------------------------------------------- */

  const handleOrderClick = useCallback(async () => {
    if (!_printUrl || !projectId || !selectedProduct) return;

    try {
      setOrderError(null);
      setOrdering(true);

      const unitPrice: number =
        selectedProduct.prices?.[currency] ??
        selectedProduct.prices?.GBP ??
        15;

      const res = await fetch("/api/paypal/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: unitPrice,
          currency,
          title: title || selectedProduct.name || "Custom Artwork",
          imageId: projectId,
          fileUrl: _printUrl,
          sku: selectedProduct.prodigiSku ?? selectedProduct.productUID,
          vendor: "prodigi",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok || !json.approveUrl) {
        console.error("PayPal create failed", json);
        setOrderError(json.error || "Could not start payment");
        return;
      }

      window.location.href = json.approveUrl as string;
    } catch (err) {
      console.error("handleOrderClick error", err);
      setOrderError("Something went wrong starting the order.");
    } finally {
      setOrdering(false);
    }
  }, [_printUrl, projectId, selectedProduct, currency, title]);



  /* -------------------------------------------------- */
  /* REFERENCE UPLOAD                                   */
  /* -------------------------------------------------- */

  const norm = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replaceAll("’", "'"); // normalize curly apostrophes


  const handleReferenceUpload = useCallback(
    async (label: string, file: File) => {
      setUploadError(null);
      const { imageId, url } = await handleUpload(file);

      const next = [
        ...references.filter((r) => r.label !== label),
        { label, imageId, url },
      ];
      setReferences(next);

      const base =
      savedPlan ??
      chatPlan ?? {
        references: [],
        referencesNeeded: [],
        finalizedPrompt: null,
        userConfirmed: false,
      };
    

      const nextRef: Reference = { id: imageId, url, label };

      const mergedRefs = [
        ...(base.references ?? []).filter((r) => r.label !== label),
        nextRef,
      ];

      const remaining =
      (base.referencesNeeded ?? []).filter((l) => norm(l) !== norm(label));
    

        const overridePlan: Plan = {
          ...base,
          references: mergedRefs,
          referencesNeeded: remaining.length ? remaining : undefined,
        };
        
        // ✅ This is the missing piece for the UI
        setSavedPlan(overridePlan);
        
        addReference(label, imageId, url);
        
        await sendMessage(
          `I've uploaded the reference photo labeled "${label}". Please confirm you received it.`,
          overridePlan
        );
        
        updateProject({
          references: next,
          plan: overridePlan,
        });
        
    },
    [
      references,
      handleUpload,
      addReference,
      sendMessage,
      updateProject,
      chatPlan,
      savedPlan,  
    ]
  );

  /* -------------------------------------------------- */
  /* PROJECT CREATION                                   */
  /* -------------------------------------------------- */

  const cleanMessage = useCallback((raw: ChatMessage): ChatMessage => {
    return { role: raw.role ?? "assistant", content: raw.content ?? "" };
  }, []);

  const createProject = useCallback(
    async (t: string, firstMsg: string) => {
      if (!user?.email || projectCreated.current || projectParam) return;

      const safe = cleanMessage({ role: "assistant", content: firstMsg });

      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          title: t,
          previewUrl: null,
          originalUrl,
          productId: selectedProduct?.productUID,
          createdAt: Date.now(),
          imageId: null,
          references: [],
          messages: [safe],
          plan: null,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        setProjectId(json.id);
        projectCreated.current = true;
      }
    },
    [user?.email, projectParam, cleanMessage, originalUrl, selectedProduct]
  );

  useEffect(() => {
    if (projectParam) return;
    if (!selectedProduct) return;
    if (projectCreated.current) return;
    if (messages.length !== 1) return;

    const first = messages[0];
    if (first.role !== "assistant" || first.typing || !first.content) return;

    createProject("Untitled Project", first.content);
  }, [messages, selectedProduct, createProject, projectParam]);

  /* -------------------------------------------------- */
  /* IMAGE GENERATION (safe, stable, no restore wipe)   */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (!projectId) return;
    if (!user?.email) return;
    if (!selectedProduct) return;

    const prompt = savedPlan?.finalizedPrompt ?? "";
    const confirmed = !!savedPlan?.userConfirmed;

    if (!confirmed || !prompt) return;
    if (generating) return;

    const currentPrompt = prompt;
    const previousPrompt = lastPromptRef.current ?? "";

    const promptChanged = currentPrompt !== previousPrompt;
    const hasOutput = Boolean(previewUrl || _printUrl);

    // If already have output and prompt hasn't changed, do nothing
    if (hasOutput && !promptChanged) return;

    // Record prompt now
    lastPromptRef.current = currentPrompt;

    // ✅ CRITICAL FIX:
    // Only clear if we truly had a previous prompt (i.e., not first restore)
    if (promptChanged && hasOutput && previousPrompt) {
      console.log("Prompt changed — clearing previous images");
      setPreviewUrl(null);
      setPrintUrl(null);
    }

    const run = async () => {
      try {
        setGenerating(true);
        setUploadError(null);

        const res = await fetch("/api/design/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageId: projectId,
            userId: user.email,
            title,
            prompt,
            productId: selectedProduct.productUID,
            references,
            mockup: selectedProduct.mockup,
            printSpec: selectedProduct.printSpec,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          setUploadError(json.error || "Generation failed");
          return;
        }

        setPreviewUrl(json.mockupUrl);
        setPrintUrl(json.masterUrl);

        updateProject({
          previewUrl: json.previewUrl ?? json.mockupUrl ?? null,
          mockupUrl: json.mockupUrl ?? null,
          finalImage: json.masterUrl ?? null,
          resultUrl: json.masterUrl ?? null,
          status: "done",
          updatedAt: Date.now(),
        });
      } finally {
        setGenerating(false);
      }
    };

    run();
  }, [
    projectId,
    user?.email,
    selectedProduct,
    savedPlan?.userConfirmed,
    savedPlan?.finalizedPrompt,
    previewUrl,
    _printUrl,
    generating,
    title,
    references,
    updateProject,
  ]);

  const effectiveReferencesNeeded = (() => {
    const needed = savedPlan?.referencesNeeded ?? [];
    const uploaded = new Set(references.map((r) => r.label));
    return needed.filter((l) => !uploaded.has(l));
  })();
  

  /* -------------------------------------------------- */
  /* UI                                                 */
  /* -------------------------------------------------- */

  if (userLoading) {
    return (
      <main className="min-h-screen grid place-items-center text-white">
        Loading…
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen grid place-items-center text-white">
        Redirecting…
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center text-white">
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-black text-white max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT */}
      <div className="lg:col-span-1 space-y-4">
        <ProductInfo
          product={selectedProduct}
          previewUrl={previewUrl}
          originalUrl={originalUrl}
          currency={currency}
          printUrl={_printUrl}
          canOrder={canOrder}
          ordering={ordering}
          orderError={orderError}
          onOrder={handleOrderClick}
          onCurrencyChange={(c) => {
            setCurrency(c);
            localStorage.setItem("currency", c);
          }}
          generating={generating}
        />

        {/* references thumbnails */}
        {references.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {references.map((ref) => (
              <div
                key={ref.imageId}
                className="relative aspect-square rounded-md overflow-hidden border border-white/10"
              >
                <Image
                  src={ref.url}
                  alt={ref.label}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {uploading && (
          <div className="text-sm text-center">Uploading… {progress}%</div>
        )}
        {generating && (
          <div className="text-sm text-center">Creating your design…</div>
        )}
        {uploadError && (
          <div className="text-red-400 text-sm text-center">{uploadError}</div>
        )}

        {hasFinalDesign && !canOrder && (
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs">
            Your design is ready. Confirm the plan to enable ordering.
          </div>
        )}

        <ReferencePanel
          referencesNeeded={effectiveReferencesNeeded}
          onUpload={handleReferenceUpload}
        />
      </div>

      {/* RIGHT */}
      <div className="lg:col-span-2 space-y-4">
        <div>
          <div className="font-semibold text-sm">How this works</div>
          <p>{`Describe what you'd like. The assistant may request reference photos.`}</p>
        </div>

        <ChatBox messages={messages} />
        <Composer onSend={sendMessage} disabled={uploading || generating} />
      </div>

      {/* DEBUG PANEL */}
      {debugOpen && (
        <div className="fixed bottom-4 right-4 bg-neutral-900 p-4 rounded-xl border border-white/20 max-w-md max-h-[70vh] overflow-auto text-xs">
          <h2 className="font-bold mb-2">DEBUG</h2>
          <pre className="whitespace-pre-wrap text-[11px] opacity-80">
            {JSON.stringify(
              { projectId, selectedProduct, plan: savedPlan, messages },
              null,
              2
            )}
          </pre>
        </div>
      )}

      <button
        onClick={() => setDebugOpen((x) => !x)}
        className="fixed bottom-4 left-4 px-3 py-1 bg-white/10 rounded-md text-xs border border-white/20 hover:bg-white/20"
      >
        Debug
      </button>
    </main>
  );
}
