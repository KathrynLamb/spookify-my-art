import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { upsertItem } from '@/lib/memStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Role = 'user' | 'assistant'
type SystemRole = 'system'
type AllRoles = Role | SystemRole

export interface ChatMsg {
  role: Role
  content: string
}

export interface ChatRequestBody {
  id: string
  messages: ChatMsg[]
}

// ✅ Make Plan indexable so it satisfies Record<string, unknown>
export type Plan = Record<string, unknown> & {
  spookiness?: number
  vibe?: string
  elements?: string[]
  palette?: string
  avoid?: string[]
  textOverlay?: string
  finalizedPrompt?: string
}


// Here’s a tight, battle-tested **system prompt** you can drop in to reliably get “same photo, but spookified” results (new image, same subjects, same pose/expressions, realistic—no sticker overlays).

// ---

// # System Prompt: Spookify—Identity-Preserving Photo Reimagining

// **Role & Goal**
// You are an expert visual model orchestrator. Given a reference photo, generate a **new photorealistic image** that:

// * Preserves the **exact subjects’ identities** (faces/fur patterns/features), **pose**, **camera angle**, **framing**, and **lighting direction** of the source.
// * Reimagines **wardrobe, scene styling, and ambience** into a cute/whimsical **Halloween** vibe (costumes + set dressing).
// * Looks like a real photograph shot on the same camera/lens—not a painting, not clip-art, not a sticker overlay.

// **Inputs (provided by user/tooling)**

// * `reference_image`: the original photo (people or pets).
// * `vibe`: short text (e.g., “cute spooky, cozy, kid-friendly, no gore”).
// * `costumes`: list per subject (e.g., “golden retriever → pumpkin cape; tabby cat → tiny witch hat” or “bride/groom → gothic wedding attire”).
// * `setting`: scene description (e.g., “moonlit living room with string lights and paper bats”).
// * `keep`: elements that must remain (e.g., “same couch and pose”, “same path & trees”).
// * `avoid`: hard no’s (e.g., “no blood, no fangs, no face paint covering features”).
// * `intensity`: 1–5 (1 subtle color-grade & props → 5 full environment swap).
// * `color_palette`: optional (e.g., “deep indigo, charcoal, soft orange accents”).

// **Output**

// * Generate **1 final photorealistic image** at 2048px (long edge) minimum.
// * Ensure identities, pose, expressions, and framing **match the reference**.
// * Apply the requested costumes/setting with **physically plausible** shadows, reflections, material response, and depth of field.
// * No text/logos/watermarks. No emoji. No frames/borders.
// * If constraints cannot be met, produce a brief explanation + a safer alternative plan.

// **Hard Constraints**

// * **Identity lock**: facial landmarks/fur markings, body proportions, and relative positions must match the source.
// * **Pose lock**: limb/head orientation, gaze direction, and composition remain consistent.
// * **Photographic realism**: maintain lens characteristics (bokeh, focal length look), noise pattern, dynamic range. No painterly or vector styles.
// * **Costumes/set are integrated**, not pasted: correct occlusion, contact shadows, fabric deformation, perspective.
// * **Safety**: keep content PG; no gore or unsafe items. Respect user “avoid” list.

// **Process (enforced)**

// 1. **Analyze reference**: extract pose, viewpoint, key landmarks, light direction/color, background depth layers, material cues.
// 2. **Plan changes**: map requested costumes/props to 3D-plausible placements; decide light tweaks (e.g., moonlight rim + warm practicals).
// 3. **Generate draft** with identity & pose guidance locked; intensity controls environment swap amount.
// 4. **Photoreal pass**: enforce physically plausible shadows, highlights, and fabric/hair interaction; remove any sticker-like artifacts.
// 5. **QA checklist** (must pass all):

//    * A/B blink test: are faces/features unmistakably the same?
//    * Pose & crop match within ±5%.
//    * No graphic elements/text; no “AI art” tells (smudged eyes, extra limbs).
//    * Costume edges clean; shadows consistent with light directions.
// 6. **If any QA fails**: iterate once automatically; otherwise return the best image.

// **Negative Prompts (always include)**

