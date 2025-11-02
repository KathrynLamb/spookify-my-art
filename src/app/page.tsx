'use client'

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function HomePage() {
  const brands = [
    {
      slug: "spookify",
      name: "Spookify",
      tagline: "Turn your photo into spooky wall art.",
      color: "from-orange-500/80 via-orange-600/70 to-orange-700/60",
      image: "/ai_gifts_landing/brand-spookify.png",
    },
    {
      slug: "jollyfy",
      name: "Jollyfy",
      tagline: "Make your memories merry & bright.",
      color: "from-red-400/80 via-amber-500/70 to-rose-500/60",
      image: "/ai_gifts_landing/brand-jollyfy.png",
    },
    {
      slug: "lovify",
      name: "Lovify",
      tagline: "Transform love into lasting keepsakes.",
      color: "from-pink-400/80 via-rose-500/70 to-red-500/60",
      image: "/ai_gifts_landing/brand-lovify.png",
    },
    {
      slug: "petify",
      name: "Petify",
      tagline: "Turn your pet into art worth wagging about.",
      color: "from-emerald-400/80 via-teal-500/70 to-cyan-500/60",
      image: "/ai_gifts_landing/brand-petify.png",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#090909] via-[#0d0d0d] to-[#111] text-white">
      {/* Floating glow background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-200px] left-[40%] w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-300px] left-[10%] w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute top-[200px] right-[10%] w-[400px] h-[400px] bg-orange-400/10 rounded-full blur-3xl" />
      </div>

      {/* Hero */}
      <section className="relative max-w-5xl mx-auto px-6 pt-32 pb-24 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6"
        >
          Turn memories into{" "}
          <span className="bg-gradient-to-r from-fuchsia-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
            magic
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white/70 max-w-2xl mx-auto text-lg leading-relaxed mb-10"
        >
          From haunting Halloween portraits to heartfelt Christmas gifts,{" "}
          <span className="text-white">AI Gifts</span> transforms your photos into
          museum-grade prints, cards, and keepsakes — crafted by AI, printed by world-class partners.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Link
            href="/spookify"
            className="px-7 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full font-medium text-black hover:opacity-90 transition shadow-lg shadow-orange-500/20"
          >
            Try Spookify
          </Link>
          <Link
            href="/jollyfy"
            className="px-7 py-3 bg-gradient-to-r from-red-500 to-amber-500 rounded-full font-medium text-black hover:opacity-90 transition shadow-lg shadow-red-500/20"
          >
            Try Jollyfy
          </Link>
        </motion.div>
      </section>

      {/* Brand Grid */}
      <section className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-10 px-6 pb-32">
        {brands.map((b, i) => (
          <motion.div
            key={b.slug}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
          >
            <Link href={`/${b.slug}`}>
              <motion.div
                whileHover={{ scale: 1.04, y: -3 }}
                className={`rounded-2xl overflow-hidden bg-gradient-to-br ${b.color} p-[2px] transition-all duration-300`}
              >
                <div className="bg-[#121212] rounded-2xl flex flex-col justify-between h-full">
                  <div className="p-5 pb-3">
                    <h3 className="text-xl font-semibold mb-1">{b.name}</h3>
                    <p className="text-sm text-white/70 leading-snug">{b.tagline}</p>
                  </div>
                  <div className="relative aspect-square overflow-hidden rounded-b-2xl">
                    <Image
                      src={b.image}
                      alt={b.name}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </section>

      {/* Why AI Gifts */}
      <section className="max-w-3xl mx-auto px-6 text-center pb-24">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-6"
        >
          Crafted with care, printed to perfection.
        </motion.h2>
        <p className="text-white/70 text-lg leading-relaxed">
          Every AI Gifts creation starts with your imagination.  
          We enhance it using responsible AI models, print it sustainably through trusted
          partners like <span className="text-white">Gelato</span> and <span className="text-white">Prodigi</span>,
          and deliver it beautifully packaged — ready to gift, or keep forever.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 text-center text-white/60 text-sm">
        <p>© {new Date().getFullYear()} AI Gifts · Made with ❤️ by Kathryn Lamb</p>
        <p className="mt-2 text-white/50">
          Printed sustainably · Ships to 30+ countries · Powered by AI + artistry
        </p>
      </footer>
    </main>
  );
}
