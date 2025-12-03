// src/hooks/useUser.ts
"use client";

import { useEffect, useState } from "react";

type User = {
  email: string;
  name?: string | null;
};

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/user");
        if (!res.ok) {
          if (!cancelled) setUser(null);
          return;
        }

        const data = await res.json().catch(() => null);
        if (!cancelled) {
          setUser(data?.user ?? null);
        }
      } catch (err) {
        console.error("useUser failed:", err);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading };
}
