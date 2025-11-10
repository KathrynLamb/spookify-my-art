'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { UploadCloud, ImagePlus, X, SendHorizonal, Wand2, Sparkles } from 'lucide-react'

type Msg = { role: 'user'|'assistant'|'system'; content: string }
type UploadThumb = { url: string, file?: File, kind: 'photo'|'mood' }

export default function DesignChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      content:
        "Hi! I can turn an **idea or photo** into the perfect gift. Tell me who it’s for and the occasion—or drop a photo—and I’ll do the rest. (You can say things like: *romantic comic for our anniversary on a mug*, *neon city canvas with our names*, *cozy holiday cards*.)",
    },
  ])
  const [input, setInput] = useState('')
  const [uploads, setUploads] = useState<UploadThumb[]>([])
  const [isSending, setIsSending] = useState(false)
  const [previewNote, setPreviewNote] = useState('Live preview will appear here')
  const photoInputRef = useRef<HTMLInputElement>(null)
  const moodInputRef = useRef<HTMLInputElement>(null)

  function addUpload(file: File, kind: 'photo'|'mood') {
    const url = URL.createObjectURL(file)
    setUploads((u) => [...u, { url, file, kind }])
  }

  async function handleSend(text?: string) {
    const content = (text ?? input).trim()
    if (!content && uploads.length === 0) return

    const next: Msg[] = [...messages, { role: 'user', content } as Msg]
    setMessages(next)
    
    setInput('')
    setIsSending(true)

    // Build FormData so you can stream files later (only the last new ones)
    const fd = new FormData()
    fd.append('messages', JSON.stringify(next))
    uploads.forEach((u, i) => {
      if (u.file) fd.append(u.kind === 'photo' ? 'photo' : `mood_${i}`, u.file!)
    })

    try {
      const res = await fetch('/api/design', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()

      // assistant reply
      if (data.reply) {
        setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
      }

      // brief extracted? show a note (you’ll replace with a real preview job)
      if (data.brief) {
        setPreviewNote(`Draft brief ready: ${data.brief.product} · ${data.brief.style} · ${data.brief.size ?? 'auto'} · ${data.brief.region}`)
      }

      // concept thumbnails (placeholder URLs) — wire to your generator when ready
      // if (data.concepts?.length) ...
    } catch (e) {
      console.log(e)
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            "Hmm, I hit a snag. Try again, or tell me your occasion + product (e.g., *Valentine’s cushion*) and I’ll proceed.",
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  function removeUpload(idx: number) {
    setUploads((u) => u.filter((_, i) => i !== idx))
  }

  const quickChips = [
    'Romantic comic poster about our first date',
    'Neon Night canvas with our names',
    'Cozy holiday card set for family',
    'Spooky portrait for the hallway',
    'Minimal line-art cushion, initials K+A',
  ]

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0d0d0d] to-[#111] text-white">
      <header className="sticky top-0 z-40 bg-[#0d0d0d]/80 backdrop-blur border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold tracking-tight">AI Gifts — Design</span>
          </div>
          <div className="text-xs text-white/60">Preview free · Ships worldwide · Love-it guarantee</div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* Chat column */}
        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/10 text-sm text-white/70">
            Start with **anything**: a vibe, occasion, recipient, or upload a photo. I’ll ask only what’s needed and create a ready-to-print design.
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed ${
                  m.role === 'assistant' ? 'bg-white/5' : 'bg-white text-black ml-auto'
                }`}
              >
                <div className="prose prose-invert prose-sm">
                  <p dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, '<br/>') }} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick idea chips */}
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {quickChips.map((c) => (
              <button
                key={c}
                onClick={() => handleSend(c)}
                className="rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs"
              >
                {c}
              </button>
            ))}
          </div>

          {/* Upload strip */}
          <div className="px-4 pb-3 flex items-center gap-3">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) addUpload(f, 'photo')
              }}
            />
            <input
              ref={moodInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : []
                files.slice(0, 5).forEach((f) => addUpload(f, 'mood'))
              }}
            />
            <button
              onClick={() => photoInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
            >
              <UploadCloud className="h-4 w-4" /> Add photo
            </button>
            <button
              onClick={() => moodInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
            >
              <ImagePlus className="h-4 w-4" /> Add moodboard
            </button>
          </div>

          {/* Thumbs */}
          {uploads.length > 0 && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
              {uploads.map((u, i) => (
                <div key={i} className="relative h-16 w-24 overflow-hidden rounded-md border border-white/10">
                  <Image src={u.url} alt={`upload-${i}`} fill className="object-cover" />
                  <span className="absolute left-1 top-1 text-[10px] bg-black/70 rounded px-1">{u.kind}</span>
                  <button
                    onClick={() => removeUpload(i)}
                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-end gap-2 p-4 border-t border-white/10"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me the occasion and who it’s for… or describe a style you want."
              rows={1}
              className="flex-1 resize-none rounded-xl bg-black/40 px-3 py-3 text-sm ring-1 ring-white/15 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSending}
              className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-4 py-3 text-sm font-medium shadow disabled:opacity-60"
            >
              <SendHorizonal className="h-4 w-4" />
              Send
            </button>
          </form>
        </div>

        {/* Preview / Next steps column */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#121212]">
              {uploads.find(u => u.kind === 'photo') ? (
                <Image
                  src={uploads.find(u => u.kind === 'photo')!.url}
                  alt="preview"
                  fill
                  className="object-cover opacity-85"
                />
              ) : uploads[0] ? (
                <Image src={uploads[0].url} alt="preview" fill className="object-cover opacity-80" />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-white/60 text-sm">
                  {previewNote}
                </div>
              )}
              <div className="absolute left-3 top-3 rounded-full bg-black/60 backdrop-blur px-3 py-1 text-xs">
                Assistant-led design
              </div>
            </div>
            <p className="px-1 pt-2 text-xs text-white/60">
              The assistant will extract a brief and generate concepts. You can tweak before printing.
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 text-sm">
            <div className="font-semibold mb-2">What the AI handles for you</div>
            <ul className="list-disc pl-5 space-y-1 text-white/80">
              <li>Figures out **product, size, and style** from your hints</li>
              <li>Asks only when it truly needs info</li>
              <li>Generates **3 concepts** and a structured **print brief**</li>
              <li>Sends the chosen one to print (after you confirm)</li>
            </ul>
            <button
              onClick={() => handleSend('Please propose 3 concepts based on what I shared.')}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-sm font-medium"
            >
              <Wand2 className="h-4 w-4" /> Let the AI decide
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
