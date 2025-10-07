'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import Image from 'next/image'

type Msg = { role: 'user' | 'assistant'; content: string }

// --- helpers --------------------------------------------------------------

function extractConfigFrom(text: string) {
  // Try ```json ... ```
  let m = text.match(/```json\s*([\s\S]*?)\s*```/i)
  if (!m) m = text.match(/```\s*([\s\S]*?)\s*```/) // generic code fence
  if (!m) {
    const all = text.match(/\{[\s\S]*\}/g) // last JSONish block
    if (all && all.length) m = ['', all[all.length - 1]] as any
  }
  if (!m) return null
  try { return JSON.parse(m[1]) } catch { return null }
}

async function fileToResizedDataUrl(file: File, maxDim = 1024, quality = 0.88): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(maxDim / bitmap.width, maxDim / bitmap.height, 1)
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}

// --- component ------------------------------------------------------------

export default function UploadWithChatPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // art
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null)
  const [imageId, setImageId] = useState<string | null>(null)

  // chat
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      content:
        "Tell me the vibe (moody, cute, gothic), spookiness (1–5), elements (ghosts, fog, moon, pumpkins), palette, and anything to avoid. I’ll craft the perfect prompt! 🎃",
    },
  ])
  const [input, setInput] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const [plan, setPlan] = useState<any>(null) // parsed CONFIG
  const finalizedPrompt = useMemo(() => plan?.finalizedPrompt || '', [plan])

  // generation
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [spookified, setSpookified] = useState<string | null>(null)
  const [showSpooky, setShowSpooky] = useState(true)

  // print
  const [printing, setPrinting] = useState(false)
  const [size, setSize] = useState<'A4' | 'A3' | 'A2' | '50x70'>('50x70')
  // simple price map (use your currency in /api/checkout)
  const priceBySize: Record<typeof size, number> = {
    A4: 1499,   // £14.99
    A3: 1999,   // £19.99
    A2: 2999,   // £29.99
    '50x70': 3499 // £34.99
  }

  useEffect(() => () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const setFromFile = async (f: File) => {
    if (!f.type.startsWith('image/')) return
    setError(null)
    setSpookified(null)
    setPlan(null)
    setShowSpooky(true)

    // quick local preview
    const blobUrl = URL.createObjectURL(f)
    setPreviewUrl(blobUrl)

    // prepare a resized dataURL for chat → generate
    const dataUrl = await fileToResizedDataUrl(f, 1024, 0.88)
    setOriginalDataUrl(dataUrl)

    // store on server temp memory → id
    const res = await fetch('/api/store-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl }),
    })
    const j = await res.json()
    if (!res.ok) {
      setError(j.error || 'Upload failed')
      return
    }
    setImageId(j.id as string)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) void setFromFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) void setFromFile(f)
  }

  const refreshPlanFromServer = async (id: string) => {
    try {
      const r = await fetch(`/api/get-plan?id=${encodeURIComponent(id)}`)
      if (!r.ok) return
      const j = await r.json()
      if (j?.plan) setPlan(j.plan)
    } catch { /* no-op */ }
  }

  const send = async () => {
    if (!input.trim() || !imageId) return
    const userText = input.trim()
    const newMsgs = [...messages, { role: 'user', content: userText }]
    setMessages(newMsgs)
    setInput('')
    setChatBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: imageId, messages: newMsgs })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chat failed')

      const assistantMsg = { role: 'assistant', content: data.content as string }
      setMessages(prev => [...prev, assistantMsg])

      if (data.plan) setPlan(data.plan)
      else {
        const cfg = extractConfigFrom(assistantMsg.content)
        if (cfg) setPlan(cfg)
      }
      await refreshPlanFromServer(imageId)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setChatBusy(false)
    }
  }

  const generate = async () => {
    if (!imageId) { setError('Please upload an image first'); return }
    setGenerating(true)
    setError(null)
    try {
      // server will use stored finalizedPrompt for this id
      const res = await fetch('/api/spookify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: imageId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to spookify')
      setSpookified(data.previewDataUrl ?? data.spookyImage)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  // --- PRINT: upload to storage → create Stripe Checkout → redirect ----------
  const handlePrint = async () => {
    try {
      if (!spookified || !imageId) {
        setError('Please generate your spookified image first.')
        return
      }
      setPrinting(true)
      setError(null)

      // 1) Upload spookified data URL to get a public URL (Vercel Blob)
      const upRes = await fetch('/api/upload-spooky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: spookified, filename: `spookified-${imageId}.png` })
      })
      const upJson = await upRes.json()
      if (!upRes.ok || !upJson?.url) throw new Error(upJson.error || 'Upload failed')
      const fileUrl: string = upJson.url

      // 2) Create Stripe Checkout session (server stores metadata for Gelato)
      const chkRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl,
          imageId,
          size,
          price: priceBySize[size] // integer minor units
        })
      })
      const chkJson = await chkRes.json()
      if (!chkRes.ok || !chkJson?.url) throw new Error(chkJson.error || 'Checkout failed')

      // 3) Go to Stripe
      window.location.href = chkJson.url
    } catch (e: any) {
      setError(e.message || 'Print failed')
    } finally {
      setPrinting(false)
    }
  }

  // --- UI -------------------------------------------------------------------

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">Spookify Your Art 👻</h1>
      <p className="text-center text-gray-400 mb-6">Upload, chat about the vibe, then generate — all on one page.</p>

      {error && <p className="text-red-400 text-center mb-4">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* LEFT: Upload + Preview + Result */}
        <div className="lg:col-span-1 space-y-4">
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
                <Image src={previewUrl} alt="Preview" fill className="object-contain rounded-md" />
              </div>
            ) : (
              <p className="text-gray-400">Click or drag & drop your image here</p>
            )}
          </div>

          {/* Before/After card */}
          {originalDataUrl && spookified && (
            <div className="bg-gray-950 rounded-xl p-4 border border-white/10">
              <div className="relative w-full aspect-square border border-white/10 rounded overflow-hidden bg-black">
                <Image
                  src={originalDataUrl}
                  alt="Original"
                  fill
                  className={`object-contain absolute top-0 left-0 transition-opacity duration-500 ${showSpooky ? 'opacity-0' : 'opacity-100'}`}
                  priority
                />
                <Image
                  src={spookified}
                  alt="Spookified"
                  fill
                  className={`object-contain absolute top-0 left-0 transition-opacity duration-500 ${showSpooky ? 'opacity-100' : 'opacity-0'}`}
                  priority
                />
              </div>

              {/* Size + Actions */}
              <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                <button
                  onClick={() => setShowSpooky(!showSpooky)}
                  className="bg-purple-700 hover:bg-purple-600 px-4 py-2 rounded-full"
                >
                  {showSpooky ? 'Show Original' : 'Show Spookified'}
                </button>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-300">Size</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value as any)}
                    className="bg-gray-900 border border-white/10 rounded px-2 py-1 text-sm"
                  >
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                    <option value="A2">A2</option>
                    <option value="50x70">50×70 cm</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <a
                    href={spookified}
                    download="spookified-art.png"
                    className="bg-white text-black px-4 py-2 rounded"
                  >
                    Download
                  </a>
                  <button
                    onClick={handlePrint}
                    disabled={printing}
                    className="bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded disabled:opacity-60"
                  >
                    {printing ? 'Sending to Checkout…' : `Print (£${(priceBySize[size] / 100).toFixed(2)})`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT 2/3: Chat + Plan + Generate */}
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
              <div className="text-gray-400 text-sm">Working…</div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !chatBusy && imageId && send()}
              placeholder="e.g., Moody vibe, spookiness 3, fog + one cute ghost, moonlit blues, no blood"
              className="flex-1 px-3 py-2 rounded bg-gray-900 border border-white/10 outline-none"
              disabled={!originalDataUrl}
            />
            <button
              onClick={send}
              disabled={chatBusy || !imageId}
              className="px-4 py-2 rounded bg-white text-black hover:bg-orange-300 disabled:opacity-50"
            >
              Send
            </button>
          </div>

          {/* Plan panel */}
          <div className="bg-gray-950 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <strong>Current Plan</strong>
              <button
                onClick={generate}
                disabled={generating || !imageId}
                className="px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-500 disabled:opacity-50"
              >
                Use this plan → Generate
              </button>
            </div>
            {plan ? (
              <pre className="whitespace-pre-wrap text-gray-300 text-sm">
{JSON.stringify(plan, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-400 text-sm">
                Upload your image, tell me the vibe, and I’ll craft the prompt. Then click “Use this plan → Generate”.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
