'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Ghost, Send } from 'lucide-react';
import {
  Comparison,
  ComparisonItem,
  ComparisonHandle,
} from '@/components/ui/shadcn-io/comparison/index';

import type { Currency } from '@/lib/currency';

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
  spookiness?: number;
  vibe?: string;
  elements?: string[];
  palette?: string;
  avoid?: string[];
  textOverlay?: string;
  orientation?: 'Horizontal' | 'Vertical' | 'Square';
  targetAspect?: number; // derived from orientation/size later
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
  try { return JSON.parse(text) as T; }
  catch { return null; }
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
  try {
    return JSON.parse(m[1] ?? '');
  } catch {
    return null;
  }
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
  return `Got it — ${gist}. Plan ready — hit “Use this plan → Generate”.`;
}

async function fileToResizedDataUrl(file: File, maxDim = 1280, quality = 0.9): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(maxDim / bitmap.width, maxDim / bitmap.height, 1);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

const isHttpUrl = (s: string) => /^https?:\/\//i.test(s);

async function ensurePublicUrl(current: string, givenImageId: string) {
  if (isHttpUrl(current)) return current;
  const upRes = await fetch('/api/upload-spooky', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl: current, filename: `spookified-${givenImageId}.png` }),
  });
  const upJson: { url?: string; error?: string } = await upRes.json();
  if (!upRes.ok || !upJson?.url) throw new Error(upJson?.error || 'Upload failed');
  return upJson.url;
}

async function fetchJsonWithDebug<T = unknown>(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, init);
  let text = '';
  try { text = await res.clone().text(); } catch {}
  if (!res.ok) {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    // Include URL + status + raw response so your red banner names the culprit
    throw new Error(`HTTP ${res.status} ${url}\n${text}`);
  }
  try { return (await res.json()) as T; } catch {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    throw new Error(`Bad JSON from ${url}\n${text}`);
  }
}


/* ======================= Component ======================= */
export default function UploadWithChatPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core state
  const [spookified, setSpookified] = useState<string | null>(null);
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);

  // chat state
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [plan, setPlan] = useState<Plan>(null);
  const finalizedPrompt = useMemo(() => (plan?.finalizedPrompt ?? ''), [plan]);

  // generation state
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // product selection handoff (design-first path)
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [askedOrientation, setAskedOrientation] = useState(false);

  useEffect(() => {
    if (!plan || askedOrientation || plan.orientation) return;
    setMessages(prev => [
      ...prev,
      { role: 'assistant',
        content: 'Quick one — should the final print be Horizontal, Vertical, or Square?' }
    ]);
    setAskedOrientation(true);
  }, [plan, askedOrientation]);
  // layout helpers
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileShowAfter, setMobileShowAfter] = useState(false);

  const canGenerate = !!imageId && !!plan?.orientation && !generating;

  // responsive flag
  useEffect(() => {
    const run = () => setIsMobile(window.innerWidth < 768);
    run();
    window.addEventListener('resize', run);
    return () => window.removeEventListener('resize', run);
  }, []);

  // load pending from /products
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from');
      if (from !== 'products') {
        setPending(null);
        return;
      }
      const raw = localStorage.getItem('spookify:pending-product');
      if (raw) setPending(JSON.parse(raw) as PendingSelection);
    } catch { /* noop */ }
  }, []);

  // cleanup preview blobs
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const variant = pending?.variant;
    if (!variant?.orientation) return;
  
    setPlan(p => ({
      ...(p ?? {}),
      orientation: variant.orientation,
      targetAspect: variant.orientation === 'Horizontal' ? 1.4 : 0.7,
    }));
  }, [pending]);
  

  // --- API helpers ---
  const refreshPlanFromServer = async (id: string) => {
    try {
      const j = await fetchJsonWithDebug<{ plan?: Plan }>(`/api/get-plan?id=${encodeURIComponent(id)}`);
      if (j?.plan) setPlan(j.plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      console.log("error line 246")

    }
  };
  

  const postChat = async (msgs: Msg[]): Promise<ChatResponse> => {
    try {
      return await fetchJsonWithDebug<ChatResponse>('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: imageId, messages: msgs }),
      });
    } catch (e) {
      throw e; // caller already sets setError
    }
  };
  

  // scroll chat to bottom on changes
  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  useEffect(() => { scrollToBottom(); }, [messages, chatBusy, generating]);

  // auto-resize composer
  // const autoResize = () => {
  //   const el = inputRef.current;
  //   if (!el) return;
  //   el.style.height = '0px';
  //   el.style.height = Math.min(Math.max(el.scrollHeight, 40), isMobile ? 96 : 160) + 'px';
  // };
  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = Math.min(Math.max(el.scrollHeight, 40), isMobile ? 96 : 160) + 'px';
  }, [isMobile]);
  
  useEffect(() => { autoResize(); }, [autoResize, input]);

  // upload handling
  const setFromFile = async (file: File) => {
    // local helper blob
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
      console.log("error line 311")

      setSpookified(null);
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
            'Nice photo! Pick a vibe below or type your own (e.g., cozy-cute • spookiness 3 • fog + tiny ghost • moonlit blues • no blood).',
        },
      ]);
      await refreshPlanFromServer(newId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      console.log("error line 361")

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
    console.log("error line 394")


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
      console.log("error line 412")

    } finally {
      setChatBusy(false);
    }
  };

  // generate
  // generate
