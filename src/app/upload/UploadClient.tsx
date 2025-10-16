// src/app/upload/UploadClient.tsx
'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Ghost } from 'lucide-react';
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
  fileUrl: string; // may be data: URL; we'll normalize
  lemon?: boolean;
};

type Plan = {
  spookiness?: number;
  vibe?: string;
  elements?: string[];
  palette?: string;
  avoid?: string[];
  textOverlay?: string;
  finalizedPrompt?: string;
} | null;

type ChatResponse = {
  content: string;
  plan?: Plan;
  finalizedPrompt?: string;
};

const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true';

/* ======================= Utils ======================= */
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
  const finalizedPrompt = useMemo(
    () => (plan?.finalizedPrompt ?? ''),
    [plan]
  );

  // generation state
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // product selection handoff (design-first path)
  const [pending, setPending] = useState<PendingSelection | null>(null);

  // Refs for UX improvements
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-id for dev
  useEffect(() => {
    if (!imageId) setImageId(`dev-${Date.now()}`);
  }, [imageId]);

  // Load pending product from design-first flow
  useEffect(() => {
    try {
      const raw = localStorage.getItem('spookify:pending-product');
      if (raw) setPending(JSON.parse(raw) as PendingSelection);
    } catch {
      /* no-op */
    }
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // --- API helpers ---
  const refreshPlanFromServer = async (id: string) => {
    try {
      const r = await fetch(`/api/get-plan?id=${encodeURIComponent(id)}`);
      if (!r.ok) return;
      const j = (await r.json()) as { plan?: Plan };
      if (j?.plan) setPlan(j.plan);
    } catch {
      /* no-op */
    }
  };

  const postChat = async (msgs: Msg[]): Promise<ChatResponse> => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: imageId, messages: msgs }),
    });
    const data = (await res.json()) as ChatResponse & { error?: string };
    if (!res.ok) throw new Error(data.error || 'Chat failed');
    return data;
  };

  // --- Auto scroll to bottom on new messages or state changes ---
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, chatBusy, generating]);

  // --- Expand textarea as user types ---
  const autoResize = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = Math.min(Math.max(el.scrollHeight, 40), 160) + 'px';
  };
  useEffect(() => {
    autoResize();
  }, [input]);

  // --- Upload flow -> triggers FIRST chat message with image ---
  // const setFromFile = async (file: File) => {
  //   try {
  //     let f = file;

  //     if (f.name.toLowerCase().endsWith('.heic') || f.type === 'image/heic') {
  //       const { convertHEICtoJPG } = await import('@/lib/convertHEICtoJPG');
  //       f = await convertHEICtoJPG(f);
  //     }

  //     if (!f.type.startsWith('image/')) return;
  //     setError(null);
  //     setSpookified(null);
  //     setPlan(null);
  //     setMessages([]);

  //     const blobUrl = URL.createObjectURL(f);
  //     setPreviewUrl(blobUrl);

  //     const dataUrl = await fileToResizedDataUrl(f, 1280, 0.9);
  //     setOriginalDataUrl(dataUrl);

  //     const res = await fetch('/api/store-image', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ dataUrl }),
  //     });
  //     const j = (await res.json()) as { id: string; error?: string };
  //     if (!res.ok) {
  //       setError(j.error || 'Upload failed');
  //       return;
  //     }
  //     const newId = j.id;
  //     setImageId(newId);

  //     // ✅ Friendly assistant nudge only
  //     setMessages([
  //       {
  //         role: 'assistant',
  //         content:
  //           'Great pic! How do you want to spookify it? (e.g., cozy-cute, spookiness 3, fog + tiny ghost, moonlit blues, no blood)',
  //       },
  //     ]);

  //     await refreshPlanFromServer(newId);
  //   } catch (e) {
  //     setError(e instanceof Error ? e.message : String(e));
  //   } finally {
  //     setChatBusy(false);
  //   }
  // };

  // in UploadClient.tsx

// REMOVE this dev auto-id; the server should be the source of truth
// useEffect(() => { if (!imageId) setImageId(`dev-${Date.now()}`); }, [imageId]);

