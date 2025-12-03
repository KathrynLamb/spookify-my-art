"use client";

import { useState, useCallback } from "react";
import {
  ChatMessage,
  ChatResponse,
  Plan,
  Reference,
  ProductPlan,
} from "../types";
import { extractJsonFence } from "../utils/parse";
import { SelectedProduct } from "../types";

/* =====================================================================
   useDesignChat
   ===================================================================== */
export function useDesignChat(
  selectedProduct: SelectedProduct | null,
  imageId: string | null
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [plan, setPlan] = useState<Plan>({
    references: [],
    referencesNeeded: [],
    userConfirmed: false,
    finalizedPrompt: null,
  });
  

  const [productPlan, setProductPlan] = useState<ProductPlan | null>(null);

  /* -------------------------------------------------------------
   *  UI helpers
   * ------------------------------------------------------------- */
  const addTyping = () =>
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "•••", typing: true },
    ]);

  const removeTyping = () =>
    setMessages((prev) => prev.filter((m) => !m.typing));

  /* -------------------------------------------------------------
   *  Merge plan updates
   * ------------------------------------------------------------- */
  const mergePlan = (base: Plan, delta: Partial<Plan>): Plan => {
    return {
      ...base,
      ...delta,

      // prefer fresh references if provided
      references:
        Array.isArray(delta.references) && delta.references.length > 0
          ? delta.references
          : base.references,

      referencesNeeded:
        Array.isArray(delta.referencesNeeded) ||
        delta.referencesNeeded === null
          ? delta.referencesNeeded || undefined
          : base.referencesNeeded,
    };
  };

  /* -------------------------------------------------------------
   * addReference (client-side only)
   * ------------------------------------------------------------- */
  const addReference = useCallback(
    (label: string, id: string, url: string) => {
      setPlan((prev) => {
        const prevRefs = prev.references ?? [];
        const nextRef: Reference = { id, url, label };
        const nextRefs = [
          ...prevRefs.filter((r) => r.label !== label),
          nextRef,
        ];

        const remaining =
          prev.referencesNeeded?.filter((l) => l !== label) ?? [];

        return {
          ...prev,
          references: nextRefs,
          referencesNeeded: remaining.length ? remaining : undefined,
        };
      });
    },
    []
  );

  /* -------------------------------------------------------------
   * sendMessage (supports optional planOverride)
   * ------------------------------------------------------------- */
  const sendMessage = useCallback(
    async (content: string, planOverride?: Plan): Promise<void> => {
      if (!content.trim()) return;

      const userMsg: ChatMessage = { role: "user", content };
      const newMsgs = [...messages, userMsg];

      setMessages(newMsgs);
      addTyping();

      const planToSend = planOverride ?? plan;

      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          id: imageId,
          messages: newMsgs,
          selectedProduct,
          plan: planToSend,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const data: ChatResponse = await res.json();
      removeTyping();

      // Parse plan delta in content if present
      const fenced = data.content ? extractJsonFence(data.content) : {};
      const cfg: Partial<Plan> = data.plan ?? fenced ?? {};
      

      const mergedPlan = mergePlan(plan, cfg);

      // finalizedPrompt
      if (data.finalizedPrompt) {
        mergedPlan.finalizedPrompt = data.finalizedPrompt;
      }

      // userConfirmed — SAFE narrow (no any)
      if (typeof data.userConfirmed === "boolean") {
        mergedPlan.userConfirmed = data.userConfirmed;
      }

      setPlan(mergedPlan);
      setProductPlan(data.productPlan ?? null);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content ?? "" },
      ]);
      
    },
    [messages, plan, selectedProduct, imageId]
  );

  /* -------------------------------------------------------------
   * Greeting
   * ------------------------------------------------------------- */
 /* -------------------------------------------------------------
 * Greeting (FIRST assistant message must be JSON)
 * ------------------------------------------------------------- */
// inside useDesignChat.ts

// export type ChatResponse = {
//   ok?: boolean;
//   content?: string;
//   message?: string;
//   plan?: Plan;
//   productPlan?: ProductPlan;
//   finalizedPrompt?: string;
//   userConfirmed?: boolean;
//   projectTitle?: string;
// };

// ...

const startGreeting = useCallback(async () => {
  if (!selectedProduct) return;

  addTyping();

  const res = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      messages: [{ role: "user", content: "Kickoff greeting only." }],
      selectedProduct,
    }),
    headers: { "Content-Type": "application/json" },
  });

  const data: ChatResponse = await res.json();
  removeTyping();

  // Be defensive about where the text lives
  const assistantText =
    data.content ??
    (typeof data.message === "string" ? data.message : "") ??
    "";

  if (assistantText) {
    setMessages([{ role: "assistant", content: assistantText }]);
  } else {
    console.warn("[chat] Greeting response without content/message", data);
    setMessages([]);
  }

  if (data.plan) setPlan(data.plan);
  if (data.productPlan) setProductPlan(data.productPlan);
}, [selectedProduct]);

/** ---------------------------------------------
 * RESTORE PREVIOUS SESSION (loaded from Firestore)
 * --------------------------------------------- */
function restoreMessages(prev: ChatMessage[]) {
  setMessages(prev);
}

function restorePlan(prev: Plan | null) {
  if (prev) {
    setPlan(prev);
  }
}


  /* -------------------------------------------------------------
   * EXPORT
   * ------------------------------------------------------------- */
  return {
    messages,
    plan,
    productPlan,
    sendMessage,
    startGreeting,
    addReference,
    restoreMessages,   // 👈 ADD
    restorePlan,   
  };
}
