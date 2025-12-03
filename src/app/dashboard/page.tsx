"use client";

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
        {projects.map((p) => (
          <motion.div
            key={p.id}
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <ProjectCard project={p} onClick={() => {console.log("Project", p)}} />
          </motion.div>
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
