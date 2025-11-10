// src/lib/renderGreetingPng.tsx
import satori from "satori";

// (Optional) if you use the WASM resvg approach, keep this helper:
let fontDataPromise: Promise<ArrayBuffer> | null = null;
async function getFontData() {
  if (!fontDataPromise) {
    // Any TTF/OTF URL works; this is Inter SemiBold 600 from Google
    fontDataPromise = fetch(
      "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMaBL9MbYVq.ttf"
    ).then(r => {
      if (!r.ok) throw new Error(`Font fetch failed: ${r.status}`);
      return r.arrayBuffer();
    });
  }
  return fontDataPromise;
}

// If you’re using the WASM runtime loader, keep this and import Resvg dynamically later.
// (If you already have ensureResvg in a separate file, you can keep using it.)
async function ensureResvg() {
  // no-op here; if you built a dedicated ensureResvg() already, import and call that instead.
}

export async function renderGreetingPng(
  text: string,
  size: { w: number; h: number }
): Promise<Buffer> {
  await ensureResvg();

  const fontData = await getFontData();

  const svg = await satori(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        fontSize: Math.min(size.w, size.h) * 0.06,
        fontFamily: "Inter, Helvetica, Arial, sans-serif",
        color: "#1D1D1F",
        textAlign: "center",
        whiteSpace: "pre-wrap",
        padding: "8%",
      }}
    >
      {text}
    </div>,
    {
      width: size.w,
      height: size.h,
      fonts: [
        {
          name: "Inter",
          data: fontData,
          weight: 600,
          style: "normal",
        },
      ],
    }
  );

  // Import resvg AFTER generating the SVG, so bundlers don’t try to treat the .node as a frontend module.
  const { Resvg } = await import("@resvg/resvg-wasm");
  const resvg = new Resvg(svg);
  return Buffer.from(resvg.render().asPng());
}
