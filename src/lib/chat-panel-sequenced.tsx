'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

type Role = 'user' | 'ai';
type Line = { id: string; role: Role; text: string };

/* ================== THEME ================== */
/* ================== THEME (adds pink/amber stops for borders) ================== */
const COLORS = {
  panel: '#0F1014',
  border: '#24262B',
  ink:   '#0B0B0D',

  userGlassTop:  'rgba(255, 197, 140, 0.10)',   // warm
  userGlassBot:  'rgba(255, 255, 255, 0.04)',
  userStroke:    'rgba(255, 177, 120, 0.25)',
  userText:      '#F6F2EA',

  aiGlassTop:    'rgba(18, 22, 28, 0.70)',      // cool
  aiGlassBot:    'rgba(18, 22, 28, 0.55)',
  aiStroke:      'rgba(120, 255, 208, 0.18)',
  aiText:        'rgba(224, 246, 239, 0.94)',

  // 💖 add these back:
  pink1:  '#F0ABFC',  // fuchsia-300/400 vibe
  pink2:  '#FB7185',  // rose-400
  amb1:   '#FBBF24',  // amber-300
  amb2:   '#F59E0B',  // amber-400

  gold:   '#D7B46A',
};

  

/* ================== DEMO SCRIPT (stable ids) ================== */
const SCRIPT: Line[] = [
  { id: 'u1', role: 'user', text: 'Hey! Can you turn this beach snap into a Christmas card? 📸➡️🎄' },
  { id: 'a1', role: 'ai', text: 'Absolutely—faces stay identical, and I’ll paint a cozy winter wonderland. ❄️' },
  { id: 'u2', role: 'user', text: 'Watercolor with a pine wreath—warm and classy, please.' },
  { id: 'a2', role: 'ai', text: 'On it. Elegant serif greeting on museum-matte paper… ✨' },
  { id: 'u3', role: 'user', text: 'Love it. Approve and print the set! ✅' },
];

const PRE_TYPING_MS = 550;
const HOLD_AFTER_MS = 650;

/* ================== TYPEWRITER ================== */
const perCharDelay = (ch: string) =>
  /[!?]/.test(ch) ? 120 : /[.,…]/.test(ch) ? 90 : /\s/.test(ch) ? 18 : 16;

function useTypewriter(text: string, playing: boolean) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => setI(0), [text]);

  useEffect(() => {
    if (!playing) return;
    if (reduced) {
      setI(text.length);
      return;
    }
    if (i >= text.length) return;
    const t = setTimeout(() => setI((n) => n + 1), perCharDelay(text[i]));
    return () => clearTimeout(t);
  }, [i, text, playing, reduced]);

  return { out: text.slice(0, i), running: i < text.length };
}

