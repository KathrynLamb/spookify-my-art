
// src/app/login/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const session = await getServerSession(authOptions);
  if (session) redirect(searchParams?.next || "/dashboard");

  return <LoginClient nextUrl={searchParams?.next} />;
}
