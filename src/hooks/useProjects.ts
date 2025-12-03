"use client";

import { useEffect, useState } from "react";

/* ---------------------------------------------
 * Types
 * --------------------------------------------- */
export interface Project {
  id: string;
  title?: string;
  previewUrl?: string;
  thumbnail?: string;
  createdAt?: string | number;
  [key: string]: unknown; // allow extra fields safely
}

interface ProjectsResponse {
  projects?: Project[];
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/projects");
        const data: ProjectsResponse = await res.json();
        setProjects(data.projects ?? []);
      } catch (e) {
        console.error("Failed loading projects", e);
      }
    }
    load();
  }, []);

  return { projects };
}
