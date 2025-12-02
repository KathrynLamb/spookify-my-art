// app/design/utils/parse.ts

/**
 * Extracts a JSON code block from a string and parses it.
 * Returns typed data or null if parsing fails.
 */
export function extractJsonFence<T = unknown>(text: string): T | null {
  const block =
    text.match(/```json\s*([\s\S]*?)```/i)?.[1] ??
    text.match(/```\s*([\s\S]*?)```/i)?.[1];

  if (!block) return null;

  try {
    return JSON.parse(block) as T;
  } catch {
    return null;
  }
}
