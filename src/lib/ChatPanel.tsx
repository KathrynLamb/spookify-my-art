'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

const COLORS = {
  panel: '#0F1014',
  border: '#24262B',
  userBg: '#F5F2EB',                  // porcelain
  userFg: '#0B0B0D',                  // ink
  aiBg: 'rgba(20,22,28,0.72)',        // charcoal glass
  aiFg: 'rgba(224,246,239,0.92)',     // soft mint
  gold: '#D7B46A',                    // hairline
};

// --- helpers ---------------------------------------------------------------

function splitChars(text: string) {
  // keep emoji + surrogate pairs intact
  return Array.from(text);
}
function baseDelayForChar(ch: string) {
  // slight pauses on punctuation to feel natural
  if (/[.,…]/.test(ch)) return 90;
  if (/[!?]/.test(ch)) return 120;
  if (/\s/.test(ch)) return 20;
  return 18; // default
}

function useTypewriterFM(
  text: string,
  playing = true,
  speedScale = 1
): [string, boolean] {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const chars = useMemo(() => splitChars(text), [text]);

  useEffect(() => {
    if (!playing) return;
    setI(0);
  }, [text, playing]);

  useEffect(() => {
    if (!playing) return;
    if (reduced) {
      setI(chars.length);
      return;
    }
    if (i >= chars.length) return;

    const delay = baseDelayForChar(chars[i]) / speedScale;
    const id = setTimeout(() => setI((n) => n + 1), delay);
    return () => clearTimeout(id);
  }, [i, chars, playing, reduced, speedScale]);

  return [chars.slice(0, i).join(''), i < chars.length];
}

// --- styled atoms ----------------------------------------------------------

const Cursor = ({ active }: { active: boolean }) => (
  <motion.span
    aria-hidden
    initial={{ opacity: 0 }}
    animate={{ opacity: active ? [1, 0, 1] : 0 }}
    transition={{ duration: 0.9, repeat: active ? Infinity : 0 }}
    className="ml-[2px] inline-block h-[1.1em] w-[1.5px] align-[-2px] bg-[#D7B46A]"
  />
);

function Bubble({
  role,
  children,
  done,
}: {
  role: 'user' | 'ai';
  children: React.ReactNode;
  done?: boolean;
}) {

  console.log("role", role, "children", children, "done", done)

  const isUser = role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30, mass: 0.6 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className="relative max-w-[92%] rounded-[14px] px-3 py-2 text-[13.5px] leading-snug"
        style={
          isUser
            ? {
                background: COLORS.userBg,
                color: COLORS.userFg,
                boxShadow:
                  '0 1px 0 rgba(255,255,255,0.08) inset, 0 10px 24px rgba(0,0,0,0.38)',
              }
            : {
                background: COLORS.aiBg,
                color: COLORS.aiFg,
                boxShadow: `0 0 0 1px ${COLORS.gold}26, 0 12px 28px rgba(0,0,0,0.36)`,
                backdropFilter: 'saturate(120%) blur(5px)',
              }
        }
      >
        {children}
        {/* gold micro-sheen when line completes */}
        <AnimatePresence>
          {done && !isUser && (
            <motion.span
              key="sheen"
              initial={{ x: '-110%' }}
              animate={{ x: '110%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="pointer-events-none absolute inset-y-0 left-0 w-16 rotate-12 bg-gradient-to-r from-transparent via-[#D7B46A22] to-transparent"
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// --- main component --------------------------------------------------------

export function ChatPanel({
  messages,          // [{ role, text }]
  typing,
  approved,
  playing,
  onTogglePlay,
  onReplay,
}: {
  messages: { role: 'user' | 'ai'; text: string }[];
  typing: boolean;
  approved: boolean;
  playing: boolean;
  onTogglePlay: () => void;
  onReplay: () => void;
}) {

  console.log("mssgs", messages)
  // show the last message typing; previous ones static
  const lastIndex = messages.length - 1;
  const last = messages[lastIndex];
  const [typed, stillTyping] = useTypewriterFM(last?.text ?? '', playing, 1);

  return (
    <div
      className="mt-3 rounded-2xl border p-3"
      style={{ background: COLORS.panel, borderColor: COLORS.border }}
    >
      <div className="mb-2 flex items-center justify-between text-xs text-white/60">
        <span>Chat with AI</span>
        <span>{approved ? 'Approved · Printed' : 'Live preview · No audio'}</span>
      </div>

      <div className="space-y-2" aria-live="polite">
      {messages.map((m, i) => {
          if (!m.text?.trim()) return null;   // ⟵ skip empties
          const isLast = i === lastIndex;
          const content = isLast ? typed : m.text;
          return (
            <Bubble key={`${i}-${m.role}`} role={m.role} done={isLast ? !stillTyping && !typing : true}>
              {isLast ? <span>{content}<Cursor active={stillTyping} /></span> : <span>{content}</span>}
            </Bubble>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-white/70">
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 backdrop-blur hover:border-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            {playing ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={onReplay}
            className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 backdrop-blur hover:border-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            Replay
          </button>
        </div>
        <span className="opacity-70">12s loop</span>
      </div>
    </div>
  );
}
