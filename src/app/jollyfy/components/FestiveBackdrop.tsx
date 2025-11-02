// components/FestiveBackdrop.tsx
'use client';
export default function FestiveBackdrop({
  className = '',
  lights = true,
  snow = true,
}: { className?: string; lights?: boolean; snow?: boolean }) {
  return (
    <div className={`pointer-events-none absolute inset-0 z-0 ${className}`}>
      {/* colored glow strip at the top */}
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(200px_60px_at_10%_10%,rgba(255,0,0,.25),transparent_60%),radial-gradient(200px_60px_at_40%_0%,rgba(34,197,94,.22),transparent_60%),radial-gradient(220px_60px_at_70%_12%,rgba(255,106,43,.22),transparent_60%),radial-gradient(200px_60px_at_95%_8%,rgba(139,115,255,.2),transparent_60%)]" />
      {lights && <div className="twinkle absolute inset-0" />}
      {snow && <div className="snow absolute inset-0" />}

      <style jsx>{`
        .twinkle:after {
          content: '';
          position: absolute; inset: 0;
          background-image:
            radial-gradient(6px 6px at 10% 18%, rgba(255,255,255,.25), transparent 60%),
            radial-gradient(6px 6px at 30% 12%, rgba(255,255,255,.2), transparent 60%),
            radial-gradient(6px 6px at 55% 22%, rgba(255,255,255,.25), transparent 60%),
            radial-gradient(6px 6px at 78% 16%, rgba(255,255,255,.2), transparent 60%),
            radial-gradient(6px 6px at 92% 10%, rgba(255,255,255,.25), transparent 60%);
          animation: twinkle 2.8s linear infinite;
          mix-blend-mode: screen;
        }
        @keyframes twinkle { 0%,100%{opacity:.4} 50%{opacity:.9} }

        .snow:before, .snow:after {
          content: '';
          position: absolute; top:-10%;
          width:1px;height:1px;background:transparent;
          box-shadow:
            10vw 5vh 0 1px rgba(255,255,255,.6),
            25vw 12vh 0 1px rgba(255,255,255,.5),
            40vw 18vh 0 2px rgba(255,255,255,.35),
            60vw 7vh 0 2px rgba(255,255,255,.4),
            80vw 15vh 0 1px rgba(255,255,255,.6),
            20vw 25vh 0 2px rgba(255,255,255,.3),
            55vw 28vh 0 1px rgba(255,255,255,.45),
            70vw 22vh 0 2px rgba(255,255,255,.35),
            90vw 26vh 0 1px rgba(255,255,255,.5);
          animation: snow 10s linear infinite;
        }
        .snow:after { animation-duration:14s; animation-delay:1.5s; filter:blur(.5px); }
        @keyframes snow { 0%{transform:translateY(-10%)} 100%{transform:translateY(110%)} }
      `}</style>
    </div>
  );
}
