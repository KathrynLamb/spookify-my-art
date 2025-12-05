import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession();

  // Not logged in → redirect to login page immediately
  if (!session?.user?.email) {
    redirect("/login");
  }

  return <DashboardClient />;
}
