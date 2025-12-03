"use client";
import { motion } from "framer-motion";

export function SectionHeader({ title }: { title: string }) {
  return (
    <motion.h2
      className="text-xl font-semibold text-white mb-3 flex items-center gap-2"
      initial={{ opacity: 0, y: -8 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_8px_3px_rgba(255,122,255,0.6)]" />
      {title}
    </motion.h2>
  );
}
