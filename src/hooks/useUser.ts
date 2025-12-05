// src/hooks/useUser.ts
"use client";

import { useEffect, useState } from "react";

/* ---------------------------------------------
 * Types
 * --------------------------------------------- */

export interface AppUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  [key: string]: unknown;
}

interface UserResponse {
  user: AppUser | null;
}

export function useUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/user");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: UserResponse = await res.json();

        if (!alive) return;
        setUser(data.user ?? null);
      } catch (err) {
        console.error("Failed to load /api/user", err);
        if (!alive) return;
        setUser(null);
        setError("Failed to load user");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  return { user, loading, error };
}
