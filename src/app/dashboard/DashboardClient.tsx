// src/app/dashboard/page.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { useOrders } from "@/hooks/useOrders";
import { useProjects } from "@/hooks/useProjects";
import { useUser } from "@/hooks/useUser";

import { SectionHeader } from "./components/SectionHeader";
import { Particles } from "./components/Particles";
import { OrderCard } from "../SharedComponents/OrderCard";
import { ProjectCard } from "./components/ProjectCard";
import { useState } from "react";
import { ProjectSkeleton } from "./components/ProjectSkeleton";

/* -------------------------------------------------------------
 * TYPES / HELPERS
 * ------------------------------------------------------------- */

// Firestore Timestamp-like object (admin or client SDK)
// Firestore Timestamp-like object (client/admin SDK)
type FirestoreTimestampLike = {
  toDate: () => Date;
};

// Serialized timestamp shapes you might get from REST/Admin transforms
type FirestoreSerializedTimestamp =
  | { seconds: number; nanoseconds?: number }
  | { _seconds: number; _nanoseconds?: number };

// Type guard for real Timestamp objects (with toDate)
function isFirestoreTimestamp(value: unknown): value is FirestoreTimestampLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  );
}

// Type guard for serialized timestamp objects
function isFirestoreSerializedTimestamp(
  value: unknown
): value is FirestoreSerializedTimestamp {
  if (!value || typeof value !== "object") return false;

  const v = value as Record<string, unknown>;

  const hasSeconds =
    typeof v.seconds === "number" || typeof v._seconds === "number";

  return hasSeconds;
}

// Convert serialized timestamp -> Date
function serializedTimestampToDate(ts: FirestoreSerializedTimestamp): Date {
  // Support both shapes
  const seconds =
    "seconds" in ts ? ts.seconds : (ts as { _seconds: number })._seconds;

  const nanos =
    "nanoseconds" in ts
      ? ts.nanoseconds ?? 0
      : (ts as { _nanoseconds?: number })._nanoseconds ?? 0;

  const ms = seconds * 1000 + Math.floor(nanos / 1_000_000);
  return new Date(ms);
}

// Safe date formatter for Firestore, serialized timestamps, numbers, strings, or Date
function formatProjectDate(input: unknown): string {
  if (!input) return "No date";

  // 1) Real Firestore Timestamp (client/admin)
  if (isFirestoreTimestamp(input)) {
    return input.toDate().toLocaleDateString();
  }

  // 2) Serialized Firestore Timestamp
  if (isFirestoreSerializedTimestamp(input)) {
    const d = serializedTimestampToDate(input);
    if (!Number.isNaN(d.valueOf())) return d.toLocaleDateString();
  }

  // 3) Already a Date
  if (input instanceof Date) {
    if (!Number.isNaN(input.valueOf())) return input.toLocaleDateString();
  }

  // 4) Epoch millis
  if (typeof input === "number") {
    const d = new Date(input);
    if (!Number.isNaN(d.valueOf())) return d.toLocaleDateString();
  }

  // 5) ISO string
  if (typeof input === "string") {
    const d = new Date(input);
    if (!Number.isNaN(d.valueOf())) return d.toLocaleDateString();
  }

  return "No date";
}

/* -------------------------------------------------------------
 * COMPONENT
 * ------------------------------------------------------------- */

export default function DashboardClient() {

  const { projects, loading, deleteProject } = useProjects();

  const { user } = useUser();
  const email = user?.email ?? null;
  const { orders } = useOrders(email);

  // optional lightweight per-card delete state
  // if you don't want this, you can remove it
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (projectId: string, title?: string) => {
    const ok = window.confirm(
      `Delete "${title || "Untitled Project"}"? This can’t be undone.`
    );
    if (!ok) return;

    setDeletingId(projectId);
    const result = await deleteProject(projectId);
    setDeletingId(null);

    if (!result.ok) {
      alert(result.error || "Could not delete project.");
    }
  };

  return (
    <main className="relative min-h-screen p-8 text-white max-w-6xl mx-auto">
      <Particles />

      <motion.h1
        className="text-3xl font-bold mb-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        👋 Welcome back {user?.name ?? "there"}!
      </motion.h1>

      {/* PROJECTS */}
{/* PROJECTS */}
<SectionHeader title="Your Projects" />
<motion.div
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14"
  initial="hidden"
  animate="visible"
  variants={{
    visible: {
      transition: { staggerChildren: 0.08 },
    },
  }}
>
  {loading
    ? Array.from({ length: 6 }).map((_, i) => <ProjectSkeleton key={i} />)
    : projects.map((proj) => {
        const dateText = formatProjectDate(
          (proj as { updatedAt?: unknown }).updatedAt ?? proj.createdAt
        );
          console.log("datetext", dateText)
        return (
          <Link
            key={proj.id}
            href={`/design?projectId=${proj.id}`}
            className="block"
          >
            <ProjectCard
              project={{
                id: proj.id,
                title: proj.title,
                previewUrl: proj.previewUrl,
                dateText,
              }}
              deleting={deletingId === proj.id}
              onDelete={(id) => handleDelete(id, proj.title)}
            />
          </Link>
        );
      })}
</motion.div>


      {/* ORDERS */}
      <SectionHeader title="Your Orders" />
      <div className="space-y-4 pb-20">
        {orders.length === 0 && (
          <div className="text-white/40 text-sm">No orders yet.</div>
        )}

        {orders.map((o) => (
          <OrderCard key={o.orderId} order={o} />
        ))}
      </div>
    </main>
  );
}
