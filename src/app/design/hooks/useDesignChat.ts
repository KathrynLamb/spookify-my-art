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
  const [plan, setPlan] = useState<Plan>({});
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
      const cfg: Partial<Plan> =
        data.plan ??
        extractJsonFence(data.content) ??
        {};

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
        { role: "assistant", content: data.content },
      ]);
    },
    [messages, plan, selectedProduct, imageId]
  );

  /* -------------------------------------------------------------
   * Greeting
   * ------------------------------------------------------------- */
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

    setMessages([{ role: "assistant", content: data.content }]);

    if (data.plan) setPlan(data.plan);
    if (data.productPlan) setProductPlan(data.productPlan);
  }, [selectedProduct]);

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
  };
}
