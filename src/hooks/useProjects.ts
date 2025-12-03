"use client";

import { useUser } from "@/hooks/useUser";
import { useEffect, useState } from "react";

export interface Project {
  id: string;
  title?: string;
  previewUrl?: string;
  thumbnail?: string;
  createdAt?: string | number;
  [key: string]: unknown;
}

interface ProjectsResponse {
  projects?: Project[];
}

export function useProjects() {
  const { user } = useUser();
  const email = user?.email ?? null;

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) return;

    async function load() {
      if (!email) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/projects?email=${encodeURIComponent(email)}`);
        const data: ProjectsResponse = await res.json();
        setProjects(data.projects ?? []);
      } catch (e) {
        console.error("Failed loading projects", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [email]);

  return { projects, loading };
}
