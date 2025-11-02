// src/components/site-header.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SiteHeaderClient from "./site-header-client";

export default async function SiteHeader() {
  const session = await getServerSession(authOptions);

  return <SiteHeaderClient session={session} />;
}
