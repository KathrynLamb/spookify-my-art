"use client";

import { useEffect, useState } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export function Particles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const TEMP: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      TEMP.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 4 + 2,
        opacity: Math.random(),
      });
    }
    setParticles(TEMP);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute bg-pink-400 rounded-full blur-md"
          style={{
            width: p.size,
            height: p.size,
            left: p.x,
            top: p.y,
            opacity: p.opacity,
            transition: "transform 8s linear",
          }}
        />
      ))}
    </div>
  );
}
