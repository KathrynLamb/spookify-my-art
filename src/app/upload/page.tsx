'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import Image from 'next/image'

type Role = 'user' | 'assistant'
type Msg = { role: Role; content: string }

function extractConfigFrom(text: string) {
  let m = text.match(/```json\s*([\s\S]*?)\s*```/i)
  if (!m) m = text.match(/```\s*([\s\S]*?)\s*```/)
  if (!m) {
    const all = text.match(/\{[\s\S]*\}/g)
    if (all && all.length) m = ['', all[all.length - 1]] as unknown as RegExpMatchArray
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

export default function UploadWithChatPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // FAKING THE UPLOAD HAPPENED
  
  // const [previewUrl, setPreviewUrl] = useState<string | null>('https://fpabsqys5cky7azh.public.blob.vercel-storage.com/spookified-1253911a-fdaa-46c8-8907-6c0de24f011c-M2VlkfGKR2oJKp63PrcVqhGOv3SiLs.png')
  // const [spookified, setSpookified] = useState<string | null>('https://fpabsqys5cky7azh.public.blob.vercel-storage.com/spookified-1253911a-fdaa-46c8-8907-6c0de24f011c-M2VlkfGKR2oJKp63PrcVqhGOv3SiLs.png')
  // const [originalDataUrl, setOriginalDataUrl] = useState<string | null>('https://fpabsqys5cky7azh.public.blob.vercel-storage.com/spookified-1253911a-fdaa-46c8-8907-6c0de24f011c-M2VlkfGKR2oJKp63PrcVqhGOv3SiLs.png')
  
  
  const [spookified, setSpookified] = useState<string | null>()
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
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
  const [plan, setPlan] = useState<Record<string, unknown> | null>(null)
  const finalizedPrompt = useMemo(() => (plan as { finalizedPrompt?: string } | null)?.finalizedPrompt ?? '', [plan])


  // FAKING THE UPLOAD HAPPENED
  const isHttpUrl = (s: string) => /^https?:\/\//i.test(s)

  // seed a dev imageId so Print works without running the whole flow
  useEffect(() => {
    if (!imageId) setImageId(`dev-${Date.now()}`)
  }, [imageId])

// 

  // generation
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // const [spookified, setSpookified] = useState<string | null>(null)
  const [showSpooky, setShowSpooky] = useState(true)

  // print
  const [printing] = useState(false)
  const [size, setSize] = useState<'A4' | 'A3' | 'A2' | '50x70'>('50x70')
  // const priceBySize: Record<'A4' | 'A3' | 'A2' | '50x70', number> = {
  //   A4: 1499, A3: 1999, A2: 2999, '50x70': 3499
  // }

  useEffect(() => () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const setFromFile = async (f: File) => {
    if (!f.type.startsWith('image/')) return
    setError(null)
    setSpookified(null)
    setPlan(null)
    setShowSpooky(true)

    const blobUrl = URL.createObjectURL(f)
    setPreviewUrl(blobUrl)

    const dataUrl = await fileToResizedDataUrl(f, 1024, 0.88)
    setOriginalDataUrl(dataUrl)

    const res = await fetch('/api/store-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl }),
    })
    const j = await res.json()
    if (!res.ok) { setError(j.error || 'Upload failed'); return }
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
    const userMessage: Msg = { role: 'user', content: input.trim() }
    const newMsgs = [...messages, userMessage]
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
      const assistantMsg: Msg = { role: 'assistant', content: data.content as string }
      setMessages(prev => [...prev, assistantMsg])
      if (data.plan) setPlan(data.plan)
      else {
        const cfg = extractConfigFrom(assistantMsg.content)
        if (cfg) setPlan(cfg)
      }
      await refreshPlanFromServer(imageId)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setChatBusy(false)
    }
  }

  const generate = async () => {
    if (!imageId) { setError('Please upload an image first'); return }
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/spookify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: imageId, promptOverride: finalizedPrompt || undefined })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to spookify')
      setSpookified(data.previewDataUrl ?? data.spookyImage)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setGenerating(false)
    }
  }

  // const generate = async () => {
  //   if (!imageId) { setError('Please upload an image first'); return }
  //   setGenerating(true)
  //   setError(null)
  //   try {
  //     const res = await fetch('/api/spookify', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ id: imageId, promptOverride: finalizedPrompt || undefined })
  //     })
  //     const data = await res.json()
  
  //     // NEW: if server returns a "blocked" payload, create a chat turn + update plan
  //     if (data?.blocked) {
  //       const assistantMsg: Msg = {
  //         role: 'assistant',
  //         content:
  // `The image request was blocked by the safety system:
  
  // • Reason: ${data.reason}
  // • I rewrote your prompt to be policy-safe while keeping your vibe.
  
  // **Safer prompt**:
  // ${data.suggestion}
  
  // Click “Use this plan → Generate” to try again with this safer prompt.`
  //       }
  //       setMessages(prev => [...prev, assistantMsg])
  
  //       // Update your plan with the suggestion so the button uses it
  //       setPlan(prev => ({ ...(prev || {}), finalizedPrompt: data.suggestion }))
  
  //       setError('Your previous prompt triggered the safety system. I’ve suggested a safe alternative.')
  //       return
  //     }
  
  //     if (!res.ok) throw new Error(data.error || 'Failed to spookify')
  //     setSpookified(data.previewDataUrl ?? data.spookyImage)
  //   } catch (e) {
  //     setError(e instanceof Error ? e.message : String(e))
  //   } finally {
  //     setGenerating(false)
  //   }
  // }


  // const generate = async (autoToProducts: boolean = false) => {
  //   if (!imageId) { setError('Please upload an image first'); return }
  //   setGenerating(true)
  //   setError(null)
  //   try {
  //     // 1) Ask server to generate
  //     const res = await fetch('/api/spookify', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ id: imageId, promptOverride: finalizedPrompt || undefined })
  //     })
  //     const data = await res.json()
  
  //     // 2) Safety handling from server
  //     if (data?.blocked) {
  //       const assistantMsg: Msg = {
  //         role: 'assistant',
  //         content:
  // `The image request was blocked by the safety system.
  
  // • Reason: ${data.reason}
  // • I rewrote your prompt to be policy-safe while keeping your vibe.
  
  // **Safer prompt**
  // ${data.suggestion}
  
  // Click “Use this plan → Generate” to try again with this safer prompt.`
  //       }
  //       setMessages(prev => [...prev, assistantMsg])
  //       setPlan(prev => ({ ...(prev || {}), finalizedPrompt: data.suggestion }))
  //       setError('Your previous prompt triggered the safety system. I’ve suggested a safe alternative.')
  //       return
  //     }
  
  //     if (!res.ok) throw new Error(data.error || 'Failed to spookify')
  
  //     // 3) Save the image locally (can be a dataURL or a hosted URL depending on your API)
  //     const resultUrl: string = data.previewDataUrl ?? data.spookyImage
  //     setSpookified(resultUrl)
  
  //     // 4) Optional: immediately upload to get a public URL and go to product chooser
  //     if (autoToProducts) {
  //       // if resultUrl is a data URL, upload it, else use as-is
  //       let publicUrl = resultUrl
  //       if (resultUrl.startsWith('data:')) {
  //         const upRes = await fetch('/api/upload-spooky', {
  //           method: 'POST',
  //           headers: { 'Content-Type': 'application/json' },
  //           body: JSON.stringify({ dataUrl: resultUrl, filename: `spookified-${imageId}.png` })
  //         })
  //         const upJson = await upRes.json()
  //         if (!upRes.ok || !upJson?.url) throw new Error(upJson?.error || 'Upload failed')
  //         publicUrl = upJson.url
  //       }
  //       // navigate to product chooser with the fileUrl + imageId
  //       const qp = new URLSearchParams({ fileUrl: publicUrl, imageId })
  //       window.location.href = `/products?${qp.toString()}`
  //     }
  //   } catch (e) {
  //     setError(e instanceof Error ? e.message : String(e))
  //   } finally {
  //     setGenerating(false)
  //   }
  // }
  
  

  // const handlePrint = async () => {
  //   if (printing) return
  //   try {
  //     if (!spookified || !imageId) { setError('Generate your image first.'); return }
  //     setPrinting(true); setError(null)

  //     // 1) Upload the spookified image to get a public URL
  //     const upRes = await fetch('/api/upload-spooky', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ dataUrl: spookified, filename: `spookified-${imageId}.png` })
  //     })
  //     const upJson: { url?: string; error?: string } = await upRes.json()
  //     if (!upRes.ok || !upJson?.url) throw new Error(upJson.error || 'Upload failed')
  //     const fileUrl = upJson.url

  //     // 2) Build a poster SKU from the selected size (for now we sell posters)
  //     const posterSkuBySize: Record<'A4'|'A3'|'A2'|'50x70', string> = {
  //       A4:    'POSTER_S170_A4',
  //       A3:    'POSTER_S170_A3',
  //       A2:    'POSTER_S170_A2',
  //       '50x70': 'POSTER_S170_50x70',
  //     };
  //     // If you add 30×40 etc, extend your size dropdown & this map.
      
  //     const sku = posterSkuBySize[size]
  //     const title = `Spookified Poster – ${size}`

  //     // 3) Create Stripe Checkout
  //     const chkRes = await fetch('/api/checkout', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         fileUrl,
  //         imageId,
  //         sku,                   // required by the server
  //         title,                 // optional
  //         price: priceBySize[size],
  //       }),
  //     })
  //     const chkJson: { url?: string; error?: string } = await chkRes.json()
  //     if (!chkRes.ok || !chkJson.url) throw new Error(chkJson.error || 'Checkout failed')

  //     // 4) Redirect to Stripe
  //     window.location.href = chkJson.url
  //   } catch (e) {
  //     setError(e instanceof Error ? e.message : String(e))
  //   } finally {
  //     setPrinting(false)
  //   }
  // }


    // FAKING THE UPLOAD HAPPENED
  // const handlePrint = async () => {
  //   if (printing) return
  //   try {
  //     if (!spookified) { setError('No spookified image found.'); return }
  //     if (!imageId)    { setError('Missing image id.'); return }
  //     setPrinting(true); setError(null)
  
  //     // 1) Resolve a public file URL
  //     let fileUrl = spookified
  //     if (!isHttpUrl(spookified)) {
  //       // It's a data URL → upload to Vercel Blob to get a public URL
  //       const upRes = await fetch('/api/upload-spooky', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({ dataUrl: spookified, filename: `spookified-${imageId}.png` })
  //       })
  //       const upJson: { url?: string; error?: string } = await upRes.json()
  //       if (!upRes.ok || !upJson?.url) throw new Error(upJson.error || 'Upload failed')
  //       fileUrl = upJson.url
  //     }
  
  //     // 2) Pick a SKU from your size (keeping your S170 semi-gloss mapping)
  //     const posterSkuBySize: Record<'A4'|'A3'|'A2'|'50x70', string> = {
  //       A4: 'POSTER_S170_A4',
  //       A3: 'POSTER_S170_A3',
  //       A2: 'POSTER_S170_A2',
  //       '50x70': 'POSTER_S170_50x70',
  //     }
  //     const sku = posterSkuBySize[size]
  //     const title = `Spookified Poster – ${size}`
  
  //     // 3) Create Stripe Checkout
  //     const chkRes = await fetch('/api/checkout', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         fileUrl,
  //         imageId,              // now present thanks to the seed above
  //         sku,
  //         title,
  //         price: priceBySize[size],
  //       }),
  //     })
  //     const chkJson: { url?: string; error?: string } = await chkRes.json()
  //     if (!chkRes.ok || !chkJson.url) throw new Error(chkJson.error || 'Checkout failed')
  
  //     // 4) Redirect to Stripe
  //     window.location.href = chkJson.url
  //   } catch (e) {
  //     setError(e instanceof Error ? e.message : String(e))
  //   } finally {
  //     setPrinting(false)
  //   }
  // }
  
