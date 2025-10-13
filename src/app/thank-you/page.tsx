// // src/app/thank-you/page.tsx
// 'use client'

// import Image from 'next/image'
// import { useEffect, useMemo, useState } from 'react'
// import { useSearchParams } from 'next/navigation'


// type Snapshot = {
//   product?: string
//   size?: string
//   orientation?: 'Vertical' | 'Horizontal'
//   shipCity?: string
//   shipCountry?: string // ISO-2
//   etaMinDays?: number
//   etaMaxDays?: number
//   thumbUrl?: string // your generated art
//   email?: string
// }

// function getFlagEmoji(iso2?: string) {
//   if (!iso2) return ''
//   const cc = iso2.trim().toUpperCase()
//   if (cc.length !== 2) return ''
//   return String.fromCodePoint(...[...cc].map(c => 0x1f1a5 + c.charCodeAt(0)))
// }

// function prefersReducedMotion() {
//   if (typeof window === 'undefined') return true
//   return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
// }

// export default function ThankYou() {
//   /** -----------------------
//    *  Build referral link on client only
//    *  ---------------------- */
//   const [referral, setReferral] = useState<string>('') // avoid SSR/CSR mismatch
//   useEffect(() => {
//     const refCode = 'boo' // TODO: swap for per-order code if desired
//     const origin = window.location.origin
//     setReferral(`${origin}/?ref=${encodeURIComponent(refCode)}`)
//   }, [])

//   // …inside component:
// const sp = useSearchParams()
// const fileUrlQP = sp.get('fileUrl') || ''




//   /** -----------------------
//    *  Read an optional client-side "order snapshot"
//    *  (If you write this to localStorage in products/checkout flow,
//    *   it will render richer details here. Safe fallbacks otherwise.)
//    *  ---------------------- */
//   const [snap, setSnap] = useState<Snapshot | null>(null)
//   useEffect(() => {
//     try {
//       const raw = localStorage.getItem('spookify:last-order')
//       if (raw) setSnap(JSON.parse(raw))
//     } catch { /* noop */ }
//   }, [])

//   const artSrc =
//   (fileUrlQP && /^https?:\/\//i.test(fileUrlQP) ? fileUrlQP : '') ||
//   snap?.thumbUrl ||
//   '/mockups/halloween-frame-vertical.png'

//   const canShare = typeof navigator !== 'undefined' && !!navigator.share
//   const shareTitle = 'Check out my spooky art 🎃'

//   const [toast, setToast] = useState<string>('')
//   useEffect(() => {
//     if (!toast) return
//     const t = setTimeout(() => setToast(''), 1800)
//     return () => clearTimeout(t)
//   }, [toast])

//   async function copyReferral() {
//     try {
//       if (!referral) return
//       await navigator.clipboard.writeText(referral)
//       setToast('Link copied ✓')
//     } catch {
//       // Fallback: show prompt
//       window.prompt('Copy this link', referral)
//     }
//   }

//   async function webShare() {
//     try {
//       if (!referral || !canShare) return
//       await navigator.share({
//         title: shareTitle,
//         text: 'Made with Spookify!',
//         url: referral,
//       })
//     } catch {
//       /* user cancelled or not supported */
//     }
//   }

//   const buttonTitle = useMemo(() => (referral ? referral : undefined), [referral])

//   const fallbackThumb =
//     snap?.thumbUrl ??
//     '/mockups/halloween-frame-vertical.png'

//   const countryFlag = getFlagEmoji(snap?.shipCountry)

//   const showConfetti = !prefersReducedMotion()

