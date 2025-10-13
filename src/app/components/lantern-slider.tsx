
'use client';

// import { Comparison, ComparisonHandle, ComparisonItem } from '@/components/ui/shadcn-io/comparison';
import Image from 'next/image';
import { Ghost} from 'lucide-react'; // your lantern SVG/icon
import { Comparison, ComparisonHandle, ComparisonItem } from '@/components/ui/shadcn-io/comparison/index';

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
      <ComparisonHandle>
        {/* Replace with your lantern graphic */}
        <div className="relative z-50 flex items-center justify-center h-full w-12">
          <Ghost className="h-6 w-6 text-orange-500 drop-shadow-md" />
        </div>
      </ComparisonHandle>
    </Comparison>
  );
}
