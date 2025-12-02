'use client';

import { useState } from "react";

/* -------------------------------------------------------------
 * TYPES
 * ------------------------------------------------------------- */
export type NanoPlan = {
  finalPrompt: string;
  aspect?: string;
};

export type Reference = {
  url: string;
};

export function useGenerateNanobanana(
  imageId: string,
  plan: NanoPlan,
  references: Reference[]
) {
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);

    const res = await fetch("/api/generate-nanobanana", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageId,
        finalPrompt: plan.finalPrompt,
        aspect: plan.aspect,
        references,
      }),
    });

    const json = await res.json();
    setResultUrl(json.resultUrl ?? null);
    setLoading(false);
  };

  return {
    generate,
    loading,
    resultUrl,
  };
}
