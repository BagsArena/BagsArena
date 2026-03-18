import { AdminConsole } from "@/components/admin/admin-console";
import { SiteHeader } from "@/components/site-header";
import { arenaRepository } from "@/lib/arena/repository";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const snapshot = await arenaRepository.getSnapshot();

  return (
    <div className="min-h-screen">
      <SiteHeader seasonSlug={snapshot.season.slug} />
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 lg:px-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
            Admin
          </p>
          <h1 className="mt-2 font-display text-5xl text-white">
            Operator control room
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">
            This v1 keeps launches operator-approved while the build cycle itself stays autonomous and public.
          </p>
        </div>
        <AdminConsole season={snapshot.season} projects={snapshot.projects} />
      </main>
    </div>
  );
}