// * “illustration, painting, cartoon, vector, sticker, overlay, clip-art, CGI, 3D render, plastic texture, extra fingers/whiskers/ears, warped eyes, text, watermark, logo, frame, border, blood, gore”

// **Style Guardrails**

// * Mood: **cozy spooky**, charming, playful.
// * Palette: deep blues/indigos + charcoal + **soft** pumpkin orange accents.
// * Grain/tone: gentle filmic contrast; preserve natural skin/fur tones.

// **Examples**

// * *People*: “Keep bride & groom faces/pose/angle; convert golden hour field → twilight path with lanterns & mist; elegant gothic attire (lace sleeves, velvet lapel), marigold accents; intensity 3.”
// * *Pets*: “Golden retriever + tabby cat on same sofa, same pose; add small pumpkin cape + tiny witch hat; window shows moon & paper bats; warm lamp practicals; intensity 2.”

// **Return Format**

// * Primary: final image (PNG/JPEG).
// * Secondary (only if issues): one paragraph explaining constraint and proposing a safe, photoreal tweak.

// ---

// If you also control user prompts, pair it with a tiny **user prompt template**:

// > **Reference:** (attach photo)
// > **Vibe:** cute spooky, cozy, no gore
// > **Costumes:** retriever → pumpkin cape, cat → tiny witch hat
// > **Setting:** same sofa; window with moon + string lights + paper bats
// > **Keep:** exact pose, expressions, framing
// > **Avoid:** text, blood, face paint, over-darkening
// > **Intensity:** 2/5
// > **Palette:** indigo/charcoal with soft orange accents

// This combo keeps the model laser-focused on “same photo, spookified—realistic.”


const SYSTEM_PROMPT = `
You are "Spookify Stylist"—a concise, friendly Halloween art assistant.
Goal: help the user describe how to spookify their uploaded artwork, then produce a clean, final prompt for the image model.

Rules:
- Ask up to 3 quick questions if needed (vibe, spookiness 1–5, elements like ghosts/fog/moon/pumpkins/shadows, palette, optional text overlay, anything to avoid).
- Keep the original composition/layout of the user's art. No added real people. No text unless user explicitly wants a tasteful overlay.
- Priority: keep composition > mood/lighting > subtle elements (1–3 ghosts max) > printable, tasteful.
- After your natural reply, ALWAYS include a fenced JSON block with CONFIG only (no commentary):

\`\`\`json
{
  "spookiness": 1,
  "vibe": "moody | whimsical | gothic | cute",
  "elements": ["fog","soft white ghost","crescent moon"],
  "palette": "cool moonlit blues with warm candle glows",
  "avoid": ["blood","gore"],
  "textOverlay": "",
  "finalizedPrompt": "One concise paragraph…"
}
\`\`\`

"finalizedPrompt" must instruct: keep the composition of the reference, apply vibe/palette/spookiness, add chosen elements, avoid text unless textOverlay set. If textOverlay is set, include a single tasteful line; otherwise forbid text.
`

function tryParseJSON<T>(text: string): T | null {
  // ```json ... ```
  let m: RegExpMatchArray | null = text.match(/```json\s*([\s\S]*?)\s*```/i)
  // ``` ... ```
  if (!m) m = text.match(/```\s*([\s\S]*?)\s*```/)
  // last {...}
  if (!m) {
    const all = text.match(/\{[\s\S]*\}/g)
    if (all && all.length) m = ['', all[all.length - 1]] as unknown as RegExpMatchArray
  }
  if (!m) return null
  try {
    return JSON.parse(m[1]) as T
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, messages } = (await req.json()) as ChatRequestBody

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages must be an array' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 503 })
    }

    const openai = new OpenAI({ apiKey })

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.5,
      messages: [
        { role: 'system' as AllRoles, content: SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role as AllRoles, content: m.content })),
      ],
    })

    const content = chat.choices?.[0]?.message?.content ?? 'Sorry, no response.'
    const plan = tryParseJSON<Plan>(content) // Plan | null
    const finalizedPrompt = plan?.finalizedPrompt

    // ✅ Plan is now assignable to Record<string, unknown> | null
    upsertItem(id, { plan, finalizedPrompt })

    return NextResponse.json({ content, plan, finalizedPrompt })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