//   return (
//     <main className="relative min-h-[100svh] bg-[#0B0B0E] text-white overflow-hidden">
//       {/* Night vignette + subtle grain */}
//       <div className="pointer-events-none absolute inset-0">
//         <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_0%,rgba(255,106,43,0.12)_0%,rgba(11,11,14,0)_60%)]" />
//         <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,14,0)_0%,rgba(11,11,14,0.85)_100%)]" />
//         <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay" style={{
//           backgroundImage:
//             'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27 viewBox=%270 0 160 160%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.8%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix type=%27saturate%27 values=%270%27/%3E%3C/filter%3E%3Crect width=%27160%27 height=%27160%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")',
//         }} />
//       </div>

//       {/* Floating ghosts (confetti) */}
//       {showConfetti && <GhostConfetti />}

//       <div className="relative mx-auto max-w-6xl px-6 py-12 md:py-16">
//         {/* Header row */}
//         <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
//           <div className="md:col-span-7">
//             <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
//               <span className="bg-clip-text text-transparent bg-[linear-gradient(90deg,#8B73FF_0%,#FF6A2B_60%,#FF8A53_100%)]">
//                 Thank you!
//               </span>
//             </h1>
//             <p className="mt-3 text-[#B9B9C6]">
//               You did it. The spirits approve. Your print is now conjuring at our nearest atelier.
//             </p>

//             {/* Order snapshot */}
//             <div className="mt-5 rounded-2xl bg-[#111117] border border-white/10 p-4 md:p-5 shadow-[0_12px_30px_rgba(0,0,0,.45)]">
//               <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
//                 <Badge icon="📦" label={snap?.product ?? 'Order created'} />
//                 {!!snap?.size && <Badge icon="📐" label={snap.size} />}
//                 {!!snap?.orientation && <Badge icon="🖼️" label={snap.orientation} />}
//                 {(snap?.shipCity || snap?.shipCountry) && (
//                   <Badge icon="📍" label={`${snap?.shipCity ?? ''} ${countryFlag}`.trim()} />
//                 )}
//                 {(snap?.etaMinDays || snap?.etaMaxDays) && (
//                   <Badge
//                     icon="⏳"
//                     label={
//                       snap?.etaMinDays && snap?.etaMaxDays
//                         ? `${snap.etaMinDays}–${snap.etaMaxDays} business days`
//                         : 'Estimated soon'
//                     }
//                   />
//                 )}
//               </div>
//               <p className="mt-3 text-sm text-[#7A7A90]">
//                 {snap?.email
//                   ? `A confirmation has been emailed to ${snap.email}.`
//                   : `A confirmation email is on its way.`}
//               </p>
//             </div>
//           </div>

//           {/* Artwork preview */}
//           <div className="md:col-span-5">
//             <div className="relative aspect-square w-full rounded-2xl bg-[#0E0E13] border border-white/10 overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,.45)]">
//               <div className="absolute -inset-6 rounded-[32px] bg-[radial-gradient(60%_60%_at_50%_50%,rgba(255,106,43,.18)_0%,transparent_70%)]" />
//               <Image
//                 src={artSrc || fallbackThumb}
//                 alt="Your spooky art"
//                 fill
//                 className="object-cover"
//                 priority={false}
//               />
//               <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0B0B0E] to-transparent" />
//             </div>
//           </div>
//         </div>

//         {/* Share module */}
//         <section className="mt-10 md:mt-12 rounded-2xl bg-[#111117] border border-white/10 p-5 md:p-6 shadow-[0_12px_30px_rgba(0,0,0,.45)]">
//           <div className="flex items-start justify-between gap-4 flex-wrap">
//             <div>
//               <h2 className="text-lg font-semibold">Share your spooky art</h2>
//               <p className="mt-1 text-sm text-[#B9B9C6]">
//                 Show your friends what you conjured. Get <span className="text-white font-medium">10% off</span> your next print when they order.
//               </p>
//             </div>

//             <div className="flex gap-2">
//               <button
//                 onClick={copyReferral}
//                 title={buttonTitle}
//                 className="inline-flex items-center gap-2 rounded-full bg-[#FF6A2B] hover:bg-[#FF814E] px-4 py-2 text-sm font-medium shadow-[0_0_0_6px_rgba(255,106,43,.15)] transition-transform active:scale-[.99] disabled:opacity-50"
//                 disabled={!referral}
//               >
//                 <span>Copy link</span>
//               </button>

