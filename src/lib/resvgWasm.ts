// src/lib/resvgWasm.ts
import { readFile } from "fs/promises";

let inited = false;
let initPromise: Promise<void> | null = null;

function nodeRequire(): NodeRequire {

  return (0, eval)("require");
}

export async function ensureResvg() {
  if (inited) return;
  if (!initPromise) {
    initPromise = (async () => {
      const r = nodeRequire();
      const wasmPath = r.resolve("@resvg/resvg-wasm/index_bg.wasm");

      const { initWasm } = await import("@resvg/resvg-wasm");
      const bytes = await readFile(wasmPath);
      await initWasm(bytes);
      inited = true;
    })();
  }
  await initPromise;
}
