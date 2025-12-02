// components/PreviewStage.tsx
'use client';
import Image from 'next/image';
import * as React from 'react';
import { ProductDef, CropMode, aspectClassFromRatio } from '@/lib/productDefs';

export type OverlayToggles = { bleed: boolean; trim: boolean; safe: boolean };

export function PreviewStage({
  def,
  fileUrl,
  loading,
  zoom,
  cropMode = def.defaultCropMode ?? 'cover',
  overlays = { bleed: false, trim: true, safe: true },
}: {
  def: ProductDef;
  fileUrl?: string | null;
  loading?: boolean;
  zoom: number;
  cropMode?: CropMode;
  overlays?: OverlayToggles;
}) {
// app/selectedProduct/components/PreviewStage.tsx

// derive aspect safely
const aspectClass =
  def.aspectRatio != null
    ? aspectClassFromRatio(def.aspectRatio)
    : def.defaultOrientation === 'Square'
    ? 'aspect-square'
    : def.defaultOrientation === 'Landscape'
    ? 'aspect-[4/3]'
    : 'aspect-[3/4]';

// provide overlay defaults if absent
const ov = {
  panelInsetPct: def.overlay?.panelInsetPct ?? 0,
  trimInsetPct:  def.overlay?.trimInsetPct  ?? 0,
  safeInsetPct:  def.overlay?.safeInsetPct  ?? 0,
  roundedPx:     def.overlay?.roundedPx     ?? 0,
};

const panelInset = `${ov.panelInsetPct}%`;
const trimInset  = `${ov.trimInsetPct}%`;
const safeInset  = `${ov.safeInsetPct}%`;
const r          = ov.roundedPx || 8;


  return (
    <div className={`relative rounded-xl bg-[#0f0f11] ring-1 ring-white/10 overflow-hidden ${aspectClass}`}>
      {/* Background treatment per product family (purely decorative) */}
      {def.backdrop === 'sofa' && (
        <>
          <div className="absolute -bottom-6 -left-6 w-[50%] h-[22%] blur-2xl opacity-20 rounded-full bg-[#A38D7B]" />
          <div className="absolute -bottom-8 -right-10 w-[55%] h-[26%] blur-2xl opacity-15 rounded-full bg-[#B9A895]" />
        </>
      )}
      {def.backdrop === 'soft-shadow' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[70%] h-8 bg-black/40 blur-xl rounded-full" />
        </div>
      )}

      {loading ? (
        <div className="absolute inset-0 animate-pulse grid place-items-center text-white/40">Loading product…</div>
      ) : fileUrl ? (
        <>
          {/* PANEL – the printable face for this product */}
          <div
            className="absolute overflow-hidden ring-1 ring-white/10"
            style={{
              top: panelInset,
              left: panelInset,
              right: panelInset,
              bottom: panelInset,
              borderRadius: r,
              background: '#141416',
            }}
          >
            {/* Zoom only art layer */}
            <div
              className="absolute inset-0"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                willChange: 'transform',
              }}
            >
              <Image
                src={fileUrl}
                alt="Your artwork"
                fill
                className={cropMode === 'cover' ? 'object-cover' : 'object-contain'}
                sizes="(max-width:1024px) 100vw, 60vw"
                unoptimized
              />
            </div>

            {/* Overlays in panel coordinates */}
            <div className="absolute inset-0 pointer-events-none">
              {overlays.bleed && (
                <div
                  className="absolute inset-0"
                  style={{ borderRadius: r, outline: '2px dashed rgba(244,63,94,.55)', outlineOffset: '-2px' }}
                />
              )}
              {overlays.trim && (
                <div
                  className="absolute"
                  style={{
                    top: trimInset,
                    left: trimInset,
                    right: trimInset,
                    bottom: trimInset,
                    borderRadius: Math.max(0, r - 2),
                    outline: '2px solid rgba(255,255,255,.65)',
                    outlineOffset: '-2px',
                  }}
                />
              )}
              {overlays.safe && (
                <div
                  className="absolute"
                  style={{
                    top: safeInset,
                    left: safeInset,
                    right: safeInset,
                    bottom: safeInset,
                    borderRadius: Math.max(0, r - 4),
                    outline: '2px solid rgba(16,185,129,.7)',
                    outlineOffset: '-2px',
                  }}
                />
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 grid place-items-center text-white/40">Missing artwork URL</div>
      )}
    </div>
  );
}
