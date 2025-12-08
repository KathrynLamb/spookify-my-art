// src/app/dashboard/components/ProjectCard.tsx
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import React from "react";

/* ---------------------------------------------
 * Strong Project Type (UI-friendly)
 * --------------------------------------------- */
export type DashboardProject = {
  id: string;
  title?: string;
  previewUrl?: string;
  dateText?: string; // pre-formatted upstream for safety
};

/* ---------------------------------------------
 * Component
 * --------------------------------------------- */
export function ProjectCard({
  project,
  onClick,
  onDelete,
  deleting,
}: {
  project: DashboardProject;
  onClick?: () => void;
  onDelete?: (projectId: string) => void;
  deleting?: boolean;
}) {
  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // prevents Link navigation when this card is wrapped
    e.preventDefault();
    e.stopPropagation();
    if (!deleting) onDelete?.(project.id);
  };

  // console.log("project card", project)

  return (
    <motion.div
      whileHover={{ scale: 1.035, y: -6 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-orange-400/10 blur-3xl" />
      </div>

      {/* Delete button (hover reveal) */}
      {onDelete && (
        <button
          type="button"
          aria-label="Delete project"
          onClick={handleDeleteClick}
          disabled={!!deleting}
          className={[
            "absolute right-2 top-2 z-20 inline-flex items-center gap-1 rounded-full",
            "bg-black/60 px-2.5 py-1.5 text-[10px] font-semibold",
            "border border-white/10 text-white/80 backdrop-blur",
            "opacity-0 translate-y-[-2px] transition-all duration-200",
            "group-hover:opacity-100 group-hover:translate-y-0",
            "hover:text-white hover:border-white/20 hover:bg-black/70",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          ].join(" ")}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {deleting ? "Deleting…" : "Delete"}
        </button>
      )}

      {/* Image */}
      <div className="relative w-full h-40">
        <Image
          src={project.previewUrl || "/placeholder.png"}
          alt={project.title || "Unnamed project"}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 100vw, 33vw"
        />

        {/* Subtle bottom fade for text legibility */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent opacity-70" />
      </div>

      {/* Body */}
      <div className="p-4 space-y-1">
        <h3 className="text-white font-semibold truncate">
          {project.title || "Untitled Project"}
        </h3>

        <p className="text-xs text-white/50">
          {project.dateText || "No date"}
        </p>
      </div>
    </motion.div>
  );
}
