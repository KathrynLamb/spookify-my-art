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
          <h2 className="text-xl font-bold mb-2 text-center">Join Spookify</h2>
          <p className="text-sm text-white/70 mb-6 text-center">
            Save your spooky creations, redo images, and track orders.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => signIn("google")}
              className="flex items-center justify-center gap-2 rounded-full bg-[#FF6A2B] hover:bg-[#FF814E] py-2.5 font-medium text-black"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="fill-current">
                <path d="M12 2a10 10 0 1 0 0 20 9.77 9.77 0 0 0 6.92-2.71L16 16.4a5.87 5.87 0 1 1-1.51-9.37l2.23-2.23A9.78 9.78 0 0 0 12 2Z" />
              </svg>
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
