// /lib/aiPlanner.ts
import { z } from "zod";

export const PlanSchema = z.object({
  product: z.string().nullable().optional(),
  vibe: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
  text: z.string().nullable().optional(),
  orientation: z.enum(['Horizontal','Vertical','Square']).nullable().optional(),
  targetAspect: z.number().nullable().optional(),
  imageUploaded: z.boolean().optional(),
  printReady: z.boolean().optional(),
});
export type Plan = z.infer<typeof PlanSchema>;

export const ChatPayload = z.object({
  content: z.string(),                // assistant message to show
  planDelta: PlanSchema.partial(),    // only fields that changed
  productPlan: z.object({
    productId: z.string().nullable(),
    reasonShort: z.string().optional(),
  }).nullable().optional(),
});

export async function aiPlanner({
  model = "gpt-4o-mini",
  username,
  selectedProductTitle,
  plan,
  history, // [{role, content, images?}]
}: {
  model?: string;
  username?: string | null;
  selectedProductTitle?: string | null;
  plan: Plan;
  history: Array<{ role: 'system'|'user'|'assistant'; content: string; images?: string[] }>;
}) {
  const sys = `
You are an imaginative design assistant.
User${username ? `: ${username}` : ''}.
Selected product: ${selectedProductTitle ?? 'unknown'}.

Current plan (JSON):
${JSON.stringify(plan)}

Rules:
- If key info is missing, ask ONE short, friendly question.
- When you infer/confirm details, also return a JSON planDelta updating ONLY changed fields.
- Keep replies concise, warm, visual; end with a clear “Next:” step.
- Prefer inferring orientation from context (landscape/portrait/square). If unclear, ask.
- If references are required but missing, you MUST set planDelta.referencesNeeded 
  and DO NOT set finalizedPrompt.

- When plan is coherent for generation, set planDelta.printReady=true.
Return a JSON block after your message in:
\`\`\`json
{ "content": "...", "planDelta": {...}, "productPlan": {...?} }
\`\`\`
`;

  const res = await fetch(process.env.CHAT_API_URL ?? "/v1/chat", { // adapt to your stack
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: sys }, ...history],
    }),
  });

  const text = await res.text(); // we’ll parse below even on non-JSON
  // Extract trailing ```json …``` safely:
  const match = text.match(/```json\s*([\s\S]*?)\s*```/i) || text.match(/\{[\s\S]*\}$/m);
  const parsed = match ? JSON.parse(match[1] ?? match[0]) : { content: text, planDelta: {} };

  const data = ChatPayload.safeParse(parsed);
  if (!data.success) {
    return { content: text, planDelta: {} as Partial<Plan>, productPlan: null as null | undefined };
  }
  return data.data;
}
