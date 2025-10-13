// 'use client'

// export const dynamic = 'force-dynamic'
// export const revalidate = 0

// import { useEffect, useRef, useState, useMemo } from 'react'
// import Image from 'next/image'

// import { Ghost } from 'lucide-react';
// import {
//   Comparison,
//   ComparisonItem,
//   ComparisonHandle,
// } from '@/components/ui/shadcn-io/comparison/index';


// type Role = 'user' | 'assistant'
// type Msg = { role: Role; content: string; images?: string[] }

// function extractConfigFrom(text: string) {
//   let m = text.match(/```json\s*([\s\S]*?)\s*```/i)
//   if (!m) m = text.match(/```\s*([\s\S]*?)\s*```/)
//   if (!m) {
//     const all = text.match(/\{[\s\S]*\}/g)
//     if (all && all.length) m = ['', all[all.length - 1]] as unknown as RegExpMatchArray
//   }
//   if (!m) return null
//   try { return JSON.parse(m[1]) } catch { return null }
// }

// async function fileToResizedDataUrl(file: File, maxDim = 1024, quality = 0.88): Promise<string> {
//   const bitmap = await createImageBitmap(file)
//   const scale = Math.min(maxDim / bitmap.width, maxDim / bitmap.height, 1)
//   const w = Math.round(bitmap.width * scale)
//   const h = Math.round(bitmap.height * scale)
//   const canvas = document.createElement('canvas')
//   canvas.width = w; canvas.height = h
//   const ctx = canvas.getContext('2d')!
//   ctx.drawImage(bitmap, 0, 0, w, h)
//   return canvas.toDataURL('image/jpeg', quality)
// }

// export default function UploadWithChatPage() {
//   const fileInputRef = useRef<HTMLInputElement>(null)

//   const [spookified, setSpookified] = useState<string | null>(null)
//   const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null)
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null)
//   const [imageId, setImageId] = useState<string | null>(null)

//   // chat
//   const [messages, setMessages] = useState<Msg[]>([])
//   const [input, setInput] = useState('')
//   const [chatBusy, setChatBusy] = useState(false)
//   const [plan, setPlan] = useState<Record<string, unknown> | null>(null)
//   const finalizedPrompt = useMemo(
//     () => (plan as { finalizedPrompt?: string } | null)?.finalizedPrompt ?? '',
//     [plan]
//   )

//   const isHttpUrl = (s: string) => /^https?:\/\//i.test(s)

//   useEffect(() => {
//     if (!imageId) setImageId(`dev-${Date.now()}`)
//   }, [imageId])

//   // generation
//   const [generating, setGenerating] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [showSpooky, setShowSpooky] = useState(true)

//   // print
//   const [printing] = useState(false)
//   const [size, setSize] = useState<'A4' | 'A3' | 'A2' | '50x70'>('50x70')

//   useEffect(() => {
//     return () => {
//       if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
//     }
//   }, [previewUrl])

//   // --- API helpers ---
//   const refreshPlanFromServer = async (id: string) => {
//     try {
//       const r = await fetch(`/api/get-plan?id=${encodeURIComponent(id)}`)
//       if (!r.ok) return
//       const j = await r.json()
//       if (j?.plan) setPlan(j.plan)
//     } catch { /* no-op */ }
//   }

//   const postChat = async (msgs: Msg[]) => {
//     const res = await fetch('/api/chat', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ id: imageId, messages: msgs }),
//     })
//     const data = await res.json()
//     if (!res.ok) throw new Error(data.error || 'Chat failed')
//     return data as { content: string; plan?: Record<string, unknown>; finalizedPrompt?: string }
//   }

//   // --- Upload flow -> triggers FIRST chat message with image ---
//   const setFromFile = async (file: File) => {
//     try {
//       let f = file

//       // Detect HEIC (dynamic import to avoid SSR eval)
//       if (f.name.toLowerCase().endsWith('.heic') || f.type === 'image/heic') {
//         const { convertHEICtoJPG } = await import('@/lib/convertHEICtoJPG')
//         f = await convertHEICtoJPG(f)
//       }