//               <button
//                 onClick={webShare}
//                 title={buttonTitle}
//                 className="inline-flex items-center gap-2 rounded-full border border-[#7B5CFF] text-white px-4 py-2 text-sm font-medium hover:bg-[#7B5CFF]/10 transition-colors disabled:opacity-50"
//                 disabled={!referral || !canShare}
//               >
//                 Share…
//               </button>
//             </div>
//           </div>

//           {/* Pretty referral pill */}
//           <div className="mt-4 rounded-xl bg-[#0F0F15] border border-white/10 px-3.5 py-2.5 text-sm text-[#B9B9C6] break-all">
//             {referral ? (
//               <div className="flex items-center justify-between gap-3">
//                 <span className="truncate">{referral}</span>
//                 <button
//                   className="rounded-full px-3 py-1 text-xs bg-white/10 hover:bg-white/15"
//                   onClick={copyReferral}
//                 >
//                   Copy
//                 </button>
//               </div>
//             ) : (
//               'Generating your link…'
//             )}
//           </div>

//           {/* Share fallbacks if Web Share is missing */}
//           {!canShare && referral && (
//             <div className="mt-3 flex flex-wrap items-center gap-2">
//               <ShareLink href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(referral)}`}>
//                 Share on X
//               </ShareLink>
//               <ShareLink href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referral)}`}>
//                 Share on Facebook
//               </ShareLink>
//               <ShareLink href={referral}>
//                 Copy & paste anywhere
//               </ShareLink>
//             </div>
//           )}
//         </section>

//         {/* Next actions */}
//         <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
//           <ActionCard
//             title="Order another print"
//             desc="Try a framed poster or a larger size."
//             cta="Browse products"
//             href="/products"
//           />
//           <ActionCard
//             title="Follow us on Instagram"
//             desc="Find cozy-spooky inspo & tips."
//             cta="Open Instagram"
//             href="https://instagram.com/"
//             external
//           />
//           <ActionCard
//             title="Invite a friend"
//             desc="They get 10% off, you get 10% off."
//             cta="Share your link"
//             onClick={copyReferral}
//           />
//         </section>
//       </div>

//       {/* Tiny toast */}
//       <div
//         role="status"
//         aria-live="polite"
//         className={`pointer-events-none fixed left-1/2 -translate-x-1/2 bottom-6 transition-all ${
//           toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
//         }`}
//       >
//         <div className="rounded-full bg-[#111117] border border-white/10 px-4 py-2 text-sm shadow-[0_8px_20px_rgba(0,0,0,.45)]">
//           {toast}
//         </div>
//       </div>

//       {/* Page styles for ghost animations */}
//       <style jsx>{`
//         @keyframes drift1 {
//           0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: .7; }
//           50%{ transform: translateY(-16px) translateX(4px) rotate(2deg); opacity: .9; }
//           100%{ transform: translateY(0) translateX(0) rotate(0deg); opacity: .7; }
//         }
//         @keyframes drift2 {
//           0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: .6; }
//           50%{ transform: translateY(-10px) translateX(-6px) rotate(-3deg); opacity: .85; }
//           100%{ transform: translateY(0) translateX(0) rotate(0deg); opacity: .6; }
//         }
//       `}</style>
//     </main>
//   )
// }

// /* ---------- small components ---------- */

// function Badge({ icon, label }: { icon: string; label: string }) {
//   return (
//     <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-sm">
//       <span aria-hidden>{icon}</span>
//       <span className="text-[#B9B9C6]">{label}</span>
//     </span>
//   )
// }

