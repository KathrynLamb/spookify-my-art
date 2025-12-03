"use client";

import Image from "next/image";
import { motion } from "framer-motion";

/* ---------------------------------------------
 * Strong Project Type
 * --------------------------------------------- */
export type DashboardProject = {
  id: string;
  title?: string;
  previewUrl?: string; 
  createdAt?: number | string;  
};

/* ---------------------------------------------
 * Component
 * --------------------------------------------- */
export function ProjectCard({
  project,
  onClick,
}: {
  project: DashboardProject;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -6 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      onClick={onClick}
      className="group relative cursor-pointer rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm"
    >
      {/* Glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-orange-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="relative w-full h-40">
        <Image
     src={project.previewUrl || "/placeholder.png"}
          alt={project.title || "/unnamed project"}
          fill
          className="object-cover transition group-hover:scale-105"
        />
      </div>

      <div className="p-4 space-y-1">
        <h3 className="text-white font-semibold">{project.title}</h3>

        <p className="text-xs text-white/50">
  {project.createdAt
    ? new Date(project.createdAt).toLocaleDateString()
    : "No date"}
</p>
      </div>
    </motion.div>
  );
}
