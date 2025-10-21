'use client';
import { useState } from 'react';
import FogAutoplay from './fogwipe';
import LanternSlider from './lantern-slider';

export function HeroSpooky() {
  const [done, setDone] = useState(false);
  const before = '/before_after_gallery/prom.png';
  const after  = '/before_after_gallery/prom_spookified.png';

  const LINGER_MS = 2500; // keep the spookified image up a bit before slider

  return (
    <div className="relative w-full aspect-square rounded-xl overflow-hidden">
      {!done ? (
        <FogAutoplay
          before={before}
          after={after}
          onComplete={() => setTimeout(() => setDone(true), LINGER_MS)}
        />
      ) : (
        <LanternSlider
          beforeSrc={before}
          afterSrc={after}
          alt="Spookified preview"
          priority
          startAt="right"         // <— start the handle on the right
        />
      )}
    </div>
  );
}
