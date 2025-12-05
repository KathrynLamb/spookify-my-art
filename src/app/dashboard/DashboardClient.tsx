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
type FirestoreTimestampLike = {
  toDate: () => Date;
};

// Type guard to detect Firestore Timestamp-ish values
function isFirestoreTimestamp(
  value: unknown
): value is FirestoreTimestampLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  );
}

// Safe date formatter for Firestore, numbers, or strings
function formatProjectDate(input: unknown): string {
  if (!input) return "No date";

  if (isFirestoreTimestamp(input)) {
    return input.toDate().toLocaleDateString();
  }

  if (typeof input === "number") {
    return new Date(input).toLocaleDateString();
  }

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