//       if (!f.type.startsWith('image/')) return
//       setError(null)
//       setSpookified(null)
//       setPlan(null)
//       setShowSpooky(true)
//       setMessages([])

//       const blobUrl = URL.createObjectURL(f)
//       setPreviewUrl(blobUrl)

//       const dataUrl = await fileToResizedDataUrl(f, 1280, 0.9)
//       setOriginalDataUrl(dataUrl)

//       // Persist for your pipeline
//       const res = await fetch('/api/store-image', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ dataUrl }),
//       })
//       const j = await res.json()
//       if (!res.ok) { setError(j.error || 'Upload failed'); return }
//       const newId = j.id as string
//       setImageId(newId)

//       // Kick off the initial chat
//       setChatBusy(true)
//       const initial: Msg = {
//         role: 'user',
//         content: "Here's my image — excited to spookify it!",
//         images: [dataUrl],
//       }
//       const nextMsgs = [initial]
//       setMessages(nextMsgs)

//       const data = await postChat(nextMsgs)
//       const assistantMsg: Msg = { role: 'assistant', content: data.content }
//       setMessages(prev => [...prev, assistantMsg])

//       if (data.plan) setPlan(data.plan)
//       else {
//         const cfg = extractConfigFrom(assistantMsg.content)
//         if (cfg) setPlan(cfg)
//       }
//       await refreshPlanFromServer(newId)
//     } catch (e) {
//       setError(e instanceof Error ? e.message : String(e))
//     } finally {
//       setChatBusy(false)
//     }
//   }

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const f = e.target.files?.[0]
//     if (f) void setFromFile(f)
//   }

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault()
//     const f = e.dataTransfer.files?.[0]
//     if (f) void setFromFile(f)
//   }

//   // --- Subsequent chat sends ---
//   const send = async () => {
//     if (!input.trim() || !imageId) return
//     const userMessage: Msg = { role: 'user', content: input.trim() }
//     const newMsgs = [...messages, userMessage]
//     setMessages(newMsgs)
//     setInput('')
//     setChatBusy(true)
//     setError(null)
//     try {
//       const data = await postChat(newMsgs)
//       const assistantMsg: Msg = { role: 'assistant', content: data.content }
//       setMessages(prev => [...prev, assistantMsg])
//       if (data.plan) setPlan(data.plan)
//       else {
//         const cfg = extractConfigFrom(assistantMsg.content)
//         if (cfg) setPlan(cfg)
//       }
//       await refreshPlanFromServer(imageId)
//     } catch (e) {
//       setError(e instanceof Error ? e.message : String(e))
//     } finally {
//       setChatBusy(false)
//     }
//   }

//   // --- Generation ---
//   const generate = async () => {
//     if (!imageId) { setError('Please upload an image first'); return }
//     setGenerating(true)
//     setError(null)
//     try {
//       const res = await fetch('/api/spookify', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ id: imageId, promptOverride: finalizedPrompt || undefined }),
//       })
//       const data = await res.json()
//       if (!res.ok) throw new Error(data.error || 'Failed to spookify')
//       setSpookified(data.previewDataUrl ?? data.spookyImage)
//     } catch (e) {
//       setError(e instanceof Error ? e.message : String(e))
//     } finally {
//       setGenerating(false)
//     }
//   }

//   // --- Print handoff ---
//   const selectProduct = async () => {
//     try {
//       if (!spookified) { setError('No spookified image found. Generate first.'); return }
//       if (!imageId) { setError('Missing image id.'); return }

//       let fileUrl = spookified
//       if (!isHttpUrl(spookified)) {
//         const upRes = await fetch('/api/upload-spooky', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ dataUrl: spookified, filename: `spookified-${imageId}.png` }),
//         })
//         const upJson: { url?: string; error?: string } = await upRes.json()
//         if (!upRes.ok || !upJson?.url) throw new Error(upJson.error || 'Upload failed')
//         fileUrl = upJson.url
//       }

