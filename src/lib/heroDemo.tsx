import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Stars } from "lucide-react";
import { ChatPanelSequenced } from "./chat-panel-sequenced";

function usePRM() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(mq.matches);
    const cb = (e: MediaQueryListEvent) => setR(e.matches);
    mq.addEventListener?.("change", cb);
    return () => mq.removeEventListener?.("change", cb);
  }, []);
  return r;
}

export function HeroImageWithChatBelow() {
  const reduced = usePRM();

  // === theme colors (match site) ===
  const panel = "#111216";
  const border = "#24262B";
  // const userBg = "rgba(255,255,255,0.96)";
  // const userFg = "#0B0B0D";
  // const aiBg = "rgba(12,59,46,0.14)";           // evergreen at ~14%
  // const aiRing = "rgba(16, 145, 95, 0.22)";     // subtle ring
  // const aiFg = "rgba(192, 255, 225, 0.92)";     // minty readable on dark

  // assets
  const beforeSrc = "/before_after_gallery/Xmas_cards_photo.png"; // phone photo
  const afterSrc  = "/before_after_gallery/Xmas_card_box.png";    // printed cards

  // chat playback state
  const step = 0;
  const typed = "";
  const approved = false;
  const playing =  true

  console.log(step, typed, playing)

  // const current = SCRIPT[Math.min(step, SCRIPT.length - 1)];
  const speed = reduced ? 0 : 16;
  console.log(speed)

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      // SIZE LOCK: same width as left copy (max-w-xl). Change if your left uses a different value.
      className="w-full max-w-xl justify-self-end rounded-3xl"
    >
      {/* Top image panel */}
      <div
        className="relative overflow-hidden rounded-3xl p-3 ring-1"
        style={{ background: panel, borderColor: border } as React.CSSProperties}
      >
        <div className="relative overflow-hidden rounded-2xl">
          {/* BEFORE */}
          <Image
            src={beforeSrc}
            alt="Original phone photo"
            width={1400}
            height={1000}
            priority
            className="h-auto w-full object-cover"
          />

          {/* AFTER */}
          <AnimatePresence>
            {approved && (
              <motion.div
                key="after"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.5 }}
                className="absolute inset-0"
              >
                <Image
                  src={afterSrc}
                  alt="Printed Christmas cards and envelopes in a box"
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Labels */}
          <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs backdrop-blur">
            {approved ? "Result" : "Original"}
          </div>
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs backdrop-blur">
            <Stars className="h-3.5 w-3.5 opacity-80" />
            {approved ? "Lovify" : "Lovify preview"}
          </div>
        </div>

      <ChatPanelSequenced  />
      </div>
    </motion.div>
  );
}
