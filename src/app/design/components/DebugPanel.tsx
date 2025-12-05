"use client";

import { useState } from "react";
import { ChatMessage, Plan, ProductPlan, SelectedProduct } from "@/app/design/types";

type Props = {
  messages: ChatMessage[];
  plan: Plan;
  productPlan: ProductPlan | null;
  selectedProduct: SelectedProduct;
  projectId: string | null;
  previewUrl?: string | null;
};

export default function DebugPanel({
  messages,
  plan,
  productPlan,
  selectedProduct,
  projectId,
  previewUrl,
}: Props) {
  const [open, setOpen] = useState(false);

  // Only show in development mode
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 999999,
        fontFamily: "monospace",
      }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "#ff3870",
          color: "white",
          padding: "8px 14px",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
        }}
      >
        {open ? "Hide Debug" : "Show Debug"}
      </button>

      {open && (
        <div
          style={{
            marginTop: 10,
            width: 420,
            maxHeight: "70vh",
            overflow: "auto",
            padding: 16,
            background: "rgba(0,0,0,0.85)",
            color: "#fff",
            border: "1px solid #444",
            borderRadius: 8,
            fontSize: 12,
          }}
        >
          <h3 style={{ marginTop: 0, fontSize: 14, fontWeight: 700 }}>
            🔍 Debug Panel
          </h3>

          <DebugSection title="Project">
            <DebugKV label="projectId" value={projectId} />
            <DebugKV label="previewUrl" value={previewUrl} />
            <DebugKV label="product name" value={selectedProduct?.title} />
            <DebugKV
              label="productUID"
              value={selectedProduct?.productUID}
            />
          </DebugSection>

          <DebugSection title="Plan">
            {Object.entries(plan).map(([key, value]) => (
              <DebugKV key={key} label={key} value={value} />
            ))}
          </DebugSection>

          <DebugSection title="Product Plan">
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(productPlan, null, 2)}
            </pre>
          </DebugSection>

          <DebugSection title="Messages">
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(messages, null, 2)}
            </pre>
          </DebugSection>
        </div>
      )}
    </div>
  );
}

function DebugSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          borderBottom: "1px solid #666",
          marginBottom: 6,
          paddingBottom: 3,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function DebugKV({ label, value }: { label: string; value: unknown }) {
  return (
    <div style={{ marginBottom: 4, lineHeight: "1.3em" }}>
      <span style={{ fontWeight: 600, opacity: 0.9 }}>{label}:</span>{" "}
      <span style={{ opacity: 0.8 }}>
        {typeof value === "object"
          ? JSON.stringify(value)
          : String(value ?? "—")}
      </span>
    </div>
  );
}