//       const qp = new URLSearchParams({ fileUrl, imageId })
//       window.location.href = `/products?${qp.toString()}`
//     } catch (e) {
//       setError(e instanceof Error ? e.message : String(e))
//     }
//   }

//   return (
//     <main className="min-h-screen bg-black text-white p-4 md:p-8">
//       <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">Spookify Your Art 👻</h1>
//       <p className="text-center text-gray-400 mb-6">Upload, chat about the vibe, then generate — all on one page.</p>

//       {error && <p className="text-red-400 text-center mb-4">{error}</p>}

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
//         {/* LEFT: Upload + Preview + Result */}
//         <div className="lg:col-span-1 space-y-4">
//           {!spookified && (
//             <div
//               className="border-2 border-dashed border-white/20 rounded-xl p-6 bg-gray-950 text-center cursor-pointer hover:border-white/40 transition"
//               onClick={() => fileInputRef.current?.click()}
//               onDragOver={(e) => e.preventDefault()}
//               onDrop={handleDrop}
//             >
//               <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
//               {previewUrl ? (
//                 <div className="relative w-full aspect-square">
//                   <Image src={previewUrl} alt="Preview" fill className="object-contain rounded-md" />
//                 </div>
//               ) : (
//                 <p className="text-gray-400">Click or drag & drop your image here</p>
//               )}
//             </div>
//           )}

//             {originalDataUrl && spookified && (
//                 <div className="bg-gray-950 rounded-xl p-4 border border-white/10">
//                     <div className="relative w-full aspect-square border border-white/10 rounded overflow-hidden bg-black">
//                     <Comparison className="w-full h-full" mode="drag">
//                         <ComparisonItem position="left">
//                         <Image
//                             src={originalDataUrl}
//                             alt="Original"
//                             fill
//                             className="object-contain"
//                             sizes="(max-width: 1024px) 100vw, 50vw"
//                             priority
//                         />
//                         </ComparisonItem>
//                         <ComparisonItem position="right">
//                         <Image
//                             src={spookified}
//                             alt="Spookified"
//                             fill
//                             className="object-contain"
//                             sizes="(max-width: 1024px) 100vw, 50vw"
//                             priority
//                         />
//                         </ComparisonItem>
//                         <ComparisonHandle>
//                         {/* Use a ghost or smoke effect here if desired */}
//                         <div className="relative z-50 flex items-center justify-center h-full w-12">
//                             <Ghost className="h-6 w-6 text-orange-500 drop-shadow-md" />
//                         </div>
//                         </ComparisonHandle>
//                     </Comparison>
//                     </div>

//               <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
//                 {/* <button
//                   onClick={() => setShowSpooky(!showSpooky)}
//                   className="bg-purple-700 hover:bg-purple-600 px-4 py-2 rounded-full"
//                 >
//                   {showSpooky ? 'Show Original' : 'Show Spookified'}
//                 </button> */}

//                 <div className="flex items-center gap-2">
//                   <label className="text-sm text-gray-300">Size</label>
//                   <select
//                     value={size}
//                     onChange={(e) => setSize(e.target.value as 'A4' | 'A3' | 'A2' | '50x70')}
//                     className="bg-gray-900 border border-white/10 rounded px-2 py-1 text-sm"
//                   >
//                     <option value="landscape">landscape</option>
//                     <option value="portrait">portrait</option>
//                     <option value="SQUARE">SQUARE</option>
             
//                   </select>
//                 </div>

//                 <div className="flex gap-2">
//                   {/* <a href={spookified} download="spookified-art.png" className="bg-white text-black px-4 py-2 rounded">
//                     Download
//                   </a> */}
//                   <button
//                     onClick={selectProduct}
//                     disabled={printing}
//                     className="bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded disabled:opacity-60"
//                   >
//                     {printing ? 'Sending to Checkout…' : 'Print'}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* RIGHT: Chat + Plan + Generate */}
//         <div className="lg:col-span-2 space-y-4">
//           <div className="bg-gray-950 rounded-xl p-4 border border-white/10 h-[420px] overflow-y-auto">
//             {messages.map((m, i) => (
//               <div key={i} className={`mb-3 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
//                 <div className={`${m.role === 'user' ? 'bg-purple-700' : 'bg-gray-800'} inline-block px-3 py-2 rounded-lg whitespace-pre-wrap max-w-[90%]`}>
//                   {m.content}
//                 </div>
//               </div>
//             ))}

