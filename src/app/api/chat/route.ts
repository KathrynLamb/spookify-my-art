import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildSystemPromptForDesign } from "@/lib/ai/prompts/productPrompt";
// import { isRecord } from "@/lib/utils/isRecord";
import {
  // ChatMsg,s
  Plan,
  ChatResponse,
  LLMMessage,
  SelectedProduct,
  ChatMessage,
} from "@/app/design/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface ReferenceImage {
  id: string;
  url: string;
  label: string;  // ← add this
}


function mergeRefs(a: ReferenceImage[] = [], b: ReferenceImage[] = []) {
  const map = new Map<string, ReferenceImage>();
  a.forEach((r) => map.set(r.id, r));
  b.forEach((r) => map.set(r.id, r));
  return [...map.values()];
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function mergePlan(base: Partial<Plan>, delta: Partial<Plan>): Plan {
  const mergedRefs = mergeRefs(base.references, delta.references);

  return {
    ...base,
    ...delta,
    references: [...mergedRefs.values()],
    referencesNeeded:
      Array.isArray(delta.referencesNeeded) || delta.referencesNeeded === null
        ? delta.referencesNeeded ?? undefined
        : base.referencesNeeded,
  
    finalizedPrompt:
      delta.finalizedPrompt ?? base.finalizedPrompt ?? null,
  
    userConfirmed:
      typeof delta.userConfirmed === "boolean"
        ? delta.userConfirmed
        : base.userConfirmed ?? false,
  
    userInsideMessageDecision:
      typeof delta.userInsideMessageDecision === "boolean"
        ? delta.userInsideMessageDecision
        : base.userInsideMessageDecision ?? false,
  
    insideMessage:
      delta.insideMessage ?? base.insideMessage ?? null,
  
    projectName:
      delta.projectName ?? base.projectName ?? "Untitled Project",
  };
  
}


interface ParsedResponse {
  content?: string;
  planDelta?: Partial<Plan>;
  finalizedPrompt?: string | null;
  userConfirmed?: boolean;
  projectName?: string;
  productPlan?: unknown;
}
export interface ChatBody {
  username?: string | null;
  selectedProduct?: SelectedProduct | null;
  messages: ChatMessage[];
  plan?: Plan | null;
}


export async function POST(req: NextRequest) {
  try {
    const raw = (await req.json()) as ChatBody;

    if (!Array.isArray(raw.messages)) {
      return NextResponse.json(
        { error: "messages must be array" },
        { status: 400 },
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const planRefs = Array.isArray(raw.plan?.references)
      ? raw.plan!.references
      : [];

    const uploadedLabels = planRefs.map((r) => r.label ?? "reference");

    const remainingRefs = Array.isArray(raw.plan?.referencesNeeded)
      ? raw.plan!.referencesNeeded
      : [];

    const systemPrompt = buildSystemPromptForDesign({
      username: raw.username ?? undefined,
      selectedProduct: raw.selectedProduct ?? null,
      uploadedRefs: uploadedLabels,
      remainingRefs,
      currentPrompt: raw.plan?.finalizedPrompt ?? null,
    });

    const messagesForLLM: LLMMessage[] = [];


    messagesForLLM.push({
      role: "system",
      content: systemPrompt,
    });
    for (const ref of planRefs) {
      messagesForLLM.push({
        role: "user",
        content: [
          { type: "text", text: `Reference image: ${ref.label}` },
          { type: "image_url", image_url: { url: ref.url } },

        ],
      });
    }
    

    for (const m of raw.messages) {
      messagesForLLM.push({
        role: m.role,
        content: m.content ?? "",
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: messagesForLLM,
    });

    const rawOutput = completion.choices[0].message.content ?? "{}";
    console.log("rawOutput", rawOutput)
    let parsed: ParsedResponse = {};

    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON from model", raw: rawOutput },
        { status: 500 },
      );
    }

    const assistantText = typeof parsed.content === "string" ? parsed.content : "";

    const planDelta = isRecord(parsed.planDelta)
      ? (parsed.planDelta as Partial<Plan>)
      : {};

    console.log("plan delta", planDelta)

    const mergedPlan = mergePlan(raw.plan ?? {}, planDelta);

    if (parsed.finalizedPrompt) mergedPlan.finalizedPrompt = parsed.finalizedPrompt;

    mergedPlan.userConfirmed =
      parsed.userConfirmed && mergedPlan.finalizedPrompt ? true : false;

    if (typeof planDelta.projectName === "string") {
      mergedPlan.projectName = planDelta.projectName;
    }

    const isCardProduct =
  raw.selectedProduct?.category === "cards";

if (isCardProduct) {
  const decided = mergedPlan.userInsideMessageDecision;
  const hasPrompt = !!mergedPlan.finalizedPrompt;

  // If we have a prompt but no decision, downgrade finalization.
  if (hasPrompt && !decided) {
    mergedPlan.finalizedPrompt = null;
    mergedPlan.userConfirmed = false;
  }
}


    return NextResponse.json({
      content: assistantText,
      planDelta,
      plan: mergedPlan,
      productPlan: parsed.productPlan ?? null,
      finalizedPrompt: mergedPlan.finalizedPrompt ?? null,
      userConfirmed: mergedPlan.userConfirmed,
      projectTitle: mergedPlan.projectName ?? null,
    } as ChatResponse);
  } catch (err: unknown) {
    console.error("❌ Chat error:", err);
  
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : "Unknown error";
  
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
  
}
