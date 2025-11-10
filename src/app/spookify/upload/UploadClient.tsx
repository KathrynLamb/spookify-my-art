'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Ghost, Heart, Sparkles, Send } from 'lucide-react';
import {
  Comparison,
  ComparisonItem,
  ComparisonHandle,
} from '@/components/ui/shadcn-io/comparison/index';

import type { Currency } from '@/lib/currency';

/* ======================= Modes ======================= */

type DesignerMode = 'spookify' | 'jollyfy' | 'lovify' | 'custom';

const MODE_CONFIG: Record<
  DesignerMode,
  {
    title: string;
    emoji: string;
    helper: string;
    needsPhoto: boolean; // whether chat should require a photo before generating
    presets: string[];
    beginEndpoint: string; // POST
    statusEndpoint: string; // GET ?id=
    vibePlaceholder: string;
  }
> = {
  spookify: {
    title: 'Spookify Your Art',
    emoji: '👻',
    helper: 'Upload → Pick vibe → Generate → Print',
    needsPhoto: true,
    presets: [
      'Cozy-cute • spookiness 3 • fog + tiny ghost',
      'Storybook • warm candlelight • no blood',
      'Moody forest • teal & orange • mist',
    ],
    beginEndpoint: '/api/spookify/begin',
    statusEndpoint: '/api/spookify/status',
    vibePlaceholder:
      'cozy-cute • spookiness 3 • fog + tiny ghost • moonlit blues • no blood',
  },
  jollyfy: {
    title: 'Jollyfy Your Art',
    emoji: '🎄',
    helper: 'Idea or photo → Pick card vibe → Generate → Print',
    needsPhoto: false,
    presets: [
      'Cozy holiday card set • warm twinkle lights • soft film grain',
      'Minimal white card • embossed names • gold-foil effect',
      'Family postcard • matching sweaters • candlelight warmth',
    ],
    beginEndpoint: '/api/design/begin',
    statusEndpoint: '/api/design/status',
    vibePlaceholder:
      'cozy holiday • twinkle lights • soft grain • our names bottom center',
  },
  lovify: {
    title: 'Lovify Your Art',
    emoji: '💘',
    helper: 'Idea or photo → Romantic style → Generate → Print',
    needsPhoto: false,
    presets: [
      'Hand-drawn 6-panel comic • our meet-cute on a city street',
      'Cinematic poster • names as credits • warm golden hour',
      'Minimal line-art couple • initials K + A • blush duotone',
    ],
    beginEndpoint: '/api/design/begin',
    statusEndpoint: '/api/design/status',
    vibePlaceholder:
      'romantic comic • warm golden hour • caption “you, always.”',
  },
  custom: {
    title: 'Design Your Art',
    emoji: '✨',
    helper: 'Idea or photo → AI style → Generate → Print',
    needsPhoto: false,
    presets: [
      'Neon Night canvas • our names in signage',
      'Watercolor portrait • soft background • gentle palette',
      'Minimal line art • cushion 18″ • initials',
    ],
    beginEndpoint: '/api/design/begin',
    statusEndpoint: '/api/design/status',
    vibePlaceholder:
      'neon city • our names in signage • bold modern • no clutter',
  },
};

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
  if (!v || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return typeof obj.imageId === 'string' && typeof obj.fileUrl === 'string';
}

function extractConfigFrom(text: string): unknown | null {
  let m = text.match(/```json\s*([\s\S]*?)\s*```/i) || text.match(/```\s*([\s\S]*?)\s*```/);
  if (!m) {
    const all = text.match(/\{[\s\S]*\}/g);
    if (all?.length) m = ['', all[all.length - 1]] as unknown as RegExpMatchArray;
  }
  if (!m) return null;
  try { return JSON.parse(m[1] ?? ''); } catch { return null; }
}
function isPlan(v: unknown): v is NonNullable<Plan> {
  return !!v && typeof v === 'object';
}
function summarizePlan(plan: Plan, userText: string): string {
  const fp = (plan?.finalizedPrompt || '').trim();
  const gist = fp
    ? fp.replace(/\s+/g, ' ').split(/[,.]/).map(s => s.trim()).filter(Boolean).slice(0, 3).join(', ')
    : userText.replace(/\s+/g, ' ').trim();
  return `Got it — ${gist}. Plan ready — hit “Use this plan → Generate”.`;
}
async function fileToResizedDataUrl(file: File, maxDim = 1280, quality = 0.9): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(maxDim / bitmap.width, maxDim / bitmap.height, 1);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!; ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}
const isHttpUrl = (s: string) => /^https?:\/\//i.test(s);

