'use client';

import React from 'react';
import Image from 'next/image';
import { Ghost } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import {
  Comparison,
  ComparisonItem,
  ComparisonHandle,
} from '@/components/ui/shadcn-io/comparison/index';

type LanternSliderProps = {
  beforeSrc: string;
  afterSrc: string;
  alt: string;
  priority?: boolean;
  start?: number;
  startAt?: 'left' | 'center' | 'right';
};

// 💨 subtle smoke floating animation
const smokeVariants: Variants = {
  float: {
    x: [-30, 30, -15, 0],
    y: [10, -20, 15, 0],
    opacity: [0.4, 0.8, 0.2, 0.5],
    transition: {
      duration: 6,
      repeat: Infinity,
      repeatType: 'mirror',
    },
  },
};

export default function LanternSlider({
  beforeSrc,
  afterSrc,
  alt,
  priority = false,
  start,
  startAt = 'center',
}: LanternSliderProps) {
  // Map startAt → numeric position
  const startFromAt =
    startAt === 'left' ? 0.2 :
    startAt === 'right' ? 0.8 :
    0.5; // center fallback

  // Prefer explicit numeric start if given; otherwise use startAt mapping
  const effectiveStart = start ?? startFromAt;

  // Clamp to [0.05, 0.95] so handle is visible on first render
  const initial = Math.min(0.95, Math.max(0.05, effectiveStart));

  return (
    <Comparison
      className="relative w-full aspect-square"
      mode="drag"
      defaultValue={initial}
    >
      <ComparisonItem position="left">
        <Image
          src={beforeSrc}
          alt={`${alt} – before`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={priority}
          className="object-cover"
        />
      </ComparisonItem>

      <ComparisonItem position="right">
        <Image
          src={afterSrc}
          alt={`${alt} – after`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={priority}
          className="object-cover"
        />
      </ComparisonItem>

      <ComparisonHandle>
        {/* floating smoke shimmer */}
        <motion.div
          aria-hidden
          className="absolute inset-0 pointer-events-none overflow-visible"
          style={{ left: 0 }}
        >
          <motion.div
            className="w-20 h-20 rounded-full blur-2xl
                       bg-[radial-gradient(circle,_rgba(255,255,255,0.15)_0%,_rgba(255,255,255,0)_70%)]"
            variants={smokeVariants}
            animate="float"
          />
        </motion.div>

        {/* grab handle */}
        <div
          className="relative z-50 flex h-full w-12 items-center justify-center"
          role="separator"
          aria-label="Drag to reveal"
        >
          <Ghost className="h-6 w-6 text-orange-500 drop-shadow-md" />
        </div>
      </ComparisonHandle>
    </Comparison>
  );
}
