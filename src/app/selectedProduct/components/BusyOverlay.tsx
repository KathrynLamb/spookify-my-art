// src/app/selectedProduct/components/BusyOverlay.tsx
'use client';
export default function BusyOverlay({show, label='Working…'}:{show:boolean;label?:string}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70">
      <div className="w-[320px] rounded-xl bg-zinc-950 ring-1 ring-white/10 p-5 text-center">
        <div className="text-sm text-white/80">{label}</div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded bg-white/10">
          <div className="h-full w-1/3 animate-[progress_1.2s_linear_infinite] bg-white" />
        </div>
      </div>
      <style>{`@keyframes progress{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
    </div>
  );
}
