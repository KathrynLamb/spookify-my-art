'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

export default function ThankYou() {
  // (Optional) If you later want to read the session_id:
  // const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  // const sessionId = search?.get('session_id') ?? undefined

  const [copied, setCopied] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const confettiRef = useRef<HTMLDivElement>(null)

  // Build a simple referral link for virality (swap to your prod domain)
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://spookify-my-art.vercel.app')
  const referral = useMemo(() => `${baseUrl}/?ref=boo`, [baseUrl])

  // Tiny burst of confetti-ghosts on mount — CSS only
  useEffect(() => {
    const el = confettiRef.current
    if (!el) return
    const pieces = 16
    for (let i = 0; i < pieces; i++) {
      const span = document.createElement('span')
      span.textContent = ['👻', '🦇', '🎃'][i % 3]
      span.className = 'absolute text-xl animate-float pointer-events-none'
      span.style.left = Math.random() * 100 + '%'
      span.style.animationDelay = (Math.random() * 0.4).toFixed(2) + 's'
      el.appendChild(span)
      setTimeout(() => span.remove(), 1500)
    }
  }, [])

  async function copyReferral() {
    try {
      await navigator.clipboard.writeText(referral)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // ignore
    }
  }

  async function webShare() {
    const shareData = {
      title: 'Spookify Your Art 👻',
      text: 'I just turned my wall art spooky for Halloween — it’s so fun! Try yours:',
      url: referral,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // user canceled
      }
    } else {
      setShareOpen(true)
    }
  }

  return (
    <main className="min-h-[100svh] bg-black text-white relative overflow-hidden">
      {/* Soft moon glow background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.10),rgba(0,0,0,0))]" />

      {/* Confetti container */}
      <div ref={confettiRef} className="pointer-events-none absolute inset-0" />

      <section className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        {/* HERO */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-sm mb-4">
            <span className="animate-pulse">🕯️</span>
            Payment received
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Thanks! <span className="inline-block animate-bounce">👻</span>
          </h1>
          <p className="text-white/80 mt-3">
            We’re preparing your spooky print. You’ll get a receipt and tracking by email.
          </p>
        </div>

        {/* PROGRESS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
          <Step done label="File ready" note="Your art was uploaded successfully." icon="🧪" />
          <Step active label="Sending to print" note="Packing your order with our print partner." icon="📦" />
          <Step label="On the way" note="You’ll receive tracking soon." icon="🚚" />
        </div>

        {/* ACTION STRIP */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 mb-10">
          <div className="text-center md:text-left">
            <p className="font-semibold">Make it go BOOM on social!</p>
            <p className="text-white/70 text-sm">
              Share your haunted glow-up and tag <span className="font-semibold">#SpookifyYourArt</span> — we feature our favorites.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={webShare}
              className="px-4 py-2 rounded-full bg-white text-black hover:bg-orange-300 transition"
            >
              Share my spooky art
            </button>
            <button
              onClick={copyReferral}
              className="px-4 py-2 rounded-full bg-purple-700 hover:bg-purple-600 transition"
              title={referral}
            >
              {copied ? 'Link copied! ✨' : 'Copy invite link'}
            </button>
            <a
              href="/upload"
              className="px-4 py-2 rounded-full bg-orange-600 hover:bg-orange-500 transition"
            >
              Spookify another
            </a>
          </div>
        </div>

        {/* SHARE FALLBACK (desktop) */}
        {shareOpen && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 mb-10">
            <p className="font-semibold mb-2">Share this link anywhere:</p>
            <div className="flex items-center gap-2">
              <code className="text-xs md:text-sm bg-black/60 border border-white/10 rounded px-3 py-2 break-all flex-1">
                {referral}
              </code>
              <button
                onClick={copyReferral}
                className="px-3 py-2 rounded bg-white text-black hover:bg-orange-300 transition text-sm"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <Social href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('I just Spookified my wall art for Halloween! 👻')}&url=${encodeURIComponent(referral)}&hashtags=SpookifyYourArt,HalloweenHome`}>X</Social>
              <Social href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referral)}`}>Facebook</Social>
              <Social href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(referral)}&description=${encodeURIComponent('Spookify your wall art for Halloween!')}`}>Pinterest</Social>
            </div>
          </div>
        )}

        {/* TIPS + NEXT */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card
            title="Style your haunt"
            body="Add fairy lights, paper bats, and a mini pumpkin cluster under the frame for instant vibes."
            icon="🕸️"
          />
          <Card
            title="Need edits?"
            body="If anything looks off, reply to your receipt email and we’ll fix it fast."
            icon="🪄"
          />
          <Card
            title="Want a set?"
            body="Create two more in A4 for an instant gallery wall — looks magic above a console."
            icon="🖼️"
            cta={{ href: '/upload', text: 'Make another' }}
          />
        </div>

        {/* Footer links */}
        <div className="text-center mt-12 text-sm text-white/60">
          <a className="hover:text-white" href="/refunds">Refunds & Returns</a>
          <span className="mx-2">•</span>
          <a className="hover:text-white" href="/terms">Terms</a>
          <span className="mx-2">•</span>
          <a className="hover:text-white" href="/privacy">Privacy</a>
        </div>
      </section>

      {/* Local animations */}
      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0) scale(1); opacity: 0.9; }
          100% { transform: translateY(-120px) scale(1.1); opacity: 0; }
        }
        .animate-float { animation: float 1.2s ease-out forwards; }
      `}</style>
    </main>
  )
}

/* ————— small components ————— */

function Step({
  label,
  note,
  icon,
  done,
  active,
}: {
  label: string
  note: string
  icon: string
  done?: boolean
  active?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-4 h-full ${
        done ? 'border-emerald-400/40 bg-emerald-400/10' :
        active ? 'border-orange-400/40 bg-orange-400/10' :
        'border-white/10 bg-white/5'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="font-semibold">{label}</span>
        {done && <span className="ml-auto text-emerald-300 text-xs">✓</span>}
        {active && <span className="ml-auto text-orange-300 text-xs">in progress…</span>}
      </div>
      <p className="text-sm text-white/70">{note}</p>
    </div>
  )
}

function Card({
  title,
  body,
  icon,
  cta,
}: {
  title: string
  body: string
  icon: string
  cta?: { href: string; text: string }
}) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-white/70 text-sm mb-3">{body}</p>
      {cta && (
        <a
          href={cta.href}
          className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-white text-black hover:bg-orange-300 transition"
        >
          {cta.text} <span>→</span>
        </a>
      )}
    </div>
  )
}

function Social({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-sm"
    >
      {children}
    </a>
  )
}