const generate = async () => {
  if (!imageId) { setError('Please upload an image first'); return; }
  console.log("error line 423")

  if (!plan?.orientation) { setError
    console.log("error line 426")

    return; }

  setGenerating(true);
  setError(null);
  console.log("error line 431")


  // Map orientation → aspect if plan.targetAspect isn't already set
  const aspect =
    typeof plan.targetAspect === 'number' && plan.targetAspect > 0
      ? plan.targetAspect
      : plan.orientation === 'Horizontal'
      ? 1.4   // tweak to your product aspect (e.g., 70×100 -> 1.428)
      : plan.orientation === 'Vertical'
      ? 0.7   // inverse of 1.4
      : 1;    // Square

  try {
    const start = await fetch('/api/spookify/begin', {
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
    if (!start.ok) throw new Error(`HTTP ${start.status} /api/spookify/begin\n${sText}`);
    const s = JSON.parse(sText);
    

 
    const jobId: string = s.jobId;
    let stopped = false;

    const poll = async () => {
      if (stopped) return;
      try {
        const r = await fetch(`/api/spookify/status?id=${encodeURIComponent(jobId)}`, { cache: 'no-store' });
        const j = await r.json();

        if (j.status === 'done' && j.resultUrl) {
          setSpookified(j.resultUrl as string);
          setGenerating(false);
          stopped = true;
          document.removeEventListener('visibilitychange', onVis);          return;
        }
        if (j.status === 'error') {
          setError(j.error || 'Spookify failed');
          console.log("error line 479")

          setGenerating(false);
          stopped = true;
          document.addEventListener('visibilitychange', onVis, { passive: true });
          return;
        }
      } catch {
        // transient network failures → keep polling
      }
      setTimeout(poll, 2000);
    };

    const onVis: EventListener = () => {
      if (!stopped && typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void poll();
      }
    };
    
    document.addEventListener('visibilitychange', onVis, { passive: true });
    // Remove the 'as any' when cleaning up:
    document.removeEventListener('visibilitychange', onVis);
    void poll();
    
  } catch (e: unknown) {
    console.log("error line 485")
    setError(e instanceof Error ? e.message : String(e));
    console.log("error line 506")

    setGenerating(false);
  }
};

// const generate = async () => {
//   if (!imageId) { setError('Please upload an image first'); return; }
//   if (!plan?.orientation) { setError('Pick an orientation (Horizontal / Vertical / Square) before generating.'); return; }

//   setGenerating(true);
//   setError(null);

//   const aspect =
//     typeof plan.targetAspect === 'number' && plan.targetAspect > 0
//       ? plan.targetAspect
//       : plan.orientation === 'Horizontal'
//       ? 1.4
//       : plan.orientation === 'Vertical'
//       ? 0.7
//       : 1;

//   try {
//     const start = await fetch('/api/spookify/begin', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         id: imageId,
//         promptOverride: finalizedPrompt || undefined,
//         orientation: plan.orientation,
//         target: { aspect, minWidth: 2048, mode: 'cover' },
//       }),
//     });

//     const s = await start.json();
//     if (!start.ok || !s?.jobId) throw new Error(s?.error || 'Failed to start');

//     const jobId: string = s.jobId;
//     let stopped = false;

//     const poll = async (): Promise<void> => {
//       if (stopped) return;

//       try {
//         const r = await fetch(`/api/spookify/status?id=${encodeURIComponent(jobId)}`, { cache: 'no-store' });
//         const j = await r.json();

//         if (j.status === 'done' && j.resultUrl) {
//           setSpookified(j.resultUrl as string);
//           setGenerating(false);
//           stopped = true;
//           document.removeEventListener('visibilitychange', onVis);
//           return;
//         }
//         if (j.status === 'error') {
//           setError(j.error || 'Spookify failed');
//           setGenerating(false);
//           stopped = true;
//           document.removeEventListener('visibilitychange', onVis);
//           return;
//         }
//       } catch {
//         // ignore transient network failures
//       }
//       setTimeout(poll, 2000);
//     };

//     // ✅ Properly typed listener (no `as any`)
//     const onVis: EventListener = () => {
//       if (!stopped && document.visibilityState === 'visible') {
//         void poll();
//       }
//     };

//     document.addEventListener('visibilitychange', onVis, { passive: true });
//     void poll();
//   } catch (e: unknown) {
//     setError(e instanceof Error ? e.message : String(e));
//     setGenerating(false);
//   }s
// };



  // routes
  const goChooseProduct = async () => {
    try {
      if (!spookified) { setError('No spookified image found. Generate first.'); return; }
      console.log("error line 573")

      if (!imageId) { setError('Missing image id.'); return; }
      console.log("error line 576")

      let fileUrl = spookified;
      if (!isHttpUrl(spookified)) fileUrl = await ensurePublicUrl(spookified, imageId);
      const qp = new URLSearchParams({ fileUrl, imageId });
      if (plan?.orientation && (plan.orientation === 'Horizontal' || plan.orientation === 'Vertical')) {
        qp.set('orientation', plan.orientation);
      }
      // router.push(`/products?${qp.toString()}`);
      try {
        localStorage.setItem('spookify:last-plan', JSON.stringify({
          orientation: plan?.orientation ?? null,
          ts: Date.now(),
        }));
      } catch {}
      router.push(`/products?${qp.toString()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      console.log("error line 594")

    }
  };

  const printWithPending = async () => {
    try {
      if (!spookified || !pending) { alert('Please generate your spookified image first.'); return; }
      if (!pending.variant?.productUid) { alert('Missing SKU — please reselect your product.'); return; }

      const useId: string = pending.imageId || imageId || `img-${Date.now()}`;
      const publicUrl = await ensurePublicUrl(spookified, useId);

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
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      console.log("error line 642")

    }
  };

  // preset prompts (chips)
  const presets = [
    'Cozy-cute • spookiness 3 • fog + tiny ghost',
    'Storybook • warm candlelight • no blood',
    'Moody forest • teal & orange • mist',
  ];

  /* ======================= Render ======================= */
  return (
    
<main className="min-h-screen bg-black text-white px-4 md:px-8 pt-4 pb-[6rem] md:pb-16 overflow-y-auto">
      <header className="max-w-6xl mx-auto text-center mb-3">
        <h1 className="text-3xl md:text-4xl font-bold">Spookify Your Art 👻</h1>
        <p className="text-white/60 mt-1">Upload → Pick vibe → Generate → Print</p>
      </header>

      {pending && !originalDataUrl && !spookified ? (
        <div className="animate-[fade-in_0.4s_ease-out] mb-4 max-w-xl mx-auto bg-orange-600/10 border border-orange-600/30 text-orange-200 text-sm md:text-base px-4 py-3 rounded-xl text-center shadow-sm">
          You’ve chosen the
          <strong className="mx-1 text-white">
            {pending.variant?.sizeLabel}
            {pending.variant?.frameColor ? ` ${pending.variant.frameColor} Frame` : ''}
            {` – ${pending.variant?.orientation}`}
          </strong>
          print.
          <span className="block mt-1 text-white/80">
            Ready to <span className="font-semibold text-orange-400">Spookify</span>?
          </span>
        </div>
      ) : null}

      {error ? <p className="text-red-400 text-center mb-3">{error}</p> : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
        {/* LEFT: Upload + Stage */}
        <section className="lg:col-span-1 flex flex-col gap-4 h-full">
          {!spookified && !originalDataUrl ? (
            <div
              className="flex-1 min-h-[320px] border-2 border-dashed border-white/20 rounded-xl p-6 bg-gray-950 text-center cursor-pointer hover:border-white/40 transition grid place-items-center"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              {previewUrl ? (
                <div className="relative w-full max-w-[520px] aspect-square">
<Image
  src={previewUrl}
  alt="Preview"
  fill
  sizes="(max-width: 768px) 100vw, 520px"  // or simply "100vw"
  className="object-contain rounded-md"
  priority
/>                </div>
              ) : (
                <p className="text-gray-400">Click or drag & drop your image here</p>
              )}
            </div>
          ) : null}

          {originalDataUrl ? (
            <div className="bg-gray-950 rounded-xl p-3 md:p-4 border border-white/10 flex-1 min-h-0">
              <div className="relative w-full h-full aspect-square border border-white/10 rounded overflow-hidden bg-black">
                {/* Desktop/Tablet: drag slider. Mobile: tap toggle */}
                {spookified ? (
                  <>
                    <div className="absolute z-10 right-3 top-3 md:hidden">
                      <button
                        onClick={() => setMobileShowAfter(!mobileShowAfter)}
                        className="rounded-full bg-black/70 border border-white/15 px-3 py-1 text-[11px]"
                      >
                        {mobileShowAfter ? 'Show original' : 'Show spookified'}
                      </button>
                    </div>
                    <div className="hidden md:block w-full h-full">
                      <Comparison className="w-full h-full" mode="drag">
                        <ComparisonItem position="left">
                          <Image
                            src={originalDataUrl}
                            alt="Original"
                            fill
                            className="object-contain"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            priority
                          />
                        </ComparisonItem>
                        <ComparisonItem position="right">
                          <Image
                            src={spookified}
                            alt="Spookified"
                            fill
                            className="object-contain"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            priority
                          />
                        </ComparisonItem>
                        <ComparisonHandle>
                          <div className="relative z-50 flex items-center justify-center h-full w-12">
                            <Ghost className="h-6 w-6 text-orange-500 drop-shadow-md" />
                          </div>
                        </ComparisonHandle>
                      </Comparison>
                    </div>
                    <div className="md:hidden w-full h-full">
                      <Image
                        src={mobileShowAfter ? spookified : originalDataUrl}
                        alt={mobileShowAfter ? 'Spookified' : 'Original'}
                        fill
                        className="object-contain"
                        sizes="100vw"
                        priority
                      />
                    </div>
                  </>
                ) : (
                  <Image
                    src={originalDataUrl}
                    alt="Original"
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                )}

                {/* Generating overlay */}
                {generating ? (
                  <div className="absolute inset-0 pointer-events-none" aria-live="polite">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
                    <div className="absolute inset-0 animate-shimmer" />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs border border-white/10">
                      Spookifying your image…
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                <div className="flex gap-2">
                  {spookified ? (
                    <button
                      onClick={goChooseProduct}
                      disabled={generating}
                      className="border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 rounded disabled:opacity-50"
                    >
                      Choose product
                    </button>
                  ) : null}
                  {spookified && pending ? (
                    <button
                      onClick={printWithPending}
                      disabled={generating}
                      className="bg-[#FF6A2B] hover:bg-[#FF814E] px-4 py-2 rounded disabled:opacity-50"
                    >
                      Pay with PayPal
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {/* RIGHT: Chat */}
        <section className="lg:col-span-2 flex flex-col gap-4 max-h-full overflow-y-auto">
          {/* Chips show after upload */}
          {originalDataUrl ? (
            <div className="hidden md:flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  className="px-3 py-1.5 text-xs md:text-sm rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
                >
                  {p}
                </button>
              ))}
            </div>
          ) : null}

          <div
            ref={chatScrollRef}
            className="bg-gray-950 rounded-xl p-4 border border-white/10 flex-1 min-h-0 "
          >
            {/* Empty state */}
            {!originalDataUrl && messages.length === 0 ? (
              <div className="h-full grid place-items-center text-center text-white/70">
                <div>
                  <p className="font-medium mb-2">Start by uploading a photo</p>
                  <p className="text-sm">Then pick a vibe or type your own prompt.</p>
                </div>
              </div>
            ) : null}

            {messages.map((m, i) => (
              <div key={i} className={`mb-3 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div
                  className={`${
                    m.role === 'user' ? 'bg-purple-700' : 'bg-gray-800'
                  } inline-block px-3 py-2 rounded-lg whitespace-pre-wrap max-w-[90%]`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {chatBusy || generating ? (
              <div className="mb-1 text-left">
                <span className="inline-flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg">
                  <span className="text-gray-300">
                    {generating ? 'Spookifying your image…' : 'Conjuring ideas'}
                  </span>
                  <span className="typing relative inline-block w-6">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </span>
                </span>
              </div>
            ) : null}

            <div ref={chatEndRef} />
          </div>

          {/* Desktop/tablet composer (sticky inside panel) */}
          <Composer
            desktop
            disabled={!originalDataUrl || chatBusy || generating}
            value={input}
            setValue={setInput}
            onSend={send}
            inputRef={inputRef}
            autoResize={autoResize}
          />

          {/* Generate CTA bar (sticks within panel) */}
            {plan && (
                <div className="bg-gray-950 rounded-xl p-3 border border-white/10 sticky bottom-0">
                   <button 
                      className="w-full px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 disabled:opacity-50"
                      aria-busy={generating}
                      disabled={!canGenerate} onClick={generate}>
                          Use this plan → Generate
                    </button>
                </div>
            )}

            {plan && !plan.orientation && (
              <div className="text-[13px] text-white/70">
                Pick an orientation to continue: 
                <button onClick={() => setPlan(p => ({...p, orientation:'Horizontal', targetAspect:1.4}))} className="btn">Horizontal</button>
                <button onClick={() => setPlan(p => ({...p, orientation:'Vertical', targetAspect:0.7}))} className="btn">Vertical</button>
                <button onClick={() => setPlan(p => ({...p, orientation:'Square', targetAspect:1}))} className="btn">Square</button>
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
    autoResize={autoResize}
  />
</div>

{/* spacer so mobile users can scroll behind sticky bar */}
<div className="h-[80px] md:hidden" />

      {/* chat typing indicator + shimmer CSS */}
      <style jsx>{`
        .typing .dot {
          position: relative;
          display: inline-block;
          width: 6px;
          height: 6px;
          margin: 0 1px;
          background: #cfcfe1;
          border-radius: 50%;
          animation: bounce 1.2s infinite ease-in-out;
        }
        .typing .dot:nth-child(2) { animation-delay: 0.2s; }
        .typing .dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }

        .animate-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
              to right,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.08) 20%,
              rgba(255, 255, 255, 0.18) 50%,
              rgba(255, 255, 255, 0.08) 80%,
              rgba(255, 255, 255, 0) 100%
            ),
            radial-gradient(600px 300px at 30% 10%, rgba(255, 106, 43, 0.08), transparent 60%),
            radial-gradient(500px 250px at 70% 90%, rgba(139, 115, 255, 0.08), transparent 60%);
          background-repeat: no-repeat;
          transform: translateX(-100%);
          animation: shimmer-move 1.5s linear infinite;
          mix-blend-mode: screen;
        }
        @keyframes shimmer-move {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </main>
  );
}

/* ============== Small subcomponent: Composer ============== */
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
  return (
    <div className={`flex gap-2 items-end ${desktop ? '' : ''}`}>
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          autoResize();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!disabled && value.trim()) void onSend();
          }
        }}
        placeholder={
          disabled
            ? 'Upload an image to begin'
            : 'Tell me your vibe (e.g., cozy-cute • spookiness 3 • fog + tiny ghost • moonlit blues • no blood)'
        }
        className="flex-1 px-3 py-2 rounded bg-gray-900 border border-white/10 outline-none disabled:opacity-60 resize-none leading-6 text-sm"
        disabled={disabled}
        rows={2}
        style={{ maxHeight: 160 }}
        aria-label="Chat message"
      />
      <button
        onClick={() => { if (!disabled && value.trim()) void onSend(); }}
        disabled={disabled || !value.trim()}
        className="px-4 py-2 rounded bg-white text-black hover:bg-orange-300 disabled:opacity-50 inline-flex items-center gap-2"
        aria-label="Send message"
      >
        <Send className="h-4 w-4" />
        <span className="hidden sm:inline">Send</span>
      </button>
    </div>
  );
}
