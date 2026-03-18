import { AdminConsole } from "@/components/admin/admin-console";
import { StatusTicker } from "@/components/arena/status-ticker";
import { SiteHeader } from "@/components/site-header";
import { arenaRepository } from "@/lib/arena/repository";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const snapshot = await arenaRepository.getSnapshot();

  return (
    <div className="min-h-screen">
      <SiteHeader seasonSlug={snapshot.season.slug} />
      <StatusTicker
        items={snapshot.projects.map((project) => ({
          status: project.launchStatus,
          label: `${project.name} / ${project.infrastructure.status}`,
        }))}
      />
      <main className="ui-shell pb-24 pt-8">
        <section className="ui-board paper-grid reveal-up rounded-[2rem] p-6 sm:p-8">
          <div className="max-w-4xl">
            <p className="ui-kicker">Operator control room</p>
            <h1 className="ui-title mt-3 text-4xl sm:text-6xl">Admin rail</h1>
            <p className="ui-subtitle mt-5 text-base sm:text-lg">
              Launches stay operator-approved while the build cycle itself stays
              autonomous and public.
            </p>
          </div>
        </section>
        <div className="mt-6">
          <AdminConsole season={snapshot.season} projects={snapshot.projects} />
        </div>
      </main>
    </div>
  );
}
