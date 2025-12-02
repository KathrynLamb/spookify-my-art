// components/PreviewToolbar.tsx
'use client';
import * as React from 'react';
import { CropMode } from '@/lib/productDefs';
import { OverlayToggles } from './PreviewStage';

export function PreviewToolbar({
  zoom,
  setZoom,
  cropMode,
  setCropMode,
  overlays,
  setOverlays,
}: {
  zoom: number;
  setZoom: (v: number) => void;
  cropMode: CropMode;
  setCropMode: (m: CropMode) => void;
  overlays: OverlayToggles;
  setOverlays: (o: OverlayToggles) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
      <div className="inline-flex items-center gap-1">
        <span className="opacity-70">Zoom</span>
        <button className="px-2 py-1 rounded bg-white/10" onClick={() => setZoom(Math.max(0.75, +(zoom - 0.25).toFixed(2)))}>
          -
        </button>
        <span className="w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button className="px-2 py-1 rounded bg-white/10" onClick={() => setZoom(Math.min(2, +(zoom + 0.25).toFixed(2)))}>
          +
        </button>
      </div>

      <div className="h-4 w-px bg-white/15" />

      <div className="inline-flex rounded-full bg-white/10 p-1 ring-1 ring-white/15">
        {(['cover', 'contain'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setCropMode(m)}
            className={`px-3 py-1.5 rounded-full text-xs ${cropMode === m ? 'bg-white text-black' : 'text-white/80 hover:text-white'}`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-white/15" />

      {(['trim', 'safe', 'bleed'] as const).map((k) => (
        <label key={k} className="inline-flex items-center gap-1">
          <input
            type="checkbox"
            className="accent-white"
            checked={overlays[k]}
            onChange={(e) => setOverlays({ ...overlays, [k]: e.target.checked })}
          />
          {k === 'trim' ? 'Seam/Trim' : k[0].toUpperCase() + k.slice(1)}
        </label>
      ))}
    </div>
  );
}
