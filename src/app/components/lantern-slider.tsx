
'use client';

// import { Comparison, ComparisonHandle, ComparisonItem } from '@/components/ui/shadcn-io/comparison';
import Image from 'next/image';
import { Ghost} from 'lucide-react'; // your lantern SVG/icon
import { Comparison, ComparisonHandle, ComparisonItem } from '@/components/ui/shadcn-io/comparison/index';
import { motion } from 'framer-motion';

interface LanternSliderProps {
  beforeSrc: string;
  afterSrc: string;
  alt: string;
  priority?: boolean;
}

export default function LanternSlider({ beforeSrc, afterSrc, alt, priority = false }: LanternSliderProps) {
  return (
    <Comparison className="w-full aspect-square relative" mode="drag">
      <ComparisonItem position="left">
        <Image src={beforeSrc} alt={`${alt} – before`} fill sizes="(max-width: 768px) 100vw, 50vw" priority={priority} className="object-cover" />
      </ComparisonItem>
      <ComparisonItem position="right">
        <Image src={afterSrc} alt={`${alt} – after`} fill sizes="(max-width: 768px) 100vw, 50vw" priority={priority} className="object-cover" />
      </ComparisonItem>
      {/* <ComparisonHandle>
     
        <div className="relative z-50 flex items-center justify-center h-full w-12">
          <Ghost className="h-6 w-6 text-orange-500 drop-shadow-md" />
        </div>
      </ComparisonHandle> */}
      <ComparisonHandle>
  {/* Smoke effect container */}
  <motion.div
    aria-hidden
    className="absolute inset-0 pointer-events-none overflow-visible"
    style={{ left: 0 }}
  >
    {/* Smoke puff */}
    <motion.div
      className="w-20 h-20 bg-[radial-gradient(circle,_rgba(255,255,255,0.15)_0%,_rgba(255,255,255,0)_70%)] rounded-full blur-2xl"
      animate={{
        x: [-30, 30, -15, 0],
        y: [10, -20, 15, 0],
        opacity: [0.4, 0.8, 0.2, 0.5],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        repeatType: 'mirror',
      }}
    />
  </motion.div>

  {/* Replace the ghost icon with your existing Ghost or another icon, if desired */}
  <div className="relative z-50 flex items-center justify-center h-full w-12">
    <Ghost className="h-6 w-6 text-orange-500 drop-shadow-md" />
  </div>
</ComparisonHandle>
    </Comparison>
  );
}