//             {(chatBusy || generating) && (
//               <div className="mb-1 text-left">
//                 <span className="inline-flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg">
//                   <span className="text-gray-300">Conjuring ideas</span>
//                   <span className="typing relative inline-block w-6">
//                     <span className="dot" />
//                     <span className="dot" />
//                     <span className="dot" />
//                   </span>
//                 </span>
//               </div>
//             )}
//           </div>

//           <div className="flex gap-2">
//             <input
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={(e) => e.key === 'Enter' && !chatBusy && imageId && send()}
//               placeholder={originalDataUrl ? "Tell me your vibe (e.g., cozy cute, spookiness 3, fog + tiny ghost, moonlit blues, no blood)" : "Upload an image to begin the séance 👻"}
//               className="flex-1 px-3 py-2 rounded bg-gray-900 border border-white/10 outline-none disabled:opacity-60"
//               disabled={!originalDataUrl || chatBusy}
//             />
//             <button
//               onClick={send}
//               disabled={chatBusy || !imageId || !originalDataUrl}
//               className="px-4 py-2 rounded bg-white text-black hover:bg-orange-300 disabled:opacity-50"
//             >
//               Send
//             </button>
//           </div>

//           <div className="bg-gray-950 rounded-xl p-4 border border-white/10">
//             <div className="flex items-center justify-between mb-2">
//               {/* <strong>Current Plan</strong> */}
//               <button
//                 onClick={generate}
//                 disabled={generating || !imageId}
//                 className="px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-500 disabled:opacity-50"
//               >
//                 Use this plan → Generate
//               </button>
//             </div>
//             {/* {plan ? (
//               <pre className="whitespace-pre-wrap text-gray-300 text-sm">
//                 {JSON.stringify(plan, null, 2)}
//               </pre>
//             ) : (
//               <p className="text-gray-400 text-sm">
//                 Upload your image — I’ll greet you, react to your photo, ask a couple of quick questions, and craft the perfect spooky plan.
//               </p>
//             )} */}
//           </div>
//         </div>
//       </div>

//       <style jsx>{`
//         .typing .dot {
//           position: relative;
//           display: inline-block;
//           width: 6px;
//           height: 6px;
//           margin: 0 1px;
//           background: #cfcfe1;
//           border-radius: 50%;
//           animation: bounce 1.2s infinite ease-in-out;
//         }
//         .typing .dot:nth-child(2) { animation-delay: 0.2s; }
//         .typing .dot:nth-child(3) { animation-delay: 0.4s; }
//         @keyframes bounce {
//           0%, 80%, 100% { transform: translateY(0); opacity: .4; }
//           40% { transform: translateY(-4px); opacity: 1; }
//         }
//       `}</style>
//     </main>
//   )
// }
'use client'
import { useEffect, useRef, useState, useMemo } from 'react';
import Image from 'next/image';
import { Ghost } from 'lucide-react';
import {
  Comparison,
  ComparisonItem,
  ComparisonHandle,
} from '@/components/ui/shadcn-io/comparison/index';

type Role = 'user' | 'assistant';
type Msg = { role: Role; content: string; images?: string[] };

