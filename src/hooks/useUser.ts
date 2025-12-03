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

  // Allow extra fields without violating ESLint rules
  [key: string]: unknown;
}

interface UserResponse {
  user: AppUser | null;
}

export function useUser() {
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/user");
        const data: UserResponse = await res.json();
        setUser(data.user ?? null);
      } catch (err) {
        console.error("Failed to load /api/user", err);
        setUser(null);
      }
    }
    load();
  }, []);

  return { user };
}
