// Simple client-side greeting renderer (no native deps)
export async function renderGreetingDataUrl(
    text: string,
    size: { w: number; h: number },
    opts?: { fontFamily?: string; textColor?: string; maxWidthPct?: number; bg?: string }
  ): Promise<string> {
    const { w, h } = size;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    // background (transparent by default)
    if (opts?.bg) {
      ctx.fillStyle = opts.bg;
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.clearRect(0, 0, w, h);
    }
  
    const pad = Math.round(w * 0.08);
    const maxWidth = Math.round(w * (opts?.maxWidthPct ?? 0.84));
    const basePx = Math.round(Math.min(w, h) * 0.06);
  
    ctx.fillStyle = opts?.textColor ?? '#1D1D1F';
    ctx.font = `700 ${basePx}px ${opts?.fontFamily ?? 'Helvetica, Arial, sans-serif'}`;
    ctx.textBaseline = 'top';
  
    // naïve word wrap
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth) {
        if (line) lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  
    const lineH = Math.round(basePx * 1.35);
    let y = Math.round(h * 0.2 - lineH); // slightly high on the inside-right
    const x = Math.round(w * 0.55) + pad; // inside-right page
  
    for (const l of lines) {
      ctx.fillText(l, x, y);
      y += lineH;
    }
    return canvas.toDataURL('image/png');
  }
  