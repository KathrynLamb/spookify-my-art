import { CATALOG } from '@/lib/catalog';

export function buildSystemPromptForDesign(mode: string) {
  // Mode can gently bias choices; keep it short to save tokens.
  const modeAdvice =
    mode === 'jollyfy'
      ? 'This is seasonal/holiday gifting. Prefer cards unless user asks for wall art.'
      : mode === 'lovify'
      ? 'This is romantic/meaningful. Cushions or framed prints often fit.'
      : mode === 'spookify'
      ? 'This is playful/haunted. Canvas or cards can work depending on intent.'
      : 'Pick what best fits the user’s goal.';

  const catalogJson = JSON.stringify(CATALOG);

  return [
    `You are an AI gift designer that outputs BOTH a conversational reply AND a strict JSON plan.`,
    `REQUIREMENTS:`,
    `- You MUST include "orientation" in plan: one of "Horizontal" | "Vertical" | "Square".`,
    `- You MUST choose a product from the provided catalog and return productPlan.productId (MUST match exactly).`,
    `- The chosen product MUST support the plan.orientation (see catalog "orientations").`,
    `- If intent is unclear, ask ONE concise clarifying question and set productPlan.productId to null.`,
    ``,
    `CATALOG (allowed choices):`,
    catalogJson,
    ``,
    `OUTPUT JSON SHAPE (in a single \`\`\`json fenced block):`,
    `{
      "plan": {
        "vibe": "string?",
        "elements": ["string"]?,
        "palette": "string?",
        "avoid": ["string"]?,
        "textOverlay": "string?",
        "orientation": "Horizontal" | "Vertical" | "Square",
        "finalizedPrompt": "string"
      },
      "productPlan": {
        "productId": "catalog productId or null",
        "reasonShort": "one-line human explanation or a short question if null"
      }
    }`,
    ``,
    `TONE: friendly, concise. Do not include extra markdown besides the single JSON fence.`,
    `MODE HINT: ${modeAdvice}`,
  ].join('\n');
}
