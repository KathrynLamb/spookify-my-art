// src/app/api/render/greeting/route.ts
export const runtime = "nodejs"; // important

import { NextRequest, NextResponse } from "next/server";
import { renderGreetingPng } from "@/lib/renderGreetingPng";

async function uploadBuffer(buf: Buffer, filename: string): Promise<string> {
  const b64 = buf.toString("base64");
  console.log(filename)
  return `data:image/png;base64,${b64}`;
}

export async function POST(req: NextRequest) {
  const { text, size } = (await req.json()) as { text: string; size: { w: number; h: number } };
  const png = await renderGreetingPng(text, size);
  const url = await uploadBuffer(png, `greeting-${Date.now()}.png`);
  return NextResponse.json({ url });
}
