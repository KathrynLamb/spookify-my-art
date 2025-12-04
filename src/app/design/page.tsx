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
import { useUser } from "@/hooks/useUser";

import ProductInfo from "./components/ProductInfo";
import { PRODUCTS } from "@/lib/products_gallery_jolly";
import { ChatMessage } from "./types";

/* -------------------------------------------------------------
 * TYPES
 * ------------------------------------------------------------- */


export interface ReferenceEntry {
  label: string;
  imageId: string;
  url: string;
}

/** Option 1 project record */
export interface LoadedProject {
  id: string;
  title: string;
  productId: string;
  originalUrl: string | null;
  previewUrl: string | null;
  finalImage?: string | null;
  messages: ChatMessage[];
  references: ReferenceEntry[];
  plan?: DesignPlan | null;
}

export interface PlanReference {
  id: string;
  label: string;
  url: string;
}

export interface DesignPlan {
  style?: string;
  title?: string;
  description?: string;
  references?: PlanReference[];
  referencesNeeded?: string[];
  userConfirmed?: boolean;
  finalizedPrompt?: string | null; // ← MUST MATCH Plan
}


/* Selected product type */
export type SelectedProduct = typeof PRODUCTS[number];

/* -------------------------------------------------------------
 * COMPONENT
 * ------------------------------------------------------------- */

