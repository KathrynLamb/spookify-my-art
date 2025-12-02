import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { upsertItem } from "@/lib/memStore";
import { buildSystemPromptForDesign } from "@/lib/ai/prompts/productPrompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* -------------------------------------------------------------
 * Types
 * ------------------------------------------------------------- */

type Role = "user" | "assistant";

export type ChatMsg = {
  role: Role;
  content?: string;
};

export type ReferenceImage = {
  id: string;
  url: string;
  label?: string;
  role?: string;
  notes?: string;
};

export type Plan = {
  intent?: string;
  vibe?: string;
  elements?: string[];
  palette?: string;
  avoid?: string[];
  textOverlay?: string;

  referencesNeeded?: string[];
  references?: ReferenceImage[];

  productId?: string | null;

  orientation?: string | null;
  targetAspect?: number | null;

  finalizedPrompt?: string | null;
  userConfirmed?: boolean;
};

export type ChatBody = {
  id?: string;
  messages: ChatMsg[];
  username?: string | null;
  selectedProduct?: Record<string, unknown> | null;
  plan?: Partial<Plan> | null;
};

/* -------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------- */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function mergeUniqueRefs(
  a: ReferenceImage[] = [],
  b: ReferenceImage[] = []
): ReferenceImage[] {
  const map = new Map<string, ReferenceImage>();
  a.forEach((r) => map.set(r.id, r));
  b.forEach((r) => map.set(r.id, r));
  return Array.from(map.values());
}

function mergePlan(base: Partial<Plan>, delta: Partial<Plan>): Plan {
  return {
    ...base,
    ...delta,
    references: mergeUniqueRefs(base.references, delta.references),
  };
}

/* -------------------------------------------------------------
 * MAIN CHAT ROUTE — with correct image_url injection
 * ------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  try {
    const rawBody = (await req.json()) as unknown;

    if (!isRecord(rawBody)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const {
      id,
      messages,
      username = null,
      selectedProduct = null,
      plan: clientPlan = null,
    } = rawBody as ChatBody;

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages must be array" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 503 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    /* -------------------------------------------------------------
     * Extract reference images from plan
     * ------------------------------------------------------------- */
    const planRefs: ReferenceImage[] = Array.isArray(clientPlan?.references)
      ? (clientPlan!.references as ReferenceImage[])
      : [];

    const uploadedRefLabels = planRefs.map((r) => r.label || "reference photo");

    const remainingRefs = Array.isArray(clientPlan?.referencesNeeded)
      ? clientPlan.referencesNeeded
      : [];

    /* -------------------------------------------------------------
     * Build system prompt
     * ------------------------------------------------------------- */
    const systemPrompt = buildSystemPromptForDesign({
      username: username ?? undefined,
      selectedProduct,
      uploadedRefs: uploadedRefLabels,
      remainingRefs,
      currentPrompt:
        typeof clientPlan?.finalizedPrompt === "string"
          ? clientPlan.finalizedPrompt
          : null,
    });

    /* -------------------------------------------------------------
     * Build final message array for GPT
     * ------------------------------------------------------------- */
    const finalMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      [];

    // SYSTEM
    finalMessages.push({
      role: "system",
      content: systemPrompt,
    });

    // Reference images
    for (const ref of planRefs) {
      finalMessages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Reference image: ${ref.label || "reference photo"}`,
          },
          {
            type: "image_url",
            image_url: { url: ref.url },
          },
        ],
      });
    }

    // Conversation messages
    for (const m of messages) {
      finalMessages.push({
        role: m.role,
        content: m.content || "",
      });
    }

    /* -------------------------------------------------------------
     * Call GPT-4o
     * ------------------------------------------------------------- */
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: finalMessages,
    });

    const rawOutput = completion.choices[0].message.content ?? "{}";

    /* -------------------------------------------------------------
     * Parse JSON safely
     * ------------------------------------------------------------- */
    let json: unknown;
    try {
      json = JSON.parse(rawOutput);
    } catch {
      return NextResponse.json(
        {
          error: "Model returned invalid JSON",
          raw: rawOutput,
        },
        { status: 500 }
      );
    }

    if (!isRecord(json)) {
      return NextResponse.json(
        {
          error: "Model returned malformed JSON object",
          raw: json,
        },
        { status: 500 }
      );
    }

    /* -------------------------------------------------------------
     * Typed extraction
     * ------------------------------------------------------------- */
    const assistantText =
      typeof json.content === "string" ? json.content : "";

    const planDelta =
      isRecord(json.planDelta) ? (json.planDelta as Partial<Plan>) : {};

    const userConfirmed =
      typeof json.userConfirmed === "boolean"
        ? json.userConfirmed
        : false;

    const mergedPlan = mergePlan(clientPlan ?? {}, planDelta);

    // prevent invalid confirmation
    mergedPlan.userConfirmed =
      userConfirmed && mergedPlan.finalizedPrompt
        ? true
        : false;

    /* -------------------------------------------------------------
     * Persist plan
     * ------------------------------------------------------------- */
    if (id) {
      upsertItem(id, { plan: mergedPlan });
    }

    /* -------------------------------------------------------------
     * Return final response
     * ------------------------------------------------------------- */
    return NextResponse.json({
      content: assistantText,
      planDelta,
      plan: mergedPlan,
      finalizedPrompt: mergedPlan.finalizedPrompt ?? null,
      userConfirmed: mergedPlan.userConfirmed,
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error";

    console.error("❌ chat error", err);

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