/* ===================== Upload helper (unchanged) ===================== */
async function uploadWithProgress(
  blob: Blob,
  filename: string,
  onProgress: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append('file', blob, filename);
    xhr.open('POST', '/api/upload-spooky', true);
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) onProgress(Math.round((evt.loaded / evt.total) * 100));
    };
    xhr.onload = () => {
      try {
        if (xhr.status >= 200 && xhr.status < 300) {
          const json = JSON.parse(xhr.responseText);
          if (json.url) resolve(json.url);
          else reject(new Error(json.error || 'Upload failed'));
        } else reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText}`));
      } catch (err) { reject(err instanceof Error ? err : new Error(String(err))); }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(fd);
  });
}

/* ===================== ensurePublicUrl ===================== */
function useEnsurePublicUrl() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const ensurePublicUrl = useCallback(async (current: string, givenImageId: string) => {
    if (/^https?:\/\//i.test(current)) return current;
    const blob = await (await fetch(current)).blob();
    setUploadProgress(0);
    setIsUploading(true);
    try {
      const url = await uploadWithProgress(blob, `design-${givenImageId}.jpg`, setUploadProgress);
      return url;
    } finally {
      setIsUploading(false);
    }
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
export default function UploadWithChatPage() {
  const router = useRouter();
  const search = useSearchParams();
  const modeFromUrl = (search.get('mode') as DesignerMode) || 'custom';

  console.log("MODE", modeFromUrl)
  const [mode, setMode] = useState<DesignerMode>(modeFromUrl);
  const cfg = MODE_CONFIG[mode];

  // update URL when mode changes
  useEffect(() => {
    const qp = new URLSearchParams(window.location.search);
    qp.set('mode', mode);
    window.history.replaceState(null, '', `${window.location.pathname}?${qp.toString()}`);
  }, [mode]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core state
  const [resultUrl, setResultUrl] = useState<string | null>(null);
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

  // product selection handoff
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [askedOrientation, setAskedOrientation] = useState(false);

  const { ensurePublicUrl, isUploading, uploadProgress } = useEnsurePublicUrl();

  // ask orientation once a plan exists
  useEffect(() => {
    if (!plan || askedOrientation || plan.orientation) return;
    setMessages(prev => [...prev, { role: 'assistant', content: 'Quick one — should the final print be Horizontal, Vertical, or Square?' }]);
    setAskedOrientation(true);
  }, [plan, askedOrientation]);

  // layout helpers
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  const canGenerate = (!!imageId || !cfg.needsPhoto) && !!plan?.orientation && !generating;

  useEffect(() => {
    const run = () => setIsMobile(window.innerWidth < 768);
    run();
    window.addEventListener('resize', run);
    return () => window.removeEventListener('resize', run);
  }, []);

  // pending from /products
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('from') !== 'products') { setPending(null); return; }
      const raw = localStorage.getItem('spookify:pending-product');
      if (raw) setPending(JSON.parse(raw) as PendingSelection);
    } catch {}
  }, []);

  // cleanup preview blob
  useEffect(() => () => { if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  useEffect(() => {
    const variant = pending?.variant;
    if (!variant?.orientation) return;
    setPlan(p => ({ ...(p ?? {}), orientation: variant.orientation, targetAspect: variant.orientation === 'Horizontal' ? 1.4 : 0.7 }));
  }, [pending]);

  // --- API helpers (mode-aware) ---
  const refreshPlanFromServer = async (id: string) => {
    try {
      const j = await fetchJsonWithDebug<{ plan?: Plan }>(`/api/get-plan?id=${encodeURIComponent(id)}`);
      if (j?.plan) setPlan(j.plan);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const postChat = async (msgs: Msg[]): Promise<ChatResponse> => {
    return await fetchJsonWithDebug<ChatResponse>('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: imageId, messages: msgs, mode }),
    });
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, chatBusy, generating]);

  const autoResize = useCallback(() => {
    const el = inputRef.current; if (!el) return;
    el.style.height = '0px';
    el.style.height = Math.min(Math.max(el.scrollHeight, 40), isMobile ? 96 : 160) + 'px';
  }, [isMobile]);
  useEffect(() => { autoResize(); }, [autoResize, input]);

  /* ============ Upload handling ============ */
  const setFromFile = async (file: File) => {
    const fileToResizedBlob = async (src: File, maxDim = 2000, quality = 0.86): Promise<Blob> => {
      const bmp = await createImageBitmap(src);
      const scale = Math.min(maxDim / bmp.width, maxDim / bmp.height, 1);
      const w = Math.round(bmp.width * scale); const h = Math.round(bmp.height * scale);
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
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
      setResultUrl(null);
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
        { role: 'assistant',
          content:
            `Great! Tell me the vibe you want${mode !== 'spookify' ? ' (or describe the product—mug, card set, canvas...)' : ''}.` },
      ]);
      await refreshPlanFromServer(newId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const f = e.target.files?.[0]; if (f) void setFromFile(f);
  // };
  // const handleDrop = (e: React.DragEvent) => {
  //   e.preventDefault();
  //   const f = e.dataTransfer.files?.[0];
  //   if (f) void setFromFile(f);
  // };

  /* ============ Chat send ============ */
  const send = async () => {
    if (!input.trim() || generating) return;
    if (cfg.needsPhoto && !imageId) { setError('Upload a photo to begin.'); return; }

    const userText = input.trim();
    const noUserImageYet = !messages.some((m) => m.role === 'user' && Array.isArray(m.images) && m.images.length > 0);
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
      const cfgPlan: Plan = isPlan(maybeCfg) ? (maybeCfg as Plan) : null;

      if (cfgPlan) {
        setPlan(cfgPlan);
        const short = summarizePlan(cfgPlan, userText);
        setMessages((prev) => [...prev, { role: 'assistant', content: short }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
      }
      if (imageId) await refreshPlanFromServer(imageId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setChatBusy(false);
    }
  };

  /* ============ Generate (mode-aware) ============ */
  const generate = async () => {
    if (cfg.needsPhoto && !imageId) { setError('Please upload an image first'); return; }
    if (!plan?.orientation) { setError('Pick an orientation (Horizontal / Vertical / Square) before generating.'); return; }

    setGenerating(true);
    setError(null);

    const aspect =
      typeof plan.targetAspect === 'number' && plan.targetAspect > 0
        ? plan.targetAspect
        : plan.orientation === 'Horizontal'
        ? 1.4
        : plan.orientation === 'Vertical'
        ? 0.7
        : 1;

    try {
      const start = await fetch(cfg.beginEndpoint, {
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
      if (!start.ok) throw new Error(`HTTP ${start.status} ${cfg.beginEndpoint}\n${sText}`);
      const s = JSON.parse(sText);
      if (!s?.jobId) throw new Error('Missing jobId');

      const jobId: string = s.jobId;
      let stopped = false;

      const poll = async (): Promise<void> => {
        if (stopped) return;
        try {
          const r = await fetch(`${cfg.statusEndpoint}?id=${encodeURIComponent(jobId)}`, { cache: 'no-store' });
          const j = await r.json();

          if (j.status === 'done' && j.resultUrl) {
            setResultUrl(j.resultUrl as string);
            setGenerating(false);
            stopped = true;
            return;
          }
          if (j.status === 'error') {
            setError(j.error || 'Generation failed');
            setGenerating(false);
            stopped = true;
            return;
          }
        } catch {
          // transient network error — ignore
        }
        setTimeout(poll, 1500);
      };

      void poll();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setGenerating(false);
    }
  };

  /* ============ Next routes (unchanged logic) ============ */
  // const { ensurePublicUrl, isUploading, uploadProgress } = useEnsurePublicUrl();

  const goChooseProduct = async () => {
    try {
      if (!resultUrl) { setError('No generated image found. Generate first.'); return; }
      if (!imageId) { setError('Missing image id.'); return; }
      let fileUrl = resultUrl;
      if (!isHttpUrl(resultUrl)) fileUrl = await ensurePublicUrl(resultUrl, imageId);
      const qp = new URLSearchParams({ fileUrl, imageId });
      if (plan?.orientation && (plan.orientation === 'Horizontal' || plan.orientation === 'Vertical')) {
        qp.set('orientation', plan.orientation);
      }
      try {
        localStorage.setItem('spookify:last-plan', JSON.stringify({ orientation: plan?.orientation ?? null, ts: Date.now() }));
      } catch {}
      router.push(`/products?${qp.toString()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  /* ============ UI helpers ============ */
  const [mobileShowAfter, setMobileShowAfterLocal] = useState(false);
  const presets = cfg.presets;

  /* ======================= Render ======================= */
  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-8 pt-4 pb-[6rem] md:pb-16 overflow-y-auto">
      <header className="max-w-6xl mx-auto text-center mb-3">
        <h1 className="text-3xl md:text-4xl font-bold">
          {cfg.title} <span aria-hidden>{cfg.emoji}</span>
        </h1>
        <p className="text-white/60 mt-1">{cfg.helper}</p>

        {/* Mode toggle */}
        <div className="mt-3 inline-flex rounded-full bg-white/10 p-1 ring-1 ring-white/15">
          {(['spookify', 'jollyfy', 'lovify', 'custom'] as DesignerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-full text-xs md:text-sm transition ${
                mode === m ? 'bg-white text-black' : 'text-white/80 hover:text-white'
              }`}
              aria-pressed={mode === m}
            >
              {m === 'spookify' ? 'Spookify' : m === 'jollyfy' ? 'Jollyfy' : m === 'lovify' ? 'Lovify' : 'Custom'}
            </button>
          ))}
        </div>
      </header>

      {error ? <p className="text-red-400 text-center mb-3">{error}</p> : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
        {/* LEFT: Upload / Stage */}
        <section className="lg:col-span-1 flex flex-col gap-4 h-full">
          {!resultUrl && !originalDataUrl ? (
            <div
              className="flex-1 min-h-[320px] border-2 border-dashed border-white/20 rounded-xl p-6 bg-gray-950 text-center cursor-pointer hover:border-white/40 transition grid place-items-center"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void setFromFile(f); }}
            >
              <input type="file" accept="image/*" ref={fileInputRef} onChange={(e)=>{ const f=e.target.files?.[0]; if (f) void setFromFile(f); }} className="hidden" />
              {previewUrl ? (
                <div className="relative w-full max-w-[520px] aspect-square">
                  <Image src={previewUrl} alt="Preview" fill sizes="(max-width: 768px) 100vw, 520px" className="object-contain rounded-md" priority />
                </div>
              ) : (
                <p className="text-gray-400">{cfg.needsPhoto ? 'Click or drag & drop your image here' : 'Optional: add a photo (or just start chatting)'}</p>
              )}
            </div>
          ) : null}

          {originalDataUrl ? (
            <div className="bg-gray-950 rounded-xl p-3 md:p-4 border border-white/10 flex-1 min-h-0">
              <div className="relative w-full aspect-square border border-white/10 rounded overflow-hidden bg-black">
                {resultUrl ? (
                  <>
                    <div className="absolute z-10 right-3 top-3 md:hidden">
                      <button
                        onClick={() => setMobileShowAfterLocal(!mobileShowAfter)}
                        className="rounded-full bg-black/70 border border-white/15 px-3 py-1 text-[11px]"
                      >
                        {mobileShowAfter ? 'Show original' : 'Show result'}
                      </button>
                    </div>
                    <div className="hidden md:block w-full h-full">
                      <Comparison className="w-full h-full" mode="drag">
                        <ComparisonItem position="left">
                          <Image src={originalDataUrl} alt="Original" fill className="object-contain" sizes="(max-width: 1024px) 100vw, 50vw" priority />
                        </ComparisonItem>
                        <ComparisonItem position="right">
                          <Image src={resultUrl} alt="Result" fill className="object-contain" sizes="(max-width: 1024px) 100vw, 50vw" priority />
                        </ComparisonItem>
                        <ComparisonHandle>
                          <div className="relative z-50 flex items-center justify-center h-full w-12">
                            {mode === 'lovify' ? <Heart className="h-6 w-6 text-rose-400" /> : mode === 'jollyfy' ? <Sparkles className="h-6 w-6 text-amber-300" /> : <Ghost className="h-6 w-6 text-orange-500" />}
                          </div>
                        </ComparisonHandle>
                      </Comparison>
                    </div>
                    <div className="md:hidden w-full h-full">
                      <Image
                        src={mobileShowAfter ? resultUrl : originalDataUrl}
                        alt={mobileShowAfter ? 'Result' : 'Original'}
                        fill className="object-contain" sizes="100vw" priority
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
                    <div className="absolute inset-0 animate-shimmer" />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs border border-white/10">
                      Creating your design…
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                {resultUrl ? (
                  <button
                    onClick={goChooseProduct}
                    disabled={generating}
                    className="border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 rounded disabled:opacity-50"
                  >
                    Choose product
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>

        {/* RIGHT: Chat */}
        <section className="lg:col-span-2 flex flex-col gap-4 max-h-full overflow-y-auto">
          {/* Preset chips */}
          <div className="hidden md:flex flex-wrap gap-2">
            {presets.map((p) => (
              <button key={p} onClick={() => setInput(p)} className="px-3 py-1.5 text-xs md:text-sm rounded-full border border-white/10 bg-white/5 hover:bg-white/10">
                {p}
              </button>
            ))}
          </div>

          <div className="bg-gray-950 rounded-xl p-4 border border-white/10 flex-1 min-h-0">
            {!originalDataUrl && messages.length === 0 && cfg.needsPhoto ? (
              <div className="h-full grid place-items-center text-center text-white/70">
                <div>
                  <p className="font-medium mb-2">Start by uploading a photo</p>
                  <p className="text-sm">Then pick a vibe or type your own prompt.</p>
                </div>
              </div>
            ) : null}

            {messages.map((m, i) => (
              <div key={i} className={`mb-3 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`${m.role === 'user' ? 'bg-purple-700' : 'bg-gray-800'} inline-block px-3 py-2 rounded-lg whitespace-pre-wrap max-w-[90%]`}>
                  {m.content}
                </div>
              </div>
            ))}

            {(chatBusy || generating) && (
              <div className="mb-1 text-left">
                <span className="inline-flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg">
                  <span className="text-gray-300">{generating ? 'Creating your design…' : 'Thinking'}</span>
                  <span className="typing relative inline-block w-6">
                    <span className="dot" /><span className="dot" /><span className="dot" />
                  </span>
                </span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Tweak chips after generation */}
          {resultUrl && (
            <div className="bg-gray-950 rounded-xl p-3 border border-white/10">
              <div className="text-sm text-white/70 mb-2">Want changes? Try a quick tweak or type your own.</div>
              <div className="flex flex-wrap gap-2">
                {[
                  mode === 'spookify' ? 'Make it spookier (5)' : 'Make it bolder',
                  mode === 'jollyfy' ? 'Cozy lights + soft grain' : 'Softer palette',
                  mode === 'lovify' ? 'More romantic comic lines' : 'Add minimal line-art detail',
                  'Try moonlit blues palette',
                ].map((t) => (
                  <button key={t} onClick={() => { setInput(t); setTimeout(() => inputRef.current?.focus(), 0); }} className="px-3 py-1.5 text-xs rounded-full border border-white/10 bg-white/5 hover:bg-white/10">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Composer */}
          <Composer
            disabled={(cfg.needsPhoto && !originalDataUrl) || chatBusy || generating}
            value={input}
            setValue={setInput}
            onSend={send}
            inputRef={inputRef}
            placeholder={
              (cfg.needsPhoto && !originalDataUrl)
                ? 'Upload an image to begin'
                : `Tell me your vibe (e.g., ${cfg.vibePlaceholder})`
            }
          />

          {/* Generate bar */}
          {plan && !generating && (
            <div className="bg-gray-950 rounded-xl p-3 border border-white/10 sticky bottom-0">
              <button
                className="w-full px-4 py-2 rounded bg-white text-black hover:opacity-90 disabled:opacity-50"
                aria-busy={generating}
                disabled={!canGenerate}
                onClick={generate}
              >
                Use this plan → Generate
              </button>
            </div>
          )}

          {plan && !plan.orientation && (
            <div className="text-[13px] text-white/70">
              Pick an orientation to continue:{' '}
              <button onClick={() => setPlan(p => ({ ...p, orientation: 'Horizontal', targetAspect: 1.4 }))} className="underline">Horizontal</button>{' · '}
              <button onClick={() => setPlan(p => ({ ...p, orientation: 'Vertical', targetAspect: 0.7 }))} className="underline">Vertical</button>{' · '}
              <button onClick={() => setPlan(p => ({ ...p, orientation: 'Square', targetAspect: 1 }))} className="underline">Square</button>
            </div>
          )}
        </section>
      </div>

      {/* styling for shimmer/typing */}
      <style jsx>{`
        .typing .dot{display:inline-block;width:6px;height:6px;margin:0 1px;background:#cfcfe1;border-radius:50%;animation:bounce 1.2s infinite ease-in-out}
        .typing .dot:nth-child(2){animation-delay:.2s}.typing .dot:nth-child(3){animation-delay:.4s}
        @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-4px);opacity:1}}
        .animate-shimmer{position:absolute;inset:0;background:linear-gradient(to right,rgba(255,255,255,0) 0%,rgba(255,255,255,.08) 20%,rgba(255,255,255,.18) 50%,rgba(255,255,255,.08) 80%,rgba(255,255,255,0) 100%),radial-gradient(600px 300px at 30% 10%,rgba(255,106,43,.08),transparent 60%),radial-gradient(500px 250px at 70% 90%,rgba(139,115,255,.08),transparent 60%);background-repeat:no-repeat;transform:translateX(-100%);animation:shimmer-move 1.5s linear infinite;mix-blend-mode:screen}
        @keyframes shimmer-move{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
      `}</style>
    </main>
  );
}

/* ============== Composer subcomponent ============== */
function Composer({
  value,
  setValue,
  onSend,
  inputRef,
  disabled,
  placeholder,
}: {
  value: string;
  setValue: (v: string) => void;
  onSend: () => void | Promise<void>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  disabled: boolean;
  placeholder: string;
}) {
  const handleSend = () => {
    if (!disabled && value.trim()) void onSend();
  };
  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 pr-20 text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-60 resize-none"
        rows={2}
        style={{ maxHeight: 160 }}
        aria-label="Chat message"
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="absolute right-2 bottom-2 h-10 px-4 rounded-full bg-white text-black shadow disabled:opacity-50 inline-flex items-center gap-2 hover:opacity-90"
      >
        <Send className="h-4 w-4" />
        <span className="text-sm font-medium hidden md:inline">Send</span>
      </button>
    </div>
  );
}
