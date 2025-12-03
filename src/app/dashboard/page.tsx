"use client";
import Link from "next/link";
import { useOrders } from "@/hooks/useOrders";
import { useProjects } from "@/hooks/useProjects"; // custom: load user projects
import { useUser } from "@/hooks/useUser";

import { SectionHeader } from "./components/SectionHeader";
import { ProjectCard } from "./components/ProjectCard";
// import { OrderCard } from "./components/OrderCard";
import { Particles } from "./components/Particles";
import { motion } from "framer-motion";
import { OrderCard } from "../SharedComponents/OrderCard";

export default function DashboardPage() {
  const { projects } = useProjects();


  const { user } = useUser();
  const email = user?.email ?? null;
  const { orders } = useOrders(email);
// Safe date formatter for Firestore, numbers, or strings
function formatProjectDate(input: any): string {
  if (!input) return "No date";

  // Firestore Timestamp (server)
  if (typeof input.toDate === "function") {
    return input.toDate().toLocaleDateString();
  }

  // Number timestamp (client-created)
  if (typeof input === "number") {
    return new Date(input).toLocaleDateString();
  }

  // ISO string from Firestore if converted
  if (typeof input === "string") {
    const d = new Date(input);
    if (!isNaN(d.valueOf())) return d.toLocaleDateString();
  }

  return "No date";
}


  return (
    <main className="relative min-h-screen p-8 text-white max-w-6xl mx-auto">
      <Particles />

      <motion.h1
        className="text-3xl font-bold mb-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        👋 Welcome back!
      </motion.h1>

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


{projects.map((proj) => (
  <Link
    key={proj.id}
    href={`/design?projectId=${proj.id}`}
    className="block"
  >
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition cursor-pointer">
      <div className="text-lg font-semibold">{proj.title || "Untitled Project"}</div>

      <div className="text-xs text-white/40 pt-1">
        {formatProjectDate(proj.updatedAt)}
      </div>

      {proj.previewUrl ? (
        <img
          src={proj.previewUrl}
          alt="Project preview"
          className="w-full h-32 object-cover rounded-lg mt-3"
        />
      ) : (
        <div className="w-full h-32 rounded-lg bg-black/40 mt-3 flex items-center justify-center text-white/30 text-xs">
          No preview yet
        </div>
      )}
    </div>
  </Link>
))}

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
