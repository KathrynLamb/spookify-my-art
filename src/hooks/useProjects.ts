// src/hooks/useProjects.ts
"use client";

import { useUser } from "@/hooks/useUser";
import { useEffect, useState, useCallback, useRef } from "react";

export interface Project {
  id: string;
  title?: string;
  previewUrl?: string;
  thumbnail?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
  [key: string]: unknown;
}

interface ProjectsResponse {
  ok?: boolean; // allow future shape
  projects?: Project[];
  error?: string;
}

export function useProjects() {
  const { user } = useUser();
  const email = user?.email ?? null;

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // prevent state set after unmount
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!email) {
      if (aliveRef.current) setProjects([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/projects?email=${encodeURIComponent(email)}`
      );

      const data: ProjectsResponse = await res.json();

      // Backwards compatible:
      // - old shape: { projects: [...] }
      // - newer shape: { ok: true, projects: [...] }
      if (!res.ok || data.ok === false) {
        console.error("Failed loading projects", data.error);
        if (aliveRef.current) setProjects([]);
        return;
      }

      if (aliveRef.current) setProjects(data.projects ?? []);
    } catch (e) {
      console.error("Failed loading projects", e);
      if (aliveRef.current) setProjects([]);
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    load();
  }, [load]);

  const deleteProject = useCallback(
    async (projectId: string) => {
      if (!email) return { ok: false as const, error: "Not signed in" };

      // optimistic remove
      const snapshot = projects;
      setProjects((prev) => prev.filter((p) => p.id !== projectId));

      try {
        const res = await fetch("/api/projects/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, email }),
        });

        const json = (await res.json()) as {
          ok?: boolean;
          error?: string;
        };

        if (!res.ok || !json.ok) {
          // rollback
          setProjects(snapshot);
          return {
            ok: false as const,
            error: json.error ?? "Delete failed",
          };
        }

        return { ok: true as const };
      } catch (err) {
        console.error("Delete project failed", err);
        // rollback
        setProjects(snapshot);
        return { ok: false as const, error: "Delete failed" };
      }
    },
    [email, projects]
  );

  return { projects, loading, reload: load, deleteProject };
}
