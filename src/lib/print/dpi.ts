export function computeDpi(imgW: number, imgH: number, inchesW: number, inchesH: number) {
    const dpiW = imgW / Math.max(inchesW, 0.001);
    const dpiH = imgH / Math.max(inchesH, 0.001);
    return Math.min(dpiW, dpiH);
  }
  
  export const DPI_THRESHOLDS = {
    warn: 180,  // show warning under this
    block: 120, // block under this
  };
  