function extractConfigFrom(text: string) {
  let m = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (!m) m = text.match(/```\s*([\s\S]*?)\s*```/);
  if (!m) {
    const all = text.match(/\{[\s\S]*\}/g);
    if (all && all.length) m = ['', all[all.length - 1]] as unknown as RegExpMatchArray;
  }
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

async function fileToResizedDataUrl(file: File, maxDim = 1024, quality = 0.88): Promise<string> {
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

export default function UploadWithChatPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [spookified, setSpookified] = useState<string | null>(null);
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [plan, setPlan] = useState<Record<string, unknown> | null>(null);
  const finalizedPrompt = useMemo(
    () => (plan as { finalizedPrompt?: string } | null)?.finalizedPrompt ?? '',
    [plan]
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printing] = useState(false);
  const [size, setSize] = useState<'landscape' | 'portrait' | 'SQUARE'>('landscape');

  const isHttpUrl = (s: string) => /^https?:\//i.test(s);

  useEffect(() => {
    if (!imageId) setImageId(`dev-${Date.now()}`);
  }, [imageId]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // API helpers
  const refreshPlanFromServer = async (id: string) => {
    try {
      const r = await fetch(`/api/get-plan?id=${encodeURIComponent(id)}`);
      if (!r.ok) return;
      const j = await r.json();
      if (j?.plan) setPlan(j.plan);
    } catch {
      /* no-op */
    }
  };

  function ShimmerOverlay({ label = 'Spookifying…' }: { label?: string }) {
    return (
      <div
        className="absolute inset-0 z-50 pointer-events-none"
        aria-hidden="true"
        aria-busy="true"
      >
        {/* slight dim + blur to separate from background */}
        <div className="absolute inset-0 rounded-md bg-black/35 backdrop-blur-[1.5px]" />
  
        {/* shimmer sweep */}
        <div className="absolute inset-0 overflow-hidden rounded-md">
          <div className="shimmer absolute -inset-y-12 -left-1/3 w-1/2 rotate-12" />
        </div>
  
        {/* status pill at bottom center */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          <span className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
            <span className="ghost-pulse" aria-hidden>👻</span>
            <span>{label}</span>
          </span>
        </div>
      </div>
    );
  }
  

  const postChat = async (msgs: Msg[]) => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: imageId, messages: msgs }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Chat failed');
    return data as { content: string; plan?: Record<string, unknown>; finalizedPrompt?: string };
  };

  const setFromFile = async (file: File) => {
    try {
      let f = file;
      // Detect HEIC
      if (f.name.toLowerCase().endsWith('.heic') || f.type === 'image/heic') {
        const { convertHEICtoJPG } = await import('@/lib/convertHEICtoJPG');
        f = await convertHEICtoJPG(f);
      }
      if (!f.type.startsWith('image/')) return;
      setError(null);
      setSpookified(null);
      setPlan(null);
      setMessages([]);
      const blobUrl = URL.createObjectURL(f);
      setPreviewUrl(blobUrl);
      const dataUrl = await fileToResizedDataUrl(f, 1280, 0.9);
      setOriginalDataUrl(dataUrl);
      // Persist for your pipeline
      const res = await fetch('/api/store-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'Upload failed'); return; }
      const newId = j.id as string;
      setImageId(newId);
      // Kick off the initial chat
      setChatBusy(true);
      const initial: Msg = { role: 'user', content: "Here's my image — excited to spookify it!", images: [dataUrl] };
      const nextMsgs = [initial];
      setMessages(nextMsgs);
      const data = await postChat(nextMsgs);
      const assistantMsg: Msg = { role: 'assistant', content: data.content };
      setMessages(prev => [...prev, assistantMsg]);
      if (data.plan) setPlan(data.plan);
      else {
        const cfg = extractConfigFrom(assistantMsg.content);
        if (cfg) setPlan(cfg);
      }
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

  const send = async () => {
    if (!input.trim() || !imageId) return;
    const userMessage: Msg = { role: 'user', content: input.trim() };
    const newMsgs = [...messages, userMessage];
    setMessages(newMsgs);
    setInput('');
    setChatBusy(true);
    setError(null);
    try {
      const data = await postChat(newMsgs);
      const assistantMsg: Msg = { role: 'assistant', content: data.content };
      setMessages(prev => [...prev, assistantMsg]);
      if (data.plan) setPlan(data.plan);
      else {
        const cfg = extractConfigFrom(assistantMsg.content);
        if (cfg) setPlan(cfg);
      }
      await refreshPlanFromServer(imageId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setChatBusy(false);
    }
  };

  const generate = async () => {
    if (!imageId) { setError('Please upload an image first'); return; }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/spookify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: imageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to spookify');
      // If blocked, show the suggestion
      if (data.blocked) {
        setError(data.suggestion || data.note || data.reason);
        return;
      }
      setSpookified(data.previewDataUrl ?? data.spookyImage);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

  const selectProduct = async () => {
    try {
      if (!spookified) { setError('No spookified image found. Generate first.'); return; }
      if (!imageId) { setError('Missing image id.'); return; }
      let fileUrl = spookified;
      if (!isHttpUrl(spookified)) {
        const upRes = await fetch('/api/upload-spooky', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl: spookified, filename: `spookified-${imageId}.png` }),
        });
        const upJson: { url?: string; error?: string } = await upRes.json();
        if (!upRes.ok || !upJson?.url) throw new Error(upJson.error || 'Upload failed');
        fileUrl = upJson.url;
      }
      const qp = new URLSearchParams({ fileUrl, imageId });
      window.location.href = `/products?${qp.toString()}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">Spookify Your Art 👻</h1>
      <p className="text-center text-gray-400 mb-6">Upload, chat about the vibe, then generate — all on one page.</p>
      {error && <p className="text-red-400 text-center mb-4">{error}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <div className="lg:col-span-1 space-y-4">
          {!spookified && (
            <div
              className="border-2 border-dashed border-white/20 rounded-xl p-6 bg-gray-950 text-center cursor-pointer hover:border-white/40 transition"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              {previewUrl ? (
                <div className="relative w-full aspect-square">
                  <Image src={previewUrl} alt="Preview" fill className="object-contain rounded-md" />
                </div>
              ) : (
                <p className="text-gray-400">Click or drag & drop your image here</p>
              )}
            </div>
          )}
          {originalDataUrl && spookified && (
            <div className="bg-gray-950 rounded-xl p-4 border border-white/10">
              <div className="relative w-full aspect-square border border-white/10 rounded overflow-hidden bg-black">
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
              <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-300">Size</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value as 'landscape' | 'portrait' | 'SQUARE')}
                    className="bg-gray-900 border border-white/10 rounded px-2 py-1 text-sm"
                  >
                    <option value="landscape">landscape</option>
                    <option value="portrait">portrait</option>
                    <option value="SQUARE">SQUARE</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectProduct}
                    disabled={printing}
                    className="bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded disabled:opacity-60"
                  >
                    {printing ? 'Sending to Checkout…' : 'Print'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* RIGHT: Chat + Plan + Generate */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-950 rounded-xl p-4 border border-white/10 h-[420px] overflow-y-auto">
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
                  <span className="text-gray-300">Conjuring ideas</span>
                  <span className="typing relative inline-block w-6">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </span>
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !chatBusy && imageId && send()}
              placeholder={originalDataUrl ? 'Tell me your vibe (e.g., cozy cute, spookiness 3, fog + tiny ghost, moonlit blues, no blood)' : 'Upload an image to begin the séance 👻'}
              className="flex-1 px-3 py-2 rounded bg-gray-900 border border-white/10 outline-none disabled:opacity-60"
              disabled={!originalDataUrl || chatBusy}
            />
            <button
              onClick={send}
              disabled={chatBusy || !imageId || !originalDataUrl}
              className="px-4 py-2 rounded bg-white text-black hover:bg-orange-300 disabled:opacity-50"
            >
              Send
            </button>
          </div>
          <div className="bg-gray-950 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={generate}
                disabled={generating || !imageId}
                className="px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-500 disabled:opacity-50"
              >
                Use this plan → Generate
              </button>
            </div>
          </div>
        </div>
      </div>
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
          0%, 80%, 100% { transform: translateY(0); opacity: .4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </main>
  );
}
