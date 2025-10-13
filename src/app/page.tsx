
// src/app/(marketing)/page.tsx
import Image from "next/image";
import Link from "next/link";
import FogWipe from "./components/fogwipe";

import LanternSlider from "./components/lantern-slider";

export const metadata = {
  title: "Spookify — Turn any photo into haunting wall art",
  description:
    "Upload your photo, pick a vibe, and get museum-grade prints delivered. Framed or matte poster — fast, simple, spooky.",
};

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-black text-white">
      {/* --- Background grid glow --- */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(1250px_600px_at_50%_-10%,rgba(255,82,0,.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_10%_10%,rgba(168,85,247,.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(#101015_1px,transparent_1px),linear-gradient(90deg,#101015_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      {/* --- HERO --- */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <p className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur">
                New • Framed & Poster prints live
              </p>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-6xl">
                Turn your photo into <span className="text-orange-400">spooky</span> wall art
              </h1>
              <p className="mt-4 max-w-xl text-white/70">
                Upload a photo, tell us the vibe, and we’ll conjure a print-ready artwork in minutes.
                Museum-grade paper, premium wood frames, global delivery.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/upload"
                  className="rounded-full bg-orange-600 px-5 py-3 text-sm font-medium hover:bg-orange-500"
                >
                  Upload a photo
                </Link>
                <Link
                  href="/products"
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium hover:bg-white/10"
                >
                  Browse products
                </Link>
              </div>

              <div className="mt-6 flex items-center gap-4 text-xs text-white/60">
                <Stars />
                <span>Loved by creators & parents</span>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline">Ships to 30+ countries</span>
              </div>
            </div>

            {/* <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e11] shadow-xl">
        
              <Image
                src="/before_after_gallery/smile.png"
                alt="Original"
                fill
                className="object-cover opacity-0 md:opacity-100"
                sizes="(min-width:1024px) 560px, 100vw"
                priority
              />
              <Image
                src="https://fpabsqys5cky7azh.public.blob.vercel-storage.com/spookified-1253911a-fdaa-46c8-8907-6c0de24f011c-M2VlkfGKR2oJKp63PrcVqhGOv3SiLs.png"
                alt="Spookified result"
                fill
                className="object-cover"
                sizes="(min-width:1024px) 560px, 100vw"
                priority
              />
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
            </div> */}
            <FogWipe
                before="/before_after_gallery/smile.png"
                after="https://fpabsqys5cky7azh.public.blob.vercel-storage.com/spookified-1253911a-fdaa-46c8-8907-6c0de24f011c-M2VlkfGKR2oJKp63PrcVqhGOv3SiLs.png"
                // after="/before_after_gallery/spookified_dad.png"

              />
          </div>
        </div>
      </section>

      {/* --- SOCIAL PROOF STRIP --- */}
      {/* <section className="border-y border-white/10 bg-white/5/10 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-6 text-white/60">
          <LogoRow />
        </div>
      </section> */}

      {/* --- HOW IT WORKS --- */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <h2 className="mb-8 text-center text-3xl font-bold md:text-4xl">How it works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="1) Upload" desc="Drop a photo. We’ll guide style & spookiness." icon="📤" />
          <Card title="2) Spookify" desc="Confirm the vibe; we generate a print-perfect file." icon="🪄" />
          <Card title="3) Print" desc="Pick size & frame. Delivered fast, worldwide." icon="🖼️" />
        </div>
      </section>

      {/* --- PRODUCT HIGHLIGHT --- */}
      <section className="mx-auto max-w-7xl px-4 pb-8 md:pb-12">
        <div className="grid gap-6 md:grid-cols-2">
          <ProductTeaser
            headline="Premium Wooden Framed Poster"
            copy="Semi-gloss 200 gsm behind plexiglass in hardwood frames. Ready-to-hang."
            cta={{ href: "/products", label: "Choose frame" }}
            image="/livingroom_frame_1.png"
            badge="Most popular"
          />
          <ProductTeaser
            headline="Museum-Quality Matte Poster"
            copy="Archival 200 gsm matte paper. Rich color, glare-free finish."
            cta={{ href: "/products", label: "Pick a size" }}
            image="/poster.png"
          />
        </div>
      </section>
      
       {/* --- GALLERY / BEFORE-AFTER --- */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <h2 className="mb-8 text-center text-3xl font-bold md:text-4xl">Before → After</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <GalleryItem before="/before_after_gallery/famPicnic_spookified.png" after="/before_after_gallery/famPicnic.png" />

          <GalleryItem before="https://fpabsqys5cky7azh.public.blob.vercel-storage.com/spookified-1253911a-fdaa-46c8-8907-6c0de24f011c-M2VlkfGKR2oJKp63PrcVqhGOv3SiLs.png" after="/before_after_gallery/smile.png" />
          <GalleryItem before="/before_after_gallery/city_spookified.png" after="/before_after_gallery/city.png" />
          <GalleryItem before="/before_after_gallery/landscape_spookified.png" after="/before_after_gallery/landscape.png" />

          <GalleryItem before="/before_after_gallery/pets_spookified.png" after="/before_after_gallery/pets.png" />
          <GalleryItem before="/before_after_gallery/wedding_WD_spookified.png" after="/before_after_gallery/wedding.png" />

        </div>
      </section>

      {/* --- FAQ (compact) --- */}
      <section className="mx-auto max-w-5xl px-4 pb-16 md:pb-20">
        <h2 className="mb-6 text-center text-2xl font-semibold md:text-3xl">FAQ</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Faq q="What sizes do you offer?" a="Common EU sizes from 13×18 up to 70×100 cm (28×40”). US sizes soon." />
          <Faq q="Do you ship worldwide?" a="We fulfill locally in many regions for fast shipping and lower emissions." />
          <Faq q="Can I choose a frame color?" a="Yes—Black, White, Natural Wood, and Dark Wood, depending on size/orientation." />
          <Faq q="Is my image safe?" a="Your uploads are private; we only use them to generate and print your art." />
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="mx-auto max-w-7xl px-4 pb-24">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-orange-600/20 to-purple-600/20 p-8 text-center backdrop-blur">
          <h3 className="text-2xl font-bold md:text-3xl">Ready to Spookify your photo?</h3>
          <p className="mx-auto mt-2 max-w-2xl text-white/70">
            Create a haunting keepsake in minutes. Try it free—pay only when you’re ready to print.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/upload"
              className="rounded-full bg-orange-600 px-5 py-3 text-sm font-medium hover:bg-orange-500"
            >
              Start now
            </Link>
            <Link
              href="/products"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium hover:bg-white/10"
            >
              See products
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ----------------- Small atoms below (kept local for a single-file MVP) ----------------- */

function Stars() {
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 20 20" className="fill-orange-400">
          <path d="M10 1.5 12.9 7l6 .9-4.4 4.3 1 6-5.4-2.9L4.7 18l1-6L1.3 7.9l6-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

function Card({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 font-semibold">{title}</div>
      <p className="mt-1 text-sm text-white/70">{desc}</p>
    </div>
  );
}

function ProductTeaser({
  headline,
  copy,
  cta,
  image,
  badge,
}: {
  headline: string;
  copy: string;
  image: string;
  badge?: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e11] p-5 md:p-6">
      {badge && (
        <span className="absolute right-4 top-4 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur">
          {badge}
        </span>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="relative h-56 w-full overflow-hidden rounded-xl bg-black/40">
          <Image
            src={image}
            alt={headline}
            fill
            className="object-cover"
            sizes="(min-width:1024px) 420px, 100vw"
          />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold">{headline}</h3>
          <p className="mt-2 flex-1 text-sm text-white/70">{copy}</p>
          <div className="mt-4">
            <Link
              href={cta.href}
              className="inline-flex rounded-full bg-orange-600 px-4 py-2 text-sm font-medium hover:bg-orange-500"
            >
              {cta.label}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function GalleryItem({ before, after }: { before: string; after: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e11]">
      <LanternSlider
        before={before}
        after={after}
        alt="Before and after"
        start={0.55}
        className="h-64 w-full"
      />
      {/* glow + label */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white/85 backdrop-blur">
        Drag the lantern →
      </div>
    </div>
  )
}


function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="font-medium">{q}</div>
      <p className="mt-1 text-sm text-white/70">{a}</p>
    </div>
  );
}

// function LogoRow() {
//   const logos = [
//     { src: "/logos/press-1.svg", alt: "Logo 1" },
//     { src: "/logos/press-2.svg", alt: "Logo 2" },
//     { src: "/logos/press-3.svg", alt: "Logo 3" },
//     { src: "/logos/press-4.svg", alt: "Logo 4" },
//   ];
//   return (
//     <div className="mx-auto grid w-full max-w-5xl grid-cols-2 items-center gap-6 opacity-70 sm:grid-cols-4">
//       {logos.map((l) => (
//         <div key={l.alt} className="relative h-8 w-full">
//           <Image src={l.src} alt={l.alt} fill className="object-contain" />
//         </div>
//       ))}
//     </div>
//   );
// }
