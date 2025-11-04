'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, Send } from 'lucide-react';
import {
  Comparison,
  ComparisonItem,
  ComparisonHandle,
} from '@/components/ui/shadcn-io/comparison/index';

import type { Currency } from '@/lib/currency';

/* ======================= Brand Config ======================= */
const BRAND = 'Lovify';
const THEME = {
  bg: 'bg-[#0a0709]',
  panel: 'bg-[#101013]',
  ring: 'border-white/12',
  textSubtle: 'text-white/70',
  pill: 'bg-rose-600 px-2 py-0.5 text-[11px] text-white rounded-full',
  cta: 'bg-rose-600 hover:bg-rose-500',
  chip: 'border-white/10 bg-white/5 hover:bg-white/10',
  accent: 'text-rose-300',
};
const GEN_ENDPOINT_BASE = '/api/spookify'; // change to '/api/lovify' when your worker is live

/* ======================= Types ======================= */
type Role = 'user' | 'assistant';
type Msg = { role: Role; content: string; images?: string[] };

type VariantLite = {
  sizeLabel: string;
  orientation: 'Vertical' | 'Horizontal';
  productUid: string;
  prices: Partial<Record<Currency, number>> & { GBP?: number };
  frameColor?: string;
};

type PendingSelection = {
  productTitle: string;
  variant: VariantLite | null;
  titleSuffix: string;
  currency: Currency;
  imageId: string;
  fileUrl: string;
  lemon?: boolean;
};

type Plan = {
  vibe?: string;
  elements?: string[];
  palette?: string;
  avoid?: string[];
  textOverlay?: string;
  orientation?: 'Horizontal' | 'Vertical' | 'Square';
  targetAspect?: number;
  finalizedPrompt?: string;
} | null;

type ChatResponse = {
  content: string;
  plan?: Plan;
  finalizedPrompt?: string;
};

type UploadOriginalOk = {
  imageId: string;
  fileUrl: string;
  metaUrl?: string;
};

type UploadOriginalErr = { error?: string };

