'use client';

import React from 'react';

export function GeneratingOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl"
      aria-hidden="true"
    >
      <div
        className="
          absolute inset-0
          bg-[radial-gradient(60%_80%_at_50%_20%,rgba(16,24,16,.35),rgba(0,0,0,.6))]
        "
      />
      <div
        className="
          absolute -left-1/2 -top-1/2 h-[200%] w-[200%]
          rotate-[12deg]
          bg-gradient-to-r from-white/0 via-white/25 to-white/0
          [animation:jolly-shimmer_2.4s_linear_infinite]
          mix-blend-screen
        "
        style={{
          maskImage:
            'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)',
        }}
      />
      <div className="absolute inset-0">
        {Array.from({ length: 18 }).map((_, i) => {
          const t = i / 18;
          const x = Math.round(6 + ((t * 88 + (i * 11) % 9))) + '%';
          const y = Math.round(4 + (((1 - t) * 88 + (i * 7) % 13))) + '%';
          const d = (0.9 + (i % 5) * 0.15).toFixed(2) + 's';
          const s = 0.6 + ((i * 3) % 4) * 0.15;
          return (
            <span
              key={i}
              className="absolute block rounded-full bg-white/85 shadow-[0_0_16px_rgba(255,255,255,0.65)] [animation:jolly-twinkle_2.2s_ease-in-out_infinite]"
              style={{ left: x, top: y, width: s * 2, height: s * 2, animationDelay: d }}
            />
          );
        })}
      </div>
    </div>
  );
}