const setFromFile = async (file: File) => {
  try {
    let f = file
    if (f.name.toLowerCase().endsWith('.heic') || f.type === 'image/heic') {
      const { convertHEICtoJPG } = await import('@/lib/convertHEICtoJPG')
      f = await convertHEICtoJPG(f)
    }
    if (!f.type.startsWith('image/')) return

    setError(null)
    setSpookified(null)
    setPlan(null)
    setMessages([])

    // fast local preview
    const blobUrl = URL.createObjectURL(f)
    setPreviewUrl(blobUrl)
    const dataUrl = await fileToResizedDataUrl(f, 1280, 0.9) // UI only
    setOriginalDataUrl(dataUrl)

    // ⬇️ Upload the ORIGINAL to Blob; server returns canonical imageId + fileUrl
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload-original', { method: 'POST', body: fd })
    const { imageId, fileUrl, metaUrl, error } = await res.json()
    console.log(imageId, fileUrl, metaUrl, error)
    // fd.append('finalizedPrompt', '')


    const j = await res.json() as { imageId?: string; fileUrl?: string; error?: string }
    if (!res.ok || !j.imageId) { setError(j.error || 'Upload failed'); return }

    setImageId(j.imageId)

    // Friendly first assistant nudge
    setMessages([
      { role: 'assistant',
        content: 'Great pic! How do you want to spookify it? (e.g., cozy-cute, spookiness 3, fog + tiny ghost, moonlit blues, no blood)' }
    ])

    await refreshPlanFromServer(j.imageId)
  } catch (e) {
    setError(e instanceof Error ? e.message : String(e))
  } finally {
    setChatBusy(false)
  }
}


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void setFromFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) void setFromFile(f);
  };

  // --- Subsequent chat sends ---
  const send = async () => {
    if (!input.trim() || !imageId || generating) return;

    const userText = input.trim();

    // If no prior USER message with an image exists, attach the uploaded image
    const noUserImageYet =
      !messages.some((m) => m.role === 'user' && Array.isArray(m.images) && m.images.length > 0);
    const shouldAttachImage = !!originalDataUrl && noUserImageYet;

    const userMessage: Msg = {
      role: 'user',
      content: userText,
      images: shouldAttachImage ? [originalDataUrl!] : undefined,
    };

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

  // --- Generation ---
  const generate = async () => {
    if (!imageId) {
      setError('Please upload an image first');
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/spookify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: imageId, promptOverride: finalizedPrompt || undefined }),
      });
      const data = (await res.json()) as { previewDataUrl?: string; spookyImage?: string; error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to spookify');
      setSpookified(data.previewDataUrl ?? data.spookyImage ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

  // --- Legacy Print handoff (no design-first) -> go choose product ---
  const goChooseProduct = async () => {
    try {
      if (!spookified) {
        setError('No spookified image found. Generate first.');
        return;
      }
      if (!imageId) {
        setError('Missing image id.');
        return;
      }
      let fileUrl = spookified;
      if (!isHttpUrl(spookified)) {
        fileUrl = await ensurePublicUrl(spookified, imageId);
      }
      const qp = new URLSearchParams({ fileUrl, imageId });
      router.push(`/products?${qp.toString()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  // --- Design-first direct print using saved selection ---
  const printWithPending = async () => {
    try {
      if (!spookified || !pending) {
        alert('Please generate your spookified image first.');
        return;
      }

      const useId: string = pending.imageId || imageId || `img-${Date.now()}`;
      console.log("USEID", useId)
      const publicUrl = await ensurePublicUrl(spookified, useId);
      console.log("publicUrl", publicUrl)
      if (!publicUrl) {
        alert('Failed to upload or resolve your spookified image.');
        return;
      }
      if (!pending.variant?.productUid) {
        alert('Missing SKU — please reselect your product.');
        return;
      }
      console.log("pending.variant?.productUid", pending.variant?.productUid)
      // if (pending.lemon) {
      //   localStorage.setItem(
      //     'spookify:last-order',
      //     JSON.stringify({
      //       product: pending.productTitle || 'Haunted Halloween Print',
      //       thumbUrl: publicUrl,
      //     })
      //   );
      //   localStorage.removeItem('spookify:pending-product');
      //   window.open(
      //     'https://spookify-my-art.lemonsqueezy.com/buy/3c829174-dc02-4428-9123-7652026e6bbf',
      //     '_blank'
      //   );
      //   return;
      // }

      if (PAYMENTS_ENABLED) {
        const titleSuffix =
          pending.titleSuffix ||
          `${pending.variant.sizeLabel}${
            pending.variant.frameColor ? ` – ${pending.variant.frameColor}` : ''
          } – ${pending.variant.orientation}`;

        const priceMajor =
          pending.variant.prices[pending.currency] ??
          pending.variant.prices.GBP ??
          0;
          console.log("fileUrl ===>>", publicUrl, imageId, pending.variant.productUid, pending, priceMajor,  )
        const r = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUrl: publicUrl,
            imageId: useId,
            sku: pending.variant.productUid,
            title: `${pending.productTitle} – ${titleSuffix}`,
            price: Math.round(priceMajor * 100),
            priceIsMajor: false,
            currency: pending.currency,
          }),
        });

        console.log("R ===>>", r)

        const j = (await r.json()) as { url?: string; error?: string };
        if (!r.ok || !j?.url) {
          alert(j?.error || 'Checkout failed');
          return;
        }

        localStorage.removeItem('spookify:pending-product');
        window.location.href = j.url;
      } else {
        const payload = {
          email: '',
          product: pending.productTitle,
          sizeLabel: pending.variant.sizeLabel,
          orientation: pending.variant.orientation,
          frameColor: pending.variant.frameColor ?? null,
          fileUrl: publicUrl,
          imageId: useId,
          currency: pending.currency,
        };
        localStorage.setItem('spookify:manual-draft', JSON.stringify(payload));
        localStorage.removeItem('spookify:pending-product');
        router.push(`/products?fileUrl=${encodeURIComponent(publicUrl)}&imageId=${useId}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">Spookify Your Art 👻</h1>
      <p className="text-center text-gray-400 mb-6">
        Upload, chat about the vibe, then generate — all on one page.
      </p>

      {pending ? (
        <div className="animate-[fade-in_0.4s_ease-out] mb-6 max-w-lg mx-auto bg-orange-600/10 border border-orange-600/30 text-orange-200 text-sm md:text-base px-4 py-3 rounded-xl text-center shadow-sm">
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

      {error ? <p className="text-red-400 text-center mb-4">{error}</p> : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* LEFT: Upload + Preview + Result */}
        <div className="lg:col-span-1 space-y-4">
          {!spookified && !originalDataUrl ? (
            <div
              className="border-2 border-dashed border-white/20 rounded-xl p-6 bg-gray-950 text-center cursor-pointer hover:border-white/40 transition"
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
                <div className="relative w-full aspect-square">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-contain rounded-md"
                  />
                </div>
              ) : (
                <p className="text-gray-400">Click or drag & drop your image here</p>
              )}
            </div>
          ) : null}

          {originalDataUrl ? (
            <div className="bg-gray-950 rounded-xl p-4 border border-white/10">
              <div className="relative w-full aspect-square border border-white/10 rounded overflow-hidden bg-black">
                {/* Comparison slider appears only when we have BOTH images */}
                {spookified ? (
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

                {/* Shimmer overlay while generating */}
                {generating ? (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
                    <div className="absolute inset-0 animate-shimmer" />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs border border-white/10">
                      Spookifying your image…
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
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
                      className="bg-purple-700 hover:bg-purple-600 px-4 py-2 rounded disabled:opacity-50"
                    >
                      Print with selected product
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* RIGHT: Chat + Generate */}
        <div className="lg:col-span-2 space-y-4">
          <div
            ref={chatScrollRef}
            className="bg-gray-950 rounded-xl p-4 border border-white/10 h-[420px] overflow-y-auto"
          >
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

          {/* Expanding input */}
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!chatBusy && !generating && imageId && input.trim()) {
                    void send();
                  }
                }
              }}
              placeholder={
                originalDataUrl
                  ? 'Tell me your vibe (e.g., cozy cute, spookiness 3, fog + tiny ghost, moonlit blues, no blood)'
                  : 'Upload an image to begin the séance 👻'
              }
              className="flex-1 px-3 py-2 rounded bg-gray-900 border border-white/10 outline-none disabled:opacity-60 resize-none leading-6"
              disabled={!originalDataUrl || chatBusy || generating}
              rows={2}
              style={{ maxHeight: 160 }}
            />
            <button
              onClick={send}
              disabled={chatBusy || generating || !imageId || !originalDataUrl || !input.trim()}
              className="px-4 py-2 rounded bg-white text-black hover:bg-orange-300 disabled:opacity-50"
            >
              Send
            </button>
          </div>

          <div className="bg-gray-950 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              {plan ? (
                <button
                  onClick={generate}
                  disabled={generating || !imageId}
                  className="px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-500 disabled:opacity-50"
                >
                  Use this plan → Generate
                </button>
              ) : (
                <p className="text-gray-400 text-sm">
                  Upload your image & tell me your vibe — I’ll craft the plan and then you can
                  generate.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

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
        .typing .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          40% {
            transform: translateY(-4px);
            opacity: 1;
          }
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
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </main>
  );
}
