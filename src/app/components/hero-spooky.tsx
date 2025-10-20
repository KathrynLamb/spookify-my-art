'use client';
import { useState } from 'react';
import FogAutoplay from './fogwipe';
// import FogAutoplay from './components/fogwipe';
import LanternSlider from './lantern-slider';

export function HeroSpooky() {
  const [done, setDone] = useState(false);
  const before = '/before_after_gallery/prom.png';
  const after  = '/before_after_gallery/prom_spookified.png';

  return (
    <div className="relative h-[420px] md:h-[520px] rounded-xl overflow-hidden">
      {!done ? (
        <FogAutoplay before={before} after={after} onComplete={() => setDone(true)} />
      ) : (
        <LanternSlider beforeSrc={before} afterSrc={after} alt="Spookified preview" priority />
      )}
    </div>
  );
}
