// app/api/design/route.ts
import { NextRequest, NextResponse } from 'next/server'

// If you use the official OpenAI SDK, import and init here.
// import OpenAI from 'openai'
// const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const runtime = 'nodejs' // or 'edge'

// const SYSTEM_PROMPT = `
// You are the AI Gifts Design Assistant.
// Goal: from minimal user input (idea or photo), produce a delightful gift concept and a print-ready brief.

// Principles:
// - Ask only the *next essential* question to move forward. Prefer assumptions with confirmation.
// - Offer 2–3 **concrete concept options** with short names and one-sentence rationale.
// - Default choices if unspecified: product=Poster A3, style=Lovify (romantic) for Valentine’s; Jollyfy (holiday) for Christmas; Spookify (portrait) for Halloween.
// - Keep copy short and warm. Avoid interrogation.
// - When enough info is known, output a JSON brief.

// JSON brief shape:
// {
//   "occasion": string,
//   "recipient": string,
//   "product": "Wall Art" | "Canvas" | "Metal Print" | "Acrylic Block" | "Card Set" | "Mug" | "Cushion" | "Poster",
//   "size": string | null,
//   "style": string,
//   "vibe": string | null,
//   "palette": string | null,
//   "caption": string | null,
//   "names": string | null,
//   "date": string | null,
//   "region": string | null
// }

// Only emit the brief when ready; otherwise continue the conversation.
// `

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const msgs = JSON.parse(String(formData.get('messages') || '[]')) as {role:'user'|'assistant'|'system', content:string}[]

  // Optional: read files (photo/moodboard) from formData here

  const userTranscript = msgs.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')

  // ---- Placeholder LLM call. Replace with OpenAI chat.completions ----
  // For now, a tiny heuristic reply and optional brief:
  const reply = "Great—based on that, here are three directions:\n\n" +
    "1) **Neon Night Canvas** — your names in city lights, bold and modern.\n" +
    "2) **Lovify Comic Poster** — a 6-panel hand-drawn story of your moment.\n" +
    "3) **Cozy Holiday Cards** — warm lights, subtle grain, ready to mail.\n\n" +
    "Which feels right? I can also pick for you."

  // Super naive “auto-brief” if user said “valentine” etc.
  const lower = userTranscript.toLowerCase()
  const brief =
    lower.includes('valentine') || lower.includes('romantic')
      ? {
          occasion: 'Valentine’s',
          recipient: 'Partner',
          product: 'Poster',
          size: 'A3',
          style: 'Lovify (Romantic)',
          vibe: 'Romantic',
          palette: 'Warm / golden hour',
          caption: null,
          names: null,
          date: null,
          region: 'UK',
        }
      : null

  return NextResponse.json({ reply, brief })
}