// function ShareLink({
//   href,
//   children,
// }: {
//   href: string
//   children: React.ReactNode
// }) {
//   return (
//     <a
//       href={href}
//       target={href.startsWith('http') ? '_blank' : undefined}
//       rel="noreferrer"
//       className="text-xs rounded-full border border-white/10 px-3 py-1 text-[#B9B9C6] hover:bg-white/10"
//     >
//       {children}
//     </a>
//   )
// }

// function ActionCard({
//   title,
//   desc,
//   cta,
//   href,
//   external,
//   onClick,
// }: {
//   title: string
//   desc: string
//   cta: string
//   href?: string
//   external?: boolean
//   onClick?: () => void
// }) {
//   const inner = (
//     <div className="h-full rounded-2xl bg-[#111117] border border-white/10 p-4 shadow-[0_12px_30px_rgba(0,0,0,.45)] hover:shadow-[0_16px_34px_rgba(0,0,0,.55)] transition-shadow">
//       <div className="font-semibold">{title}</div>
//       <p className="mt-1 text-sm text-[#B9B9C6]">{desc}</p>
//       <div className="mt-3">
//         <span className="inline-flex items-center gap-1 rounded-full text-sm px-3 py-1 border border-[#7B5CFF] text-white hover:bg-[#7B5CFF]/10">
//           {cta}
//         </span>
//       </div>
//     </div>
//   )
//   if (href) {
//     return external ? (
//       <a href={href} target="_blank" rel="noreferrer">
//         {inner}
//       </a>
//     ) : (
//       <a href={href}>{inner}</a>
//     )
//   }
//   return <button onClick={onClick} className="text-left w-full">{inner}</button>
// }

// function GhostConfetti() {
//   return (
//     <div className="pointer-events-none absolute inset-0 overflow-hidden">
//       {/* top-left */}
//       <Ghost style={{ left: '6%', top: '12%', animation: 'drift1 6s ease-in-out infinite' }} />
//       {/* top-right */}
//       <Ghost style={{ right: '8%', top: '18%', animation: 'drift2 7s ease-in-out infinite' }} />
//       {/* mid-left */}
//       <Ghost style={{ left: '12%', top: '46%', animation: 'drift2 8s ease-in-out infinite' }} />
//       {/* bottom-right */}
//       <Ghost style={{ right: '10%', bottom: '12%', animation: 'drift1 7.5s ease-in-out infinite' }} />
//     </div>
//   )
// }

// function Ghost({ style }: { style?: React.CSSProperties }) {
//   return (
//     <svg
//       width="48"
//       height="48"
//       viewBox="0 0 48 48"
//       fill="none"
//       className="absolute opacity-70"
//       style={style}
//       aria-hidden
//     >
//       <path
//         d="M24 6c7.18 0 13 5.82 13 13v17.5c0 1.6-1.88 2.42-3.05 1.32l-1.7-1.62a2 2 0 0 0-2.75.05l-1.74 1.74a2 2 0 0 1-2.82 0l-1.66-1.66a2 2 0 0 0-2.83 0l-1.66 1.66a2 2 0 0 1-2.82 0l-1.74-1.74A2 2 0 0 0 8 36.5V19C8 11.82 13.82 6 21 6h3z"
//         fill="url(#g)"
//       />
//       <circle cx="19" cy="19" r="2.2" fill="#0B0B0E" />
//       <circle cx="29" cy="19" r="2.2" fill="#0B0B0E" />
//       <defs>
//         <linearGradient id="g" x1="24" y1="6" x2="24" y2="40" gradientUnits="userSpaceOnUse">
//           <stop stopColor="#FFFFFF" stopOpacity=".9" />
//           <stop offset="1" stopColor="#FFFFFF" stopOpacity=".75" />
//         </linearGradient>
//       </defs>
//     </svg>
//   )
// }
import { Suspense } from 'react'
import ThankYouClient from './ThankYouClient'

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white">Loading…</div>}>
      <ThankYouClient />
    </Suspense>
  )
}