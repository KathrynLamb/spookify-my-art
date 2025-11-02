'use client';

import React, { useEffect, useRef, useState } from 'react';
import NextImage from 'next/image';
import { Ghost, Send, Sparkles, Image as ImageIcon } from 'lucide-react';
import { GeneratingOverlay } from '../components/GeneratingOverlay';

/* ========================== Types ========================== */
type Orientation = 'Horizontal' | 'Vertical' | 'Square';
type Region = 'GB' | 'US' | 'EU';
type Role = 'user' | 'assistant';

type PlanAutoResponse = {
  finalizedPrompt?: string;
  orientation?: Orientation;
  content?: string;
};

type StatusResponse =
  | { state: 'queued' | 'processing' }
  | { state: 'done'; previewUrl: string; resultUrl?: string }
  | { state: 'error'; error?: string };

type Msg = { role: Role; content: string; images?: string[] };

/* ========================== Config ========================== */
const SAMPLE_IMAGE = '/jollyfy/sample-image.png';

const CUT_OFFS: Record<Region, { standard: string; express: string }> = {
  GB: { standard: '18 Dec', express: '20 Dec' },
  US: { standard: '17 Dec', express: '20 Dec' },
  EU: { standard: '16 Dec', express: '19 Dec' },
};

const PRODUCT_RAIL = [
  { sku: 'POSTER-A2', name: 'Poster A2', from: 29, speed: 'Ships 24–48h', regionKey: 'standard' as const },
  { sku: 'FRAME-A3', name: 'Framed A3', from: 79, speed: 'Ships 2–4d', regionKey: 'standard' as const },
  { sku: 'CUSHION', name: 'Cushion', from: 32, speed: 'Ships 3–5d', regionKey: 'standard' as const },
  { sku: 'CAL-A4', name: 'Calendar A4', from: 22, speed: 'Ships 3–5d', regionKey: 'standard' as const },
  { sku: 'BOOK-LF', name: 'FlipWhizz Book', from: 45, speed: 'Ships 4–6d', regionKey: 'standard' as const },
];

const PRESETS = [
  { id: 'cozy', url: '/jollyfy/cozy-cute.png', label: 'Cozy-Cute ✨', orientation: 'Square' as const },
  { id: 'elves', url: '/jollyfy/elf-workshop.png', label: 'Elf Workshop 🛠️', orientation: 'Horizontal' as const },
  { id: 'snow', url: '/jollyfy/snow-globe.png', label: 'Snow-Globe ❄️', orientation: 'Vertical' as const },
];