export default function DesignPage() {
  const router = useRouter();
  const search = useSearchParams();

  const productParam = search.get("product");
  const projectParam = search.get("projectId");

  const { user } = useUser();

  /* -------------------------------------------------------------
   * STATE
   * ------------------------------------------------------------- */
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] =
    useState<SelectedProduct | null>(null);

  const [projectId, setProjectId] = useState<string | null>(null);
  const projectCreated = useRef(false);

  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [_printUrl, setPrintUrl] = useState<string | null>(null);

  const [references, setReferences] = useState<ReferenceEntry[]>([]);
  const [title, setTitle] = useState<string>("Untitled Project");
  const [plan, setPlanState] = useState<DesignPlan | null>(null);

  const [currency, setCurrency] = useState<Currency>("GBP");
  const [generating, setGenerating] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { uploading, progress, handleUpload } = useUploads();

  /* DESIGN CHAT HOOK */
  const {
    messages,
    plan: planFromChat,
    sendMessage,
    startGreeting,
    addReference,
    restoreMessages,
    restorePlan,
  } = useDesignChat(selectedProduct, null);

  /* Sync plan from chat */
  useEffect(() => {
    if (planFromChat) setPlanState(planFromChat);
    console.log("printUrl", _printUrl)
  }, [planFromChat, _printUrl]);

  /* -------------------------------------------------------------
   * UPDATE PROJECT (declared early for hook dependencies)
   * ------------------------------------------------------------- */
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

  console.log("title", title)

  /* -------------------------------------------------------------
   * LOAD EXISTING PROJECT
   * ------------------------------------------------------------- */
  const loadExistingProject = useCallback(async () => {
    if (!projectParam || !user?.email) return;

    const res = await fetch(
      `/api/projects/get?projectId=${projectParam}&email=${user.email}`
    );
    const json = await res.json();

    if (!json.ok) {
      router.replace("/");
      return;
    }

    const project: LoadedProject = json.project;

    setProjectId(project.id);
    setTitle(project.title);
    setOriginalUrl(project.originalUrl);
    setPreviewUrl(project.previewUrl);
    setPrintUrl(project.finalImage ?? null);
    setReferences(project.references ?? []);

    restoreMessages(structuredClone(project.messages ?? []));

    restorePlan(project.plan ?? null);

    const found = PRODUCTS.find((p) => p.productUID === project.productId);
    if (found) setSelectedProduct(found);

    setLoading(false);
  }, [projectParam, user?.email, router, restoreMessages, restorePlan]);

  /* -------------------------------------------------------------
   * LOAD PRODUCT FOR NEW SESSION
   * ------------------------------------------------------------- */

    const loadNewProduct = useCallback(() => {
        if (projectParam) return;   // ← ADD THIS LINE
        if (!productParam) {
          router.replace("/");
          return;
        }
      
        const prod = PRODUCTS.find((p) => p.productUID === productParam);
        if (!prod) {
          router.replace("/");
          return;
        }
      
        setSelectedProduct(prod);
        setOriginalUrl(prod.mockup?.template ?? null);
        // startGreeting();
        setLoading(false);
      }, [productParam, projectParam, router, startGreeting]);
      
  /* INITIAL LOAD */
  useEffect(() => {
    if (!user) return;

    if (projectParam) loadExistingProject();
    else loadNewProduct();
  }, [user, projectParam, loadExistingProject, loadNewProduct]);

  /* -------------------------------------------------------------
   * REFERENCE UPLOAD
   * ------------------------------------------------------------- */
  const handleReferenceUpload = useCallback(
    async (label: string, file: File) => {
      setUploadError(null);
      const { imageId, url } = await handleUpload(file);

      const next = [
        ...references.filter((r) => r.label !== label),
        { label, imageId, url },
      ];

      setReferences(next);
      addReference(label, imageId, url);

      if (projectId) updateProject({ references: next });
    },
    [references, handleUpload, addReference, updateProject, projectId]
  );

  /* -------------------------------------------------------------
   * CREATE PROJECT (only for fresh session)
   * ------------------------------------------------------------- */

  const cleanMessage = useCallback((raw: ChatMessage): ChatMessage => {
    return {
      role: raw.role ?? "assistant",
      content: raw.content ?? "",
    };
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

  /* Trigger new project creation */
  useEffect(() => {
    if (projectParam) return;
    if (!selectedProduct) return;
    if (projectCreated.current) return;
    if (messages.length !== 1) return;

    const first = messages[0];
    if (first.role !== "assistant" || first.typing || !first.content) return;

    createProject("Untitled Project", first.content);
  }, [messages, selectedProduct, createProject, projectParam]);

  /* -------------------------------------------------------------
   * IMAGE GENERATION — DISABLED FOR RESTORED PROJECTS
   * ------------------------------------------------------------- */
  useEffect(() => {
    if (projectParam) return;
    if (!plan?.userConfirmed) return;
    if (!plan.finalizedPrompt) return;

    const run = async () => {
      try {
        setGenerating(true);
        setUploadError(null);

        const res = await fetch("/api/design/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: plan.finalizedPrompt,
            productId: selectedProduct?.productUID,
            references,
            mockup: selectedProduct?.mockup,
            printSpec: selectedProduct?.printSpec,
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
          previewUrl: json.mockupUrl,
          finalImage: json.masterUrl,
          updatedAt: Date.now(),
        });
      } finally {
        setGenerating(false);
      }
    };

    run();
  }, [plan, projectParam, references, selectedProduct, updateProject]);

  /* -------------------------------------------------------------
   * UI
   * ------------------------------------------------------------- */

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center text-white">
        Loading…
      </main>
    );
  }

  const hasFinalDesign = !!previewUrl && !generating;

  return (
    <main className="min-h-screen p-6 bg-black text-white max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT */}
      <div className="lg:col-span-1 space-y-4">
        <ProductInfo
          product={selectedProduct}
          previewUrl={previewUrl}
          originalUrl={originalUrl}
          currency={currency}
          onCurrencyChange={(c) => {
            setCurrency(c);
            localStorage.setItem("currency", c);
          }}
        />

        {/* Canvas ALWAYS shows mockup template unless previewUrl exists */}
        <CanvasStage original={originalUrl} result={previewUrl} />

        {/* Reference thumbnails */}
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

        {hasFinalDesign && (
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs">
            <div className="font-semibold mb-1">Next step</div>
            <p>You can ask for design tweaks anytime.</p>
          </div>
        )}

        <ReferencePanel
          referencesNeeded={plan?.referencesNeeded}
          onUpload={handleReferenceUpload}
        />
      </div>

      {/* RIGHT */}
      <div className="lg:col-span-2 space-y-4">
        <div>
          <div className="font-semibold text-sm">How this works</div>
          <p>
            {`Describe what you'd like. The assistant may request reference photos
            and will generate your artwork on the product.`}
          </p>
        </div>

        <ChatBox messages={messages} />
        <Composer onSend={sendMessage} disabled={uploading || generating} />
      </div>
    </main>
  );
}
