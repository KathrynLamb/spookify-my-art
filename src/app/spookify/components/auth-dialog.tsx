"use client";

import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

export function AuthDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-6 text-white shadow-xl"
        >
          <h2 className="text-xl font-bold mb-2 text-center">Join Ai Gifts</h2>
          <p className="text-sm text-white/70 mb-6 text-center">
            Save your creations, redo images, and track orders.
          </p>

          <div className="flex flex-col gap-3">
          <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="flex items-center justify-center gap-2 rounded-full bg-[#FF6A2B] hover:bg-[#FF814E] py-2.5 font-medium text-black"
            >
              Continue with Google
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-white/15 py-2.5 text-sm text-white/80 hover:bg-white/10"
            >
              Maybe later
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
