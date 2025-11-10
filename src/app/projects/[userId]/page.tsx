// app/projects/[userId]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Image from "next/image";

type Project = {
  id: string;
  title?: string;
  thumbnail?: string;
  createdAt?: string | number;
  [k: string]: unknown;
};

type Order = {
  id: string;
  amount?: number;
  createdAt?: string | number;
  total?: number;
  status?: string;
  [k: string]: unknown;
};

type UserDoc = { name?: string | null };

export default async function UserProjectsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.id !== userId) redirect(`/projects/${session.user.id}`);

  const { adminDb } = await import("@/lib/firebase/admin");

  const userRef = adminDb.collection("users").doc(userId);
  const userSnap = await userRef.get();
  const user: UserDoc = (userSnap.data() as UserDoc) || {};

  const projectsSnap = await userRef.collection("projects").get().catch(() => null);
  const ordersSnap = await userRef.collection("orders").get().catch(() => null);

  const projects: Project[] =
    projectsSnap?.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Project, "id">) })) ?? [];

  const orders: Order[] =
    ordersSnap?.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) })) ?? [];

  const displayName =
    (typeof user.name === "string" && user.name) || session.user.name || "Spookifier";

  return (
    <main className="max-w-5xl min-h-screen mx-auto p-8 text-white">
      <h1 className="text-3xl font-bold mb-8">👋 Welcome back, {displayName}!</h1>

      {/* Projects */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Your Projects</h2>
        {projects.length === 0 ? (
          <p className="text-white/60">No projects yet — start by uploading a photo!</p>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <li key={p.id} className="rounded-xl overflow-hidden bg-white/10 border border-white/10">
                {p.thumbnail && (
                  <div className="relative aspect-square">
                    <Image src={p.thumbnail} alt={p.title || "Project"} fill className="object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold truncate">{p.title || "Untitled Project"}</h3>
                  <p className="text-xs text-white/50">
                    {p.createdAt
                      ? new Date(p.createdAt as number | string).toLocaleDateString()
                      : "Unknown date"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Orders */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Your Orders</h2>
        {orders.length === 0 ? (
          <p className="text-white/60">You haven’t ordered any prints yet.</p>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li key={o.id} className="p-4 bg-white/10 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Order #{o.id}</div>
                    <div className="text-xs text-white/60">
                      {o.createdAt
                        ? new Date(o.createdAt as number | string).toLocaleDateString()
                        : "Unknown date"}
                    </div>
                  </div>
                  {o.amount != null && (
                    <div className="text-white/80">£{(Number(o.amount) / 100).toFixed(2)}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

// If you also export metadata for this route:
export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return { title: `Projects – ${userId}` };
}