/* ================== BUBBLE with headline-gradient border ================== */
/* ================== BUBBLE with static ombré border per role ================== */
function Bubble({ role, children }: { role: Role; children: React.ReactNode }) {
    const isUser = role === 'user';
  
    // keep your glass fills exactly the same
    const bg = isUser
      ? `linear-gradient(180deg, ${COLORS.userGlassTop}, ${COLORS.userGlassBot})`
      : `linear-gradient(180deg, ${COLORS.aiGlassTop}, ${COLORS.aiGlassBot})`;
  
    const text = isUser ? COLORS.userText : COLORS.aiText;
  
    // very subtle 1px ombré ring that matches the headline palette
    // user (pink→rose), ai (amber→gold), static (no animation)
    const ring = isUser
      ? `linear-gradient(135deg, ${COLORS.pink1}, ${COLORS.pink2})`
      : `linear-gradient(135deg, ${COLORS.amb1}, ${COLORS.amb2})`;
  
    return (
      <motion.div
        initial={false}
        layout="position"
        transition={{ layout: { duration: 0 } }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className="relative max-w-[92%] rounded-[14px] px-3.5 py-2.5 text-[13.5px] leading-snug"
          style={{
            // layer 1: glass fill on padding-box
            // layer 2: gradient ring on border-box (shows as hairline)
            backgroundImage: `${bg}, ${ring}`,
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            border: '1px solid transparent',
  
            color: text,
            backdropFilter: 'saturate(120%) blur(6px)',
            WebkitBackdropFilter: 'saturate(120%) blur(6px)',
            boxShadow: `
              0 10px 26px rgba(0,0,0,.35),
              inset 0 1px 0 rgba(255,255,255,.06)
            `,
            borderRadius: 14,
          } as React.CSSProperties}
        >
          {/* soft edge sheen (kept subtle) */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-12 rounded-[14px] opacity-[.08]"
            style={{
              background: 'linear-gradient(90deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%)',
              maskImage:  'linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
            }}
          />
          {children}
        </div>
      </motion.div>
    );
  }
  

const Cursor = ({ active }: { active: boolean }) => (
  <motion.span
    aria-hidden
    initial={{ opacity: 0 }}
    animate={{ opacity: active ? [1, 0, 1] : 0 }}
    transition={{ duration: 0.9, repeat: active ? Infinity : 0 }}
    className="ml-[2px] inline-block h-[1.1em] w-[1.5px] align-[-2px] bg-[#D7B46A]"
  />
);

/* ================== CHAT (glitch-free sequencing) ================== */
export function ChatPanelSequenced({
  script = SCRIPT,
  onReplay,
}: {
  script?: Line[];
  onReplay?: () => void;
}) {
  const [playing, setPlaying] = useState(true);
  const [step, setStep] = useState(0); // committed count
  const [phase, setPhase] = useState<'pre' | 'typing' | 'hold'>('pre');

  const activeIndex = step;
  const active = script[activeIndex];

  const { out, running } = useTypewriter(active?.text ?? '', playing && phase === 'typing');

  // phase machine: pre → typing → hold → commit
  useEffect(() => {
    if (!playing || !active) return;

    if (phase === 'pre') {
      const t = setTimeout(() => setPhase('typing'), PRE_TYPING_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'typing' && !running) {
      const t = setTimeout(() => setPhase('hold'), HOLD_AFTER_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'hold') {
      const t = setTimeout(() => {
        setStep((s) => s + 1);
        setPhase('pre');
      }, 40);
      return () => clearTimeout(t);
    }
  }, [phase, running, active, playing]);

  // visible messages include the active one; all nodes have stable keys (no remount)
  const visible = useMemo(
    () => script.slice(0, Math.min(active ? activeIndex + 1 : activeIndex, script.length)),
    [script, active, activeIndex]
  );

  const replay = () => {
    setPlaying(true);
    setStep(0);
    setPhase('pre');
    onReplay?.();
  };

  return (
    <div
      className="mt-3 rounded-2xl border p-3"
      style={{ background: COLORS.panel, borderColor: COLORS.border }}
    >
      <div className="mb-2 flex items-center justify-between text-xs text-white/60">
        <span>Chat with AI</span>
        <span>{step >= script.length ? 'Done' : 'Live preview · No audio'}</span>
      </div>

      <div className="space-y-2" aria-live="polite">
        {visible.map((m, i) => {
          const isActive = i === activeIndex && !!active;
          const text = isActive ? (phase === 'typing' ? out : active!.text) : m.text;

          return (
            <Bubble key={m.id} role={m.role}>
              <span>
                {text}
                {isActive && phase === 'typing' ? <Cursor active /> : null}
              </span>
            </Bubble>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-white/70">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 backdrop-blur hover:border-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            {playing ? 'Pause' : 'Play'}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={replay}
            className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 backdrop-blur hover:border-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            Replay
          </button>
          <span className="opacity-70">
            {Math.min(step, script.length)} / {script.length}
          </span>
        </div>
      </div>
    </div>
  );
}
