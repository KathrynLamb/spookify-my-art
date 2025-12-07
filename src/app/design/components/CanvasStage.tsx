"use client";

import Image from "next/image";
import {
  Comparison,
  ComparisonItem,
  ComparisonHandle,
} from "@/components/ui/shadcn-io/comparison";

export function CanvasStage({
  original,
  result,
}: {
  original?: string | null;
  result?: string | null;
}) {
  const hasOriginal = !!original;
  const hasResult = !!result;

  return (
    <div className="relative w-full aspect-square bg-black border border-white/10 rounded-xl overflow-hidden">
      {hasOriginal && hasResult ? (
        <Comparison className="w-full h-full" mode="drag">
          <ComparisonItem position="left">
            <Image
              src={original!}
              fill
              sizes="400px"
              alt="Original"
              className="object-contain"
            />
          </ComparisonItem>
          <ComparisonItem position="right">
            <Image
              src={result!}
              fill
              sizes="400px"
              alt="Result"
              className="object-contain"
            />
          </ComparisonItem>
          <ComparisonHandle />
        </Comparison>
      ) : hasOriginal ? (
        <Image
          src={original!}
          fill
          sizes="400px"
          alt="Original"
          className="object-contain"
        />
      ) : hasResult ? (
        <Image
          src={result!}
          fill
          sizes="400px"
          alt="Result"
          className="object-contain"
        />
      ) : (
        <div className="grid place-items-center text-white/40">
          Upload a photo or begin chatting
        </div>
      )}
    </div>
  );
}
