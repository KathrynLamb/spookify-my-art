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
 * Hook return type
 * ------------------------------------------------------------- */
export function useDesignChat(params: {
  selectedProduct: SelectedProduct | null;
  imageId: string | null;
  projectId: string | null;
  userEmail: string | null;
  updateProject: (u: Record<string, unknown>) => Promise<void>;
}): {
  messages: ChatMessage[];
  plan: Plan;
  productPlan: ProductPlan | null;
  sendMessage: (content: string, override?: Plan) => Promise<void>;
  startGreeting: (msg: string) => void;
  addReference: (label: string, id: string, url: string) => void;
  restoreMessages: (msgs: ChatMessage[]) => void;
  restorePlan: (prev: Plan | null) => void;
  newProjectName: string | null;
} {
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
  });

  const [productPlan, setProductPlan] = useState<ProductPlan | null>(null);

  // NEW: store updated project name from AI
  const [newProjectName, setNewProjectName] = useState<string | null>(null);

  /* -------------------------------------------------------------
   * HELPERS
   * ------------------------------------------------------------- */
  const addTyping = () =>
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "•••", typing: true },
    ]);

  const removeTyping = () =>
    setMessages((prev) => prev.filter((m) => !m.typing));
    const mergePlan = (base: Plan, delta: Partial<Plan>): Plan => {
      const baseRefs = base.references ?? [];
      const deltaRefs = delta.references ?? [];
    
      const byId = new Map<string, Reference>();
      for (const r of baseRefs) byId.set(r.id, r);
      for (const r of deltaRefs) byId.set(r.id, r);
    
      return {
        ...base,
        ...delta,
        references: [...byId.values()],
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
  const addReference = useCallback(
    (label: string, id: string, url: string) => {
      setPlan((prev) => {
        const existing = prev.references ?? [];
        const next: Reference = { id, url, label };
        const merged = [...existing.filter((r) => r.label !== label), next];

        const remaining =
          prev.referencesNeeded?.filter((l) => l !== label) ?? [];

        return {
          ...prev,
          references: merged,
          referencesNeeded: remaining.length ? remaining : undefined,
        };
      });
    },
    []
  );

  /* -------------------------------------------------------------
   * SEND MESSAGE
   * ------------------------------------------------------------- */
  const sendMessage = useCallback(
    async (content: string, overridePlan?: Plan) => {
      if (!content.trim()) return;

      const userMsg: ChatMessage = { role: "user", content };
      const updatedMessages = [...messages, userMsg];

      setMessages(updatedMessages);
      addTyping();

      const planToSend = overridePlan ?? plan;

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

      /* ---------------- Parse planDelta ---------------- */
      const fenced = data.content ? extractJsonFence(data.content) : {};
      const planDelta = data.planDelta ?? fenced ?? {};
      const merged = mergePlan(plan, planDelta);


      if (data.finalizedPrompt) {
        merged.finalizedPrompt = data.finalizedPrompt;
      }

      if (typeof data.userConfirmed === "boolean") {
        merged.userConfirmed = data.userConfirmed;
      }

      // NEW — capture projectName
      const nameFromDelta =
        typeof data.planDelta?.projectName === "string"
          ? data.planDelta.projectName
          : null;

      const nameFromField =
        typeof data.projectTitle === "string"
          ? data.projectTitle
          : null;

      const finalName = nameFromDelta || nameFromField;

      if (finalName) {
        merged.projectName = finalName;
        setNewProjectName(finalName);
      }

      setPlan(merged);
      setProductPlan(data.productPlan ?? null);

      /* ---------------- Add assistant message ---------------- */
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.content ?? "",
      };

      const finalMsgs = [...updatedMessages, assistantMsg];
      setMessages(finalMsgs);

      /* ---------------- Auto-save ---------------- */
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
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      return [{ role: "assistant", content: msg }];
    });
  }, []);

  /* -------------------------------------------------------------
   * RESTORE (from Firestore)
   * ------------------------------------------------------------- */
  const restoreMessages = (prev: ChatMessage[]) => {
    setMessages((existing) => {
      if (existing.length > 0) return existing;
      return prev;
    });
  };

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