/* ======================= Utilities ======================= */
function parseJSON<T>(text: string): T | null {
  try { return JSON.parse(text) as T; } catch { return null; }
}
function hasImageId(v: unknown): v is UploadOriginalOk {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as Record<string, unknown>;
  return typeof obj.imageId === 'string' && typeof obj.fileUrl === 'string';
}
function extractConfigFrom(text: string): unknown | null {
  let m = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (!m) m = text.match(/```\s*([\s\S]*?)\s*```/);
  if (!m) {
    const all = text.match(/\{[\s\S]*\}/g);
    if (all && all.length) m = ['', all[all.length - 1]] as unknown as RegExpMatchArray;
  }
  if (!m) return null;
  try { return JSON.parse(m[1] ?? ''); } catch { return null; }
}
function isPlan(v: unknown): v is NonNullable<Plan> {
  return !!v && typeof v === 'object';
}
function summarizePlan(plan: Plan, userText: string): string {
  const fp = (plan?.finalizedPrompt || '').trim();
  let gist = '';
  if (fp) {
    const pieces = fp
      .replace(/\s+/g, ' ')
      .split(/[,.]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
    gist = pieces.join(', ');
  } else if (userText) {
    gist = userText.replace(/\s+/g, ' ').trim();
  }
  return `Lovely — ${gist}. Plan ready — hit “Use this plan → Generate”.`;
}
const isHttpUrl = (s: string) => /^https?:\/\//i.test(s);

async function fileToResizedDataUrl(file: File, maxDim = 1280, quality = 0.9): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(maxDim / bitmap.width, maxDim / bitmap.height, 1);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

/* ===================== Upload Helper ===================== */
async function uploadWithProgress(
  blob: Blob,
  filename: string,
  onProgress: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append('file', blob, filename);
    xhr.open('POST', '/api/upload-spooky', true); // reuse existing route
    xhr.upload.onprogress = (evt) => { if (evt.lengthComputable) onProgress(Math.round((evt.loaded / evt.total) * 100)); };
    xhr.onload = () => {
      try {
        if (xhr.status >= 200 && xhr.status < 300) {
          const json = JSON.parse(xhr.responseText);
          json.url ? resolve(json.url) : reject(new Error(json.error || 'Upload failed'));
        } else reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText}`));
      } catch (err) { reject(err instanceof Error ? err : new Error(String(err))); }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(fd);
  });
}

function useEnsurePublicUrl() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const ensurePublicUrl = useCallback(async (current: string, givenImageId: string) => {
    if (/^https?:\/\//i.test(current)) return current;
    const blob = await (await fetch(current)).blob();
    setUploadProgress(0); setIsUploading(true);
    try {
      return await uploadWithProgress(blob, `lovified-${givenImageId}.jpg`, setUploadProgress);
    } finally { setIsUploading(false); }
  }, []);

  return { ensurePublicUrl, isUploading, uploadProgress };
}

async function fetchJsonWithDebug<T = unknown>(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, init);
  let text = '';
  try { text = await res.clone().text(); } catch {}
  if (!res.ok) {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    throw new Error(`HTTP ${res.status} ${url}\n${text}`);
  }
  try { return (await res.json()) as T; } catch {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    throw new Error(`Bad JSON from ${url}\n${text}`);
  }
}

/* ======================= Component ======================= */
export default function LovifyDesignPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core state
  const [lovified, setLovified] = useState<string | null>(null);
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [plan, setPlan] = useState<Plan>(null);
  const finalizedPrompt = useMemo(() => (plan?.finalizedPrompt ?? ''), [plan]);

  // generation state
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // product selection handoff
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [askedOrientation, setAskedOrientation] = useState(false);

  const { ensurePublicUrl, isUploading, uploadProgress } = useEnsurePublicUrl();

  // ask for orientation once
  useEffect(() => {
    if (!plan || askedOrientation || plan.orientation) return;
    setMessages(prev => [...prev, { role: 'assistant', content: 'Before we craft it: should the final piece be Horizontal, Vertical, or Square?' }]);
    setAskedOrientation(true);
  }, [plan, askedOrientation]);

  // layout helpers
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileShowAfter, setMobileShowAfter] = useState(false);
  const canGenerate = !!imageId && !!plan?.orientation && !generating;

  console.log("CAN GENERATE???", canGenerate, imageId, plan, generating)

  useEffect(() => {
    const run = () => setIsMobile(window.innerWidth < 768);
    run(); window.addEventListener('resize', run);
    return () => window.removeEventListener('resize', run);
  }, []);

  // load pending (from products)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from');
      if (from !== 'products') { setPending(null); return; }
      const raw = localStorage.getItem('spookify:pending-product');
      if (raw) setPending(JSON.parse(raw) as PendingSelection);
    } catch {}
  }, []);

  // cleanup blobs
  useEffect(() => () => { if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  // carry orientation from variant, if any
  useEffect(() => {
    const variant = pending?.variant;
    if (!variant?.orientation) return;
    setPlan(p => ({ ...(p ?? {}), orientation: variant.orientation, targetAspect: variant.orientation === 'Horizontal' ? 1.4 : 0.7 }));
  }, [pending]);

  // --- API helpers ---
  const refreshPlanFromServer = async (id: string) => {
    try {
      const j = await fetchJsonWithDebug<{ plan?: Plan }>(`/api/get-plan?id=${encodeURIComponent(id)}`);
      if (j?.plan) setPlan(j.plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const postChat = async (msgs: Msg[]): Promise<ChatResponse> => {
    return await fetchJsonWithDebug<ChatResponse>('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: imageId, messages: msgs, mode: 'lovify' }),
    });
  };

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  useEffect(() => { scrollToBottom(); }, [messages, chatBusy, generating]);

  const autoResize = useCallback(() => {
    const el = inputRef.current; if (!el) return;
    el.style.height = '0px';
    el.style.height = Math.min(Math.max(el.scrollHeight, 40), isMobile ? 96 : 160) + 'px';
  }, [isMobile]);
  useEffect(() => { autoResize(); }, [autoResize, input]);

  // upload handling
  const setFromFile = async (file: File) => {
    const fileToResizedBlob = async (src: File, maxDim = 2000, quality = 0.86): Promise<Blob> => {
      const bmp = await createImageBitmap(src);
      const scale = Math.min(maxDim / bmp.width, maxDim / bmp.height, 1);
      const w = Math.round(bmp.width * scale);
      const h = Math.round(bmp.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas 2D unavailable');
      ctx.drawImage(bmp, 0, 0, w, h);
      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', quality);
      });
    };

    try {
      let f: File = file;
      const isHeic = f.name.toLowerCase().endsWith('.heic') || f.type === 'image/heic';
      if (isHeic) {
        const { convertHEICtoJPG } = await import('@/lib/convertHEICtoJPG');
        f = await convertHEICtoJPG(f);
      }
      if (!f.type.startsWith('image/')) return;

      setError(null);
      setLovified(null);
      setPlan(null);
      setMessages([]);

      const previewObjUrl = URL.createObjectURL(f);
      setPreviewUrl(previewObjUrl);

      const chatDataUrl = await fileToResizedDataUrl(f, 1280, 0.9);
      setOriginalDataUrl(chatDataUrl);

      const resizedBlob = await fileToResizedBlob(f, 2000, 0.86);
      const uploadFile = new File([resizedBlob], f.name.replace(/\.[^.]+$/, '') + '-web.jpg', { type: 'image/jpeg' });

      const fd = new FormData();
      fd.append('file', uploadFile);

      let res = await fetch('/api/upload-original', { method: 'POST', body: fd });
      let text = await res.text();
      let json = parseJSON<UploadOriginalOk | UploadOriginalErr>(text);

      if (res.status === 413 || /too[_\s-]?large|payload/i.test(text)) {
        const tinyDataUrl = await fileToResizedDataUrl(f, 1400, 0.84);
        res = await fetch('/api/upload-original', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl: tinyDataUrl }),
        });
        text = await res.text();
        json = parseJSON<UploadOriginalOk | UploadOriginalErr>(text);
      }

      if (!res.ok || !json || !hasImageId(json)) {
        const errMsg = (json as UploadOriginalErr | null)?.error || text || 'Upload failed';
        throw new Error(errMsg);
      }

      const newId = json.imageId;
      setImageId(newId);
      setMessages([
        {
          role: 'assistant',
          content:
            `Beautiful! Tell me a vibe (e.g., **soft-candlelight • blush & gold • rose petals**), or pick a chip below.`,
        },
      ]);
      await refreshPlanFromServer(newId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setChatBusy(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void setFromFile(f);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) void setFromFile(f);
  };

  // send chat
  const send = async () => {
    if (!input.trim() || !imageId || generating) return;
    const userText = input.trim();

    const noUserImageYet =
      !messages.some((m) => m.role === 'user' && Array.isArray(m.images) && m.images.length > 0);
    const shouldAttachImage = !!originalDataUrl && noUserImageYet;

    const userMessage: Msg = { role: 'user', content: userText, images: shouldAttachImage ? [originalDataUrl!] : undefined };
    const newMsgs = [...messages, userMessage];

    setMessages(newMsgs);
    setInput('');
    setChatBusy(true);
    setError(null);

    try {
      const data = await postChat(newMsgs);
      const maybeCfg = data.plan ?? extractConfigFrom(data.content);
      const cfg: Plan = isPlan(maybeCfg) ? (maybeCfg as Plan) : null;

      if (cfg) {
        setPlan(cfg);
        const short = summarizePlan(cfg, userText);
        setMessages((prev) => [...prev, { role: 'assistant', content: short }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
      }
      await refreshPlanFromServer(imageId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setChatBusy(false);
    }
  };

  // generate
  const generate = async () => {
    if (!imageId) { setError('Please upload an image first'); return; }
    if (!plan?.orientation) { setError('Pick an orientation (Horizontal / Vertical / Square) before generating.'); return; }

    setGenerating(true); setError(null);

    console.log("why isnt generate working", GEN_ENDPOINT_BASE )

    const aspect =
      typeof plan.targetAspect === 'number' && plan.targetAspect > 0
        ? plan.targetAspect
        : plan.orientation === 'Horizontal'
        ? 1.4
        : plan.orientation === 'Vertical'
        ? 0.7
        : 1;

    try {
      const start = await fetch(`${GEN_ENDPOINT_BASE}/begin`, {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: imageId,
          promptOverride: finalizedPrompt || undefined,
          orientation: plan.orientation,
          target: { aspect, minWidth: 2048, mode: 'cover' },
        }),
      });

      const sText = await start.text();
      if (!start.ok) throw new Error(`HTTP ${start.status} ${GEN_ENDPOINT_BASE}/begin\n${sText}`);
      const s = JSON.parse(sText);
      if (!s?.jobId) throw new Error('Missing jobId');

      const jobId: string = s.jobId;
      let stopped = false;

      const onVis: EventListener = () => {
        if (!stopped && document.visibilityState === 'visible') void poll();
      };

      const poll = async (): Promise<void> => {
        if (stopped) return;
        try {
          const r = await fetch(`${GEN_ENDPOINT_BASE}/status?id=${encodeURIComponent(jobId)}`, { cache: 'no-store' });
          const j = await r.json();

          if (j.status === 'done' && j.resultUrl) {
            setLovified(j.resultUrl as string);
            setGenerating(false);
            stopped = true;
            document.removeEventListener('visibilitychange', onVis);
            return;
          }

          if (j.status === 'error') {
            setError(j.error || `${BRAND} failed`);
            setGenerating(false);
            stopped = true;
            document.removeEventListener('visibilitychange', onVis);
            return;
          }
        } catch {}
      };

      document.addEventListener('visibilitychange', onVis, { passive: true });
      void poll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setGenerating(false);
    }
  };

  // routes
  const goChooseProduct = async () => {
    try {
      if (!lovified) { setError('No image yet. Generate first.'); return; }
      if (!imageId) { setError('Missing image id.'); return; }

      let fileUrl = lovified;
      if (!isHttpUrl(lovified)) fileUrl = await ensurePublicUrl(lovified, imageId);
      const qp = new URLSearchParams({ fileUrl, imageId });
      if (plan?.orientation && (plan.orientation === 'Horizontal' || plan.orientation === 'Vertical')) {
        qp.set('orientation', plan.orientation);
      }
      try {
        localStorage.setItem('spookify:last-plan', JSON.stringify({ orientation: plan?.orientation ?? null, ts: Date.now() }));
      } catch {}
      router.push(`/products?${qp.toString()}`);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const printWithPending = async () => {
    try {
      if (!lovified || !pending) { alert('Please generate your image first.'); return; }
      if (!pending.variant?.productUid) { alert('Missing SKU — please reselect your product.'); return; }

      const useId: string = pending.imageId || imageId || `img-${Date.now()}`;
      const publicUrl = await ensurePublicUrl(lovified, useId);

      const priceMajor =
        pending.variant.prices[pending.currency] ??
        pending.variant.prices.GBP ??
        0;

      const niceTitle =
        pending.titleSuffix ||
        `${pending.variant.sizeLabel}${pending.variant.frameColor ? ` – ${pending.variant.frameColor}` : ''} – ${pending.variant.orientation}`;

      const qp = new URLSearchParams({
        fileUrl: publicUrl,
        imageId: useId,
        title: `${pending.productTitle} – ${niceTitle}`,
        amount: String(priceMajor),
        currency: pending.currency,
        size: pending.variant.sizeLabel,
        orientation: pending.variant.orientation,
        productUid: pending.variant.productUid,
      });
      if (pending.variant.frameColor) qp.set('frameColor', pending.variant.frameColor);

      localStorage.setItem('spookify:last-order', JSON.stringify({
        product: pending.productTitle,
        size: pending.variant.sizeLabel,
        orientation: pending.variant.orientation,
        frameColor: pending.variant.frameColor ?? null,
        imageUrl: publicUrl,
        imageId: useId,
        currency: pending.currency,
        ts: Date.now(),
      }));

      router.push(`/checkout?${qp.toString()}`);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  // love presets
  const presets = [
    'Soft candlelight • blush & gold • rose petals',
    'Painterly-photoreal • dusky mauve • gentle film grain',
    'Elegant date-night • warm bokeh • no text',
  ];

  /* ======================= Render ======================= */
  return (
    <main className={`min-h-screen ${THEME.bg} text-white px-4 md:px-8 pt-4 pb-[6rem] md:pb-16 overflow-y-auto`}>
      <header className="max-w-6xl mx-auto text-center mb-3">
        <h1 className="text-3xl md:text-4xl font-bold">
          {BRAND} Your Photo <span className={THEME.accent}>💘</span>
        </h1>
        <p className="text-white/60 mt-1">Upload → Chat → Generate → Print</p>
      </header>

      {pending && !originalDataUrl && !lovified ? (
        <div className="animate-[fade-in_0.4s_ease-out] mb-4 max-w-xl mx-auto bg-rose-600/10 border border-rose-600/30 text-rose-200 text-sm md:text-base px-4 py-3 rounded-xl text-center shadow-sm">
          You chose
          <strong className="mx-1 text-white">
            {pending.variant?.sizeLabel}
            {pending.variant?.frameColor ? ` ${pending.variant.frameColor} Frame` : ''}
            {` – ${pending.variant?.orientation}`}
          </strong>
          . Let’s make it romantic ✨
        </div>
      ) : null}

      {error ? <p className="text-rose-300 text-center mb-3">{error}</p> : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
        {/* LEFT: Upload + Stage */}
        <section className="lg:col-span-1 flex flex-col gap-4 h-full">
          {!lovified && !originalDataUrl ? (
            <div
              className={`flex-1 min-h-[320px] border-2 border-dashed ${THEME.ring} rounded-xl p-6 ${THEME.panel} text-center cursor-pointer hover:border-white/40 transition grid place-items-center`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              {previewUrl ? (
                <div className="relative w-full max-w-[520px] aspect-square">
                  <Image src={previewUrl} alt="Preview" fill sizes="(max-width: 768px) 100vw, 520px" className="object-contain rounded-md" priority />
                </div>
              ) : (
                <p className="text-white/60">Click or drag & drop your image here</p>
              )}
            </div>
          ) : null}

          {originalDataUrl ? (
            <div className={`${THEME.panel} rounded-xl p-3 md:p-4 border ${THEME.ring} flex-1 min-h-0`}>
              <div className="relative w-full aspect-square border border-white/10 rounded overflow-hidden bg-black">
                {/* Desktop: drag slider. Mobile: tap toggle */}
                {lovified ? (
                  <>
                    <div className="absolute z-10 right-3 top-3 md:hidden">
                      <button
                        onClick={() => setMobileShowAfter(!mobileShowAfter)}
                        className="rounded-full bg-black/70 border border-white/15 px-3 py-1 text-[11px]"
                      >
                        {mobileShowAfter ? 'Show original' : `Show ${BRAND}`}
                      </button>
                    </div>
                    <div className="hidden md:block w-full h-full">
                      <Comparison className="w-full h-full" mode="drag">
                        <ComparisonItem position="left">
                          <Image src={originalDataUrl} alt="Original" fill className="object-contain" sizes="(max-width: 1024px) 100vw, 50vw" priority />
                        </ComparisonItem>
                        <ComparisonItem position="right">
                          <Image src={lovified} alt={`${BRAND} result`} fill className="object-contain" sizes="(max-width: 1024px) 100vw, 50vw" priority />
                        </ComparisonItem>
                        <ComparisonHandle>
                          <div className="relative z-50 flex items-center justify-center h-full w-12">
                            <Heart className="h-6 w-6 text-rose-400 drop-shadow-md" />
                          </div>
                        </ComparisonHandle>
                      </Comparison>
                    </div>
                    <div className="md:hidden w-full h-full">
                      <Image
                        src={mobileShowAfter ? lovified : originalDataUrl}
                        alt={mobileShowAfter ? `${BRAND} result` : 'Original'}
                        fill
                        className="object-contain"
                        sizes="100vw"
                        priority
                      />
                    </div>
                  </>
                ) : (
                  <Image src={originalDataUrl} alt="Original" fill className="object-contain" sizes="(max-width: 1024px) 100vw, 50vw" priority />
                )}

                {isUploading && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 text-xs rounded-full border border-white/10">
                    Uploading… {uploadProgress}%
                  </div>
                )}

                {generating ? (
                  <div className="absolute inset-0 pointer-events-none" aria-live="polite">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs border border-white/10">
                      Crafting your {BRAND.toLowerCase()} image…
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                <div className="flex gap-2">
                  {lovified ? (
                    <button onClick={goChooseProduct} disabled={generating} className="border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 rounded disabled:opacity-50">
                      Choose product
                    </button>
                  ) : null}
                  {lovified && pending ? (
                    <button onClick={printWithPending} disabled={generating} className="bg-rose-600 hover:bg-rose-500 px-4 py-2 rounded disabled:opacity-50">
                      Checkout
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {/* RIGHT: Chat */}
        <section className="lg:col-span-2 flex flex-col gap-4 max-h-full overflow-y-auto">
          {originalDataUrl ? (
            <div className="hidden md:flex flex-wrap gap-2">
              {presets.map((p) => (
                <button key={p} onClick={() => setInput(p)} className={`px-3 py-1.5 text-xs md:text-sm rounded-full border ${THEME.chip}`}>
                  {p}
                </button>
              ))}
            </div>
          ) : null}

          <div ref={chatScrollRef} className={`${THEME.panel} rounded-xl p-4 border ${THEME.ring} flex-1 min-h-0`}>
            {!originalDataUrl && messages.length === 0 ? (
              <div className="h-full grid place-items-center text-center text-white/70">
                <div>
                  <p className="font-medium mb-2">Start by uploading a photo</p>
                  <p className="text-sm">Then pick a vibe or type your own romantic prompt.</p>
                </div>
              </div>
            ) : null}

            {messages.map((m, i) => (
              <div key={i} className={`mb-3 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`${m.role === 'user' ? 'bg-rose-700' : 'bg-black/40'} inline-block px-3 py-2 rounded-lg whitespace-pre-wrap max-w-[90%]`}>
                  {m.content}
                </div>
              </div>
            ))}

            {(chatBusy || generating) && (
              <div className="mb-1 text-left">
                <span className="inline-flex items-center gap-2 bg-black/40 px-3 py-2 rounded-lg">
                  <span className="text-gray-300">{generating ? 'Rendering your image…' : 'Dreaming up ideas'}</span>
                  <span className="typing relative inline-block w-6">
                    <span className="dot" /><span className="dot" /><span className="dot" />
                  </span>
                </span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick tweaks after a result */}
          {lovified && (
            <div className={`${THEME.panel} rounded-xl p-3 border ${THEME.ring}`}>
              <div className={`text-sm ${THEME.textSubtle} mb-2`}>Want tweaks? Try one:</div>
              <div className="flex flex-wrap gap-2">
                {[
                  'More glow & film grain',
                  'Add subtle rose petals',
                  'Softer bokeh, warmer tones',
                  'Classic black-white with blush accents',
                ].map((t) => (
                  <button
                    key={t}
                    onClick={() => { setInput(t); setTimeout(() => inputRef.current?.focus(), 0); }}
                    className={`px-3 py-1.5 text-xs rounded-full border ${THEME.chip}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Desktop composer */}
          <div className="hidden md:block">
            <Composer
              desktop
              disabled={!originalDataUrl || chatBusy || generating}
              value={input}
              setValue={setInput}
              onSend={send}
              inputRef={inputRef}
              autoResize={() => {
                const el = inputRef.current; if (!el) return;
                el.style.height = '0px';
                el.style.height = Math.min(Math.max(el.scrollHeight, 40), 160) + 'px';
              }}
            />
          </div>

          {/* Generate CTA */}
          {plan && !generating && (
            <div className={`${THEME.panel} rounded-xl p-3 border ${THEME.ring} sticky bottom-0`}>
              <button
                className={`w-full px-4 py-2 rounded ${THEME.cta} disabled:opacity-50`}
                aria-busy={generating}
                disabled={!canGenerate}
                onClick={generate}
              >
                Use this plan → Generate
              </button>
            </div>
          )}

          {plan && !plan.orientation && (
            <div className={`text-[13px] ${THEME.textSubtle}`}>
              Pick an orientation:&nbsp;
              <button onClick={() => setPlan(p => ({ ...p, orientation: 'Horizontal', targetAspect: 1.4 }))} className="underline mr-2">Horizontal</button>
              <button onClick={() => setPlan(p => ({ ...p, orientation: 'Vertical', targetAspect: 0.7 }))} className="underline mr-2">Vertical</button>
              <button onClick={() => setPlan(p => ({ ...p, orientation: 'Square', targetAspect: 1 }))} className="underline">Square</button>
            </div>
          )}
        </section>
      </div>

      {/* Mobile sticky composer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/80 backdrop-blur border-t border-white/10 px-3 py-2">
        <Composer
          disabled={!originalDataUrl || chatBusy || generating}
          value={input}
          setValue={setInput}
          onSend={send}
          inputRef={inputRef}
          autoResize={() => {
            const el = inputRef.current; if (!el) return;
            el.style.height = '0px';
            el.style.height = Math.min(Math.max(el.scrollHeight, 40), 96) + 'px';
          }}
        />
      </div>

      <div className="h-[80px] md:hidden" />

      {/* typing dots */}
      <style jsx>{`
        .typing .dot {
          position: relative; display: inline-block; width: 6px; height: 6px; margin: 0 1px;
          background: #ffd7e0; border-radius: 50%; animation: bounce 1.2s infinite ease-in-out;
        }
        .typing .dot:nth-child(2) { animation-delay: 0.2s; }
        .typing .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%,80%,100% { transform: translateY(0); opacity:.5 } 40% { transform: translateY(-4px); opacity:1 } }
      `}</style>
    </main>
  );
}

/* ============== Composer ============== */
function Composer({
  value,
  setValue,
  onSend,
  inputRef,
  autoResize,
  disabled,
  desktop = false,
}: {
  value: string;
  setValue: (v: string) => void;
  onSend: () => void | Promise<void>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  autoResize: () => void;
  disabled: boolean;
  desktop?: boolean;
}) {
  const handleSend = () => { if (!disabled && value.trim()) void onSend(); };

  return (
    <div className={`relative ${desktop ? '' : ''}`}>
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => { setValue(e.target.value); autoResize(); }}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        placeholder={
          disabled
            ? 'Upload an image to begin'
            : 'Describe your vibe (e.g., candlelit • blush & gold • petals • painterly-photoreal • no text)'
        }
        className="
          w-full bg-white/5 border border-white/15 rounded-full md:rounded-xl
          px-4 md:px-4 py-3 md:py-3 pr-12 md:pr-20 text-sm leading-6
          placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500
          disabled:opacity-60 resize-none
        "
        disabled={disabled}
        rows={2}
        style={{ maxHeight: 160 }}
        aria-label="Chat message"
      />

      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="
          absolute right-1.5 bottom-1.5 md:right-2 md:bottom-2 h-9 md:h-10
          px-0 md:px-4 rounded-full bg-white text-black shadow disabled:opacity-50
          hover:bg-rose-200 inline-flex items-center justify-center gap-2
        "
      >
        <Send className="h-4 w-4" />
        <span className="hidden md:inline text-sm font-medium">Send</span>
      </button>
    </div>
  );
}
