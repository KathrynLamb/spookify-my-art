"use client";

import { useState, useCallback } from "react";
import {
  ChatMessage,
  ChatResponse,
  Plan,
  ProductPlan,
  Reference,
  SelectedProduct,
} from "@/app/design/types";
import { extractJsonFence } from "../utils/parse";

/* -------------------------------------------------------------
 * useDesignChat — Complete, Production-Ready Version
 * ------------------------------------------------------------- */
export function useDesignChat(params: {
  selectedProduct: SelectedProduct | null;
  imageId: string | null;
  projectId: string | null;
  userEmail: string | null;
  updateProject: (u: Record<string, unknown>) => Promise<void>;
}) {
  const { selectedProduct, imageId, projectId, userEmail, updateProject } =
    params;

  /* -------------------------------------------------------------
   * STATE
   * ------------------------------------------------------------- */
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [plan, setPlan] = useState<Plan>({
    references: [],
    referencesNeeded: [],
    finalizedPrompt: null,
    userConfirmed: false,

    // Greeting card extras:
    userInsideMessageDecision: false,
    insideMessage: null,
  });

  const [productPlan, setProductPlan] = useState<ProductPlan | null>(null);
  const [newProjectName, setNewProjectName] = useState<string | null>(null);

  /* -------------------------------------------------------------
   * TYPING HELPERS
   * ------------------------------------------------------------- */
  const addTyping = () =>
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "•••", typing: true },
    ]);

  const removeTyping = () =>
    setMessages((prev) => prev.filter((m) => !m.typing));

  /* -------------------------------------------------------------
   * PLAN MERGE — Correct & Safe
   * ------------------------------------------------------------- */
  const mergePlan = (base: Plan, delta: Partial<Plan>): Plan => {
    const mergedRefs = new Map<string, Reference>();

    // keep previous refs
    for (const r of base.references ?? []) mergedRefs.set(r.id, r);

    // add updated refs
    for (const r of delta.references ?? []) mergedRefs.set(r.id, r);

    return {
      ...base,
      ...delta,
      references: [...mergedRefs.values()],
      referencesNeeded:
        Array.isArray(delta.referencesNeeded) ||
        delta.referencesNeeded === null
          ? delta.referencesNeeded ?? undefined
          : base.referencesNeeded,
    };
  };

  /* -------------------------------------------------------------
   * ADD REFERENCE
   * ------------------------------------------------------------- */
  /* -------------------------------------------------------------
   * ADD REFERENCE
   * ------------------------------------------------------------- */
  const addReference = useCallback((label: string, id: string, url: string) => {
    setPlan((prev) => {
      const existing = prev.references ?? [];
      const others = existing.filter((r) => r.label !== label);
      const next: Reference = { id, url, label };

      const remaining =
        (prev.referencesNeeded ?? []).filter((l) => l !== label);

      return {
        ...prev,
        references: [...others, next],
        referencesNeeded: remaining.length ? remaining : undefined,
      };
    });
  }, []);

  /* -------------------------------------------------------------
   * SEND MESSAGE — FULL MULTI-BRANCH LOGIC
   * ------------------------------------------------------------- */
  const sendMessage = useCallback(
    async (content: string, overridePlan?: Plan) => {
      if (!content.trim()) return;

      const userMsg: ChatMessage = { role: "user", content };
      const updatedMessages = [...messages, userMsg];

      setMessages(updatedMessages);
      addTyping();

      const planToSend = overridePlan ?? plan;


      /* =============================================================
       * 2) SEND TO /api/chat
       * ============================================================= */
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: imageId,
          projectId,
          email: userEmail,
          messages: updatedMessages,
          selectedProduct,
          plan: planToSend,
        }),
      });

      const data: ChatResponse = await res.json();
      removeTyping();

      /* =============================================================
       * 3) MERGE PLAN
       * ============================================================= */
      const fenced = data.content ? extractJsonFence(data.content) : {};
      const planDelta = data.planDelta ?? fenced ?? {};

      const merged = mergePlan(planToSend, planDelta);

      if (data.finalizedPrompt) merged.finalizedPrompt = data.finalizedPrompt;
      if (typeof data.userConfirmed === "boolean")
        merged.userConfirmed = data.userConfirmed;

      // Project name
      const nameFromDelta =
        typeof data.planDelta?.projectName === "string"
          ? data.planDelta.projectName
          : null;
      const nameFromField =
        typeof data.projectTitle === "string" ? data.projectTitle : null;
      const finalName = nameFromDelta || nameFromField;

      if (finalName) {
        merged.projectName = finalName;
        setNewProjectName(finalName);
      }

      setPlan(merged);
      setProductPlan(data.productPlan ?? null);

      /* =============================================================
       * 4) ADD ASSISTANT MESSAGE
       * ============================================================= */
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.content ?? "",
      };

      const finalMsgs = [...updatedMessages, assistantMsg];
      setMessages(finalMsgs);

      /* =============================================================
       * 5) AUTO-SAVE PROJECT
       * ============================================================= */
      if (projectId && userEmail) {
        await updateProject({
          messages: finalMsgs,
          plan: merged,
          title: merged.projectName ?? "Untitled Project",
          updatedAt: Date.now(),
        });
      }
    },
    [
      messages,
      plan,
      selectedProduct,
      imageId,
      projectId,
      userEmail,
      updateProject,
    ]
  );

  /* -------------------------------------------------------------
   * GREETING
   * ------------------------------------------------------------- */
  const startGreeting = useCallback((msg: string) => {
    setMessages((prev) =>
      prev.length > 0 ? prev : [{ role: "assistant", content: msg }]
    );
  }, []);

  /* -------------------------------------------------------------
   * RESTORE FROM DB
   * ------------------------------------------------------------- */
  const restoreMessages = (prev: ChatMessage[]) =>
    setMessages((existing) => (existing.length > 0 ? existing : prev));

  const restorePlan = (prev: Plan | null) => {
    if (prev) setPlan(prev);
  };

  /* -------------------------------------------------------------
   * RETURN API
   * ------------------------------------------------------------- */
  return {
    messages,
    plan,
    productPlan,
    sendMessage,
    startGreeting,
    addReference,
    restoreMessages,
    restorePlan,
    newProjectName,
  };
}