/* ====================== Utility: JSON safe ====================== */
async function readJsonSafe<T = unknown>(res: Response): Promise<T | null> {
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (!ct.includes('application/json')) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ==================== Inline Comparison (no deps) ==================== */
function Comparison({
  left,
  right,
  className,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0.5);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const nx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      setX(nx);
    };
    const down = (e: PointerEvent) => {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      move(e);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ position: 'relative', touchAction: 'none', userSelect: 'none', borderRadius: 16 }}
      aria-label="Before-after comparison"
    >
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 16 }}>
        <div style={{ position: 'absolute', inset: 0 }}>{right}</div>
        <div style={{ position: 'absolute', inset: 0, width: `${x * 100}%`, overflow: 'hidden' }}>{left}</div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${x * 100}%`,
          transform: 'translateX(-50%)',
          width: 2,
          background: 'rgba(255,255,255,.7)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: `${x * 100}%`,
          transform: 'translate(-50%,-50%)',
          background: 'rgba(0,0,0,.55)',
          border: '1px solid rgba(255,255,255,.35)',
          borderRadius: 999,
          padding: 6,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Ghost className="h-5 w-5 text-white" />
      </div>
    </div>
  );
}

/* ====================== Helpers (browser-safe) ====================== */
async function decodeToCanvas(blobOrFile: Blob, maxDim: number) {
  try {

    const bmp: ImageBitmap = await createImageBitmap(blobOrFile);
    const scale = Math.min(maxDim / bmp.width, maxDim / bmp.height, 1);
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
 
    if (typeof (bmp as unknown as { close?: () => void }).close === 'function') {
      (bmp as unknown as { close: () => void }).close();
    }
    return canvas;
  } catch {
    const url = URL.createObjectURL(blobOrFile);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Image decode failed'));
        el.src = url;
      });
      const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      return canvas;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
async function fileToResizedDataUrl(file: File, maxDim = 1280, quality = 0.9): Promise<string> {
  const canvas = await decodeToCanvas(file, maxDim);
  return canvas.toDataURL('image/jpeg', quality);
}
async function fileToResizedBlob(file: File, maxDim = 2000, quality = 0.86): Promise<Blob> {
  const canvas = await decodeToCanvas(file, maxDim);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', quality);
  });
}

/* ============================== Page ============================== */
export default function JollyfyDesignClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [region, setRegion] = useState<Region>('GB');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPreset, setSelectedPreset] = useState<(typeof PRESETS)[number] | null>(null);
  const [finalizedPrompt, setFinalizedPrompt] = useState<string>('');
  const [orientation, setOrientation] = useState<Orientation | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatBusy, generating]);

  const dates = CUT_OFFS[region];

  /* ---------------- Upload handlers ---------------- */
  const setFromFile = async (file: File) => {
    try {
      setError(null);
      setResultUrl(null);
      setMessages([]);
      setSelectedPreset(null);
      setFinalizedPrompt('');
      setOrientation(null);

      const isHeic = file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic';
      if (isHeic) {
        const { convertHEICtoJPG } = await import('@/lib/convertHEICtoJPG');
        file = await convertHEICtoJPG(file);
      }
      if (!file.type.startsWith('image/')) return;

      const chatDataUrl = await fileToResizedDataUrl(file, 1280, 0.9);
      setOriginalDataUrl(chatDataUrl);
      setPreviewUrl(chatDataUrl);

      const resizedBlob = await fileToResizedBlob(file, 2000, 0.86);
      const uploadFile = new File([resizedBlob], file.name.replace(/\.[^.]+$/, '') + '-web.jpg', {
        type: 'image/jpeg',
      });

      const fd = new FormData();
      fd.append('file', uploadFile);

      let res = await fetch('/api/upload-original', { method: 'POST', body: fd });
      let data = await readJsonSafe<{ imageId?: string; fileUrl?: string; error?: string }>(res);

      // Retry path if server replied non-JSON (rare)
      if ((!res.ok || !data?.imageId || !data.fileUrl) && res.status === 413) {
        const tinyDataUrl = await fileToResizedDataUrl(file, 1400, 0.84);
        res = await fetch('/api/upload-original', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl: tinyDataUrl }),
        });
        data = await readJsonSafe<{ imageId?: string; fileUrl?: string; error?: string }>(res);
      }

      if (!res.ok || !data?.imageId || !data.fileUrl) {
        throw new Error(data?.error || 'Upload failed');
      }

      setImageId(data.imageId);

      // Auto-plan immediately
      await autoPlan('cozy');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      // removed console.error to avoid needing eslint-disable
    }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void setFromFile(f);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) void setFromFile(f);
  };

  /* ---------------- Auto-plan (no typing required) ---------------- */
  async function autoPlan(presetId: (typeof PRESETS)[number]['id']) {
    if (!imageId && !originalDataUrl) return;
    setChatBusy(true);
    try {
      const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
      setSelectedPreset(preset);

      let plan: PlanAutoResponse | null = null;
      try {
        const res = await fetch('/api/plan/auto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ presetId }),
        });
        plan = await readJsonSafe<PlanAutoResponse>(res);
      } catch {
        // ignore; fallback below
      }

      const prompt =
        plan?.finalizedPrompt ??
        (presetId === 'cozy'
          ? 'cozy festive glow, soft candlelight, gentle twinkle lights, family-friendly, no blood'
          : presetId === 'elves'
          ? "elves' workshop, warm wood tones, garlands, festive hats, cheerful, no blood"
          : 'snow-globe sparkle, soft snow, winter night, warm bokeh lights, storybook, no blood');

      setFinalizedPrompt(prompt);
      setOrientation(plan?.orientation ?? preset.orientation);
    } finally {
      setChatBusy(false);
    }
  }

  /* ---------------- Optional Chat ---------------- */
  async function sendChat() {
    if (!input.trim() || !imageId || generating) return;
    setChatBusy(true);
    const userText = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: userText }]);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: imageId,
          messages: [...messages, { role: 'user', content: userText }],
          mode: 'jollyfy',
        }),
      });
      const data = await readJsonSafe<{ finalizedPrompt?: string; content?: string }>(res);
      if (data?.finalizedPrompt) setFinalizedPrompt(data.finalizedPrompt);
      setMessages((m) => [...m, { role: 'assistant', content: data?.content || 'Plan updated.' }]);
    } catch {
      setError('Chat failed. Please try again.');
    } finally {
      setChatBusy(false);
    }
  }

  /* ---- simple poll helper with backoff ---- */
  async function pollStatus(jobId: string, opts?: { timeoutMs?: number }) {
    const timeoutMs = opts?.timeoutMs ?? 60_000;
    const start = Date.now();
    let delay = 600;

    for (;;) {
      const res = await fetch(`/api/spookify/status?id=${encodeURIComponent(jobId)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      const status = await readJsonSafe<StatusResponse>(res);

      if (!res.ok) {
        const msg =
          (status && 'error' in status && (status.error || 'status error')) || `status failed (${res.status})`;
        throw new Error(msg);
      }

      if (status && 'state' in status) {
        if (status.state === 'done' && 'previewUrl' in status) return status.previewUrl;
        if (status.state === 'error') {
          throw new Error('error' in status ? status.error || 'Generation failed' : 'Generation failed');
        }
      }

      if (Date.now() - start > timeoutMs) throw new Error('Generation timed out');
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(3000, Math.round(delay * 1.4));
    }
  }

  /* ---------------- Generate ---------------- */
  async function generate() {
    if (!imageId) return setError('Please upload a photo first.');
    if (!orientation) return setError('Pick an orientation.');

    setGenerating(true);
    setError(null);
    setResultUrl(null);

    const prompt =
      finalizedPrompt ||
      'transform this photo, keeping the people looking exactly the same, so they are recognisable, but transformed into elves working in Santas workshop.';

    try {
      const res = await fetch('/api/spookify/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: imageId, promptOverride: prompt, orientation }),
        cache: 'no-store',
      });
      const data = await readJsonSafe<{ jobId?: string; error?: string }>(res);
      if (!res.ok || !data?.jobId) {
        throw new Error(data?.error || `begin failed (${res.status})`);
      }

      const preview = await pollStatus(data.jobId, { timeoutMs: 180_000 });
      setResultUrl(preview);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  /* ----------------- Try sample image ----------------- */
  async function trySample() {
    setPreviewUrl(SAMPLE_IMAGE);
    setOriginalDataUrl(SAMPLE_IMAGE);
    setImageId('sample');
    setMessages([]);
    await autoPlan('cozy');
  }

  const bannerText = `🎄 Order by ${dates.standard} (Standard) • ${dates.express} (Express)`;
  const canGenerate = !!originalDataUrl && !!orientation;

  return (
    <main className="relative min-h-screen bg-[#0b090a] text-white">
      {/* Sticky order-by banner */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Jollyfy</span>
            <span className="opacity-70">•</span>
            <span className="opacity-90">{bannerText}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="opacity-70" htmlFor="region">
              Region
            </label>
            <select
              id="region"
              className="rounded px-2 py-1 text-sm bg-white/10 border border-white/20"
              value={region}
              onChange={(e) => setRegion(e.target.value as Region)}
              aria-label="Select shipping region"
            >
              <option value="GB">UK</option>
              <option value="US">USA</option>
              <option value="EU">EU</option>
            </select>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="pt-8 pb-4 text-center">
        <h1 className="text-3xl font-bold md:text-4xl">Jollyfy Your Art</h1>
        <p className="mt-1 text-white/70">Upload → Chat → Generate → Print</p>
        <div className="mt-1 text-xs text-white/60">Tip: mention outfits, palette, or props you want added.</div>
      </header>

      {error && (
        <div className="mx-auto mb-4 max-w-2xl rounded bg-red-900/30 px-3 py-2 text-center text-red-200 ring-1 ring-red-600/40">
          {error}
        </div>
      )}

      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 md:grid-cols-2 md:px-6">
        {/* LEFT: Upload / Preview / Comparison */}
        <section onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
          {!previewUrl ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Upload card */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-white/20 bg-black/30 p-6 text-center backdrop-blur-sm transition hover:border-white/40"
              >
                <ImageIcon className="mx-auto h-6 w-6 opacity-80" />
                <p className="mt-2 text-white/80">Click or drag & drop an image</p>
                <p className="mt-1 text-xs text-white/40">JPG, PNG (HEIC needs converting)</p>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
              </div>

              {/* Sample card */}
              <button
                onClick={trySample}
                className="rounded-2xl border border-white/15 bg-white/5 p-6 text-left transition hover:bg-white/10"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Sparkles className="h-5 w-5" /> Try a sample photo
                </div>
                <p className="mt-1 text-sm text-white/70">See the magic in 10 seconds — no upload needed.</p>
                <div className="mt-3 overflow-hidden rounded-lg ring-1 ring-white/10">
                  <div className="relative h-32 w-full">
                    <NextImage
                      src={SAMPLE_IMAGE}
                      alt="Sample"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                      priority
                    />
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <>
              {!resultUrl ? (
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#0b0b0b] ring-1 ring-white/10">
                  <div className="absolute inset-0">
                    <NextImage
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      unoptimized
                    />
                  </div>
                  {generating && <GeneratingOverlay />}
                </div>
              ) : (
                <Comparison
                  className="aspect-square w-full overflow-hidden"
                  left={
                    <div className="relative h-full w-full">
                      <NextImage
                        src={previewUrl}
                        alt="Original"
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        unoptimized
                      />
                    </div>
                  }
                  right={
                    <div className="relative h-full w-full">
                      <NextImage
                        src={resultUrl}
                        alt="Jollyfied"
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        unoptimized
                      />
                    </div>
                  }
                />
              )}
            </>
          )}
        </section>

        {/* RIGHT: Presets / Generate / Product rail / Chat */}
        <section className="flex flex-col gap-4">
          {/* Presets (show after preview available) */}
          {originalDataUrl ? (
            <div>
              <div className="mb-2 text-sm text-white/80">Pick a festive style</div>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => autoPlan(p.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      selectedPreset?.id === p.id
                        ? 'border-emerald-500 bg-emerald-600'
                        : 'border-white/15 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Orientation */}
              <div className="mt-3 text-sm text-white/80">Orientation</div>
              <div className="mt-2 flex gap-2">
                {(['Horizontal', 'Vertical', 'Square'] as const).map((o) => (
                  <button
                    key={o}
                    onClick={() => setOrientation(o)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      orientation === o ? 'border-white/30 bg-white/20' : 'border-white/15 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>

              {/* Generate */}
              <button
                onClick={generate}
                disabled={!canGenerate || generating}
                className="mt-4 w-full rounded-lg bg-gradient-to-r from-emerald-600 to-green-500 py-2 font-medium disabled:opacity-50 hover:opacity-90"
              >
                {generating ? 'Generating…' : `Generate with ${selectedPreset?.label ?? 'style'}`}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">
              Upload a photo or try the sample to unlock styles and Generate.
            </div>
          )}

          {/* Product rail (shows once we have any image) */}
          {(previewUrl || resultUrl) && (
            <div className="mt-1">
              <div className="mb-2 text-sm text-white/80">Popular gifts</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {PRODUCT_RAIL.map((p) => (
                  <button key={p.sku} className="rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{p.name}</div>
                      <div className="font-semibold text-emerald-300">from £{p.from}</div>
                    </div>
                    <div className="mt-1 text-xs text-white/70">
                      {p.speed} • Order by {CUT_OFFS[region][p.regionKey]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat (optional helper) */}
          <div className="mt-1">
            <div className="mb-1 text-sm text-white/80">Fine-tune with chat (optional)</div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-full px-4 py-2 text-sm text-black"
                placeholder='e.g. “Add matching sweaters, warm candlelight, no blood”'
                value={input}
                disabled={chatBusy || !imageId}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              />
              <button
                onClick={sendChat}
                disabled={chatBusy || !input.trim() || !imageId}
                className="rounded-full bg-emerald-600 p-3 text-white hover:bg-emerald-500"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2">
              {messages.length === 0 ? (
                <div className="text-sm text-white/60">Your conversation will appear here.</div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`mb-1 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <span
                      className={`inline-block rounded-lg px-3 py-1 text-sm ${
                        m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white/10'
                      }`}
                    >
                      {m.content}
                    </span>
                  </div>
                ))
              )}
              {(chatBusy || generating) && <div className="animate-pulse text-sm text-white/60">Thinking…</div>}
              <div ref={chatEndRef} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
