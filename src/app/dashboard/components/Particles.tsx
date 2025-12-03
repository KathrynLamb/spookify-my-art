"use client";
import { motion } from "framer-motion";

export function Particles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
      {[...Array(18)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-pink-400 rounded-full"
          initial={{
            x: Math.random() * 800 - 400,
            y: Math.random() * 800 - 400,
            opacity: 0
          }}
          animate={{
            y: ["0%", "-300%", "100%"],
            opacity: [0.2, 0.5, 0],
          }}
          transition={{
            duration: 12 + Math.random() * 10,
            repeat: Infinity,
            delay: i * 0.7,
          }}
        />
      ))}
    </div>
  );
}