// helper you already added


const selectProduct = async () => {
  try {
    if (!spookified) {
      setError('No spookified image found. Generate first.')
      return
    }
    if (!imageId) {
      setError('Missing image id.')
      return
    }

    // ensure we have a public URL (upload if the image is a data URL)
    let fileUrl = spookified
    if (!isHttpUrl(spookified)) {
      const upRes = await fetch('/api/upload-spooky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl: spookified,
          filename: `spookified-${imageId}.png`,
        }),
      })
      const upJson: { url?: string; error?: string } = await upRes.json()
      if (!upRes.ok || !upJson?.url) throw new Error(upJson.error || 'Upload failed')
      fileUrl = upJson.url
    }

    // navigate to product chooser with the fileUrl + imageId
    const qp = new URLSearchParams({ fileUrl, imageId })
    window.location.href = `/products?${qp.toString()}`
  } catch (e) {
    setError(e instanceof Error ? e.message : String(e))
  }
}


  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">Spookify Your Art 👻</h1>
      <p className="text-center text-gray-400 mb-6">Upload, chat about the vibe, then generate — all on one page.</p>

      {error && <p className="text-red-400 text-center mb-4">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* LEFT: Upload + Preview + Result */}
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
                    onChange={(e) => setSize(e.target.value as 'A4' | 'A3' | 'A2' | '50x70')}
                    className="bg-gray-900 border border-white/10 rounded px-2 py-1 text-sm"
                  >
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                    <option value="A2">A2</option>
                    <option value="50x70">50×70 cm</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <a href={spookified} download="spookified-art.png" className="bg-white text-black px-4 py-2 rounded">
                    Download
                  </a>
                  <button
                    // onClick={handlePrint}
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
            {(chatBusy || generating) && <div className="text-gray-400 text-sm">Working…</div>}
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
