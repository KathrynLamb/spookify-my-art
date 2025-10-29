// app/projects/[userId]/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import Image from "next/image";

type Project = {
  id: string;
  title?: string;
  thumbnail?: string;
  createdAt?: string | number;
  [key: string]: unknown;
};

type Order = {
  id: string;
  amount?: number; // ✅ add this
  createdAt?: string | number;
  total?: number;
  status?: string;
  [key: string]: unknown;
};

export default async function UserProjectsPage({ params }: { params: { userId: string } }) {
  const session = await auth();

  // Redirect unauthenticated users
  if (!session?.user) {
    redirect("/login");
  }

  // Redirect users trying to view someone else’s dashboard
  if (session.user.id !== params.userId) {
    redirect(`/projects/${session.user.id}`);
  }

  // Fetch user document + subcollections
  const userRef = adminDb.collection("users").doc(params.userId);
  const userSnap = await userRef.get();

  const projectsSnap = await userRef.collection("projects").get().catch(() => null);
  const ordersSnap = await userRef.collection("orders").get().catch(() => null);

  const user = userSnap.data() || {};
 // Safer map — ensures no duplicate “id” property
const projects: Project[] =
projectsSnap?.docs.map((d) => {
  const data = d.data() as Omit<Project, "id">;
  return { id: d.id, ...data };
}) ?? [];

const orders: Order[] =
  ordersSnap?.docs.map((d) => {
    const data = d.data() as Omit<Order, "id">;
    return { id: d.id, ...data };
  }) ?? [];
  return (
    <main className="max-w-5xl min-h-screen mx-auto p-8 text-white">
      <h1 className="text-3xl font-bold mb-8">
        👋 Welcome back, {user.name || session.user.name || "Spookifier"}!
      </h1>

      {/* Projects Section */}
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
                    <Image
                      src={p.thumbnail}
                      alt={p.title || "Project"}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold truncate">{p.title || "Untitled Project"}</h3>
                  <p className="text-xs text-white/50">
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString()
                      : "Unknown date"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Orders Section */}
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
                        ? new Date(o.createdAt).toLocaleDateString()
                        : "Unknown date"}
                    </div>
                  </div>
                  {o.amount && (
                    <div className="text-white/80">

                      £{(Number(o.amount) / 100).toFixed(2)}
                    </div>
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
