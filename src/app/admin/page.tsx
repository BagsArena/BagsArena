import { AdminConsole } from "@/components/admin/admin-console";
import { StatusTicker } from "@/components/arena/status-ticker";
import { SiteHeader } from "@/components/site-header";
import { arenaRepository } from "@/lib/arena/repository";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const snapshot = await arenaRepository.getSnapshot();
  const launchReady = snapshot.projects.filter(
    (project) => project.launchStatus === "launch-ready",
  ).length;
  const totalCommits = snapshot.projects.reduce(
    (sum, project) => sum + project.activeRun.mergedCommits24h,
    0,
  );
  const totalDeploys = snapshot.projects.reduce(
    (sum, project) => sum + project.activeRun.successfulDeploys24h,
    0,
  );

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
        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <article className="ui-board paper-grid reveal-up rounded-[2rem] p-6 sm:p-8">
            <div className="max-w-4xl">
              <p className="ui-kicker">Operator control room</p>
              <h1 className="ui-title mt-3 text-4xl sm:text-6xl">Admin rail</h1>
              <p className="ui-subtitle mt-5 text-base sm:text-lg">
                Launches stay operator-approved while build, provisioning, and metrics keep moving.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="ui-stat">
                <p className="ui-stat-label">Launch-ready</p>
                <p className="ui-stat-value">{launchReady}</p>
              </div>
              <div className="ui-stat">
                <p className="ui-stat-label">24h commits</p>
                <p className="ui-stat-value">{totalCommits}</p>
              </div>
              <div className="ui-stat">
                <p className="ui-stat-label">24h deploys</p>
                <p className="ui-stat-value">{totalDeploys}</p>
              </div>
            </div>
          </article>

          <article className="ui-browser ui-spotlight reveal-up reveal-delay-1">
            <div className="ui-browser-toolbar">
              <div className="ui-browser-traffic">
                <span className="bg-[#ff5f57]" />
                <span className="bg-[#febc2e]" />
                <span className="bg-[color:var(--accent)]" />
              </div>
              <div className="ui-browser-address">/admin/season/{snapshot.season.slug}</div>
              <span className="ui-chip">{snapshot.season.status}</span>
            </div>

            <div className="ui-browser-screen">
              <div className="ui-browser-grid ui-browser-grid-2">
                <div className="ui-browser-module ui-browser-module-soft">
                  <p className="ui-kicker">Projects</p>
                  <p className="ui-browser-stat-value mt-3">{snapshot.projects.length}</p>
                </div>
                <div className="ui-browser-module">
                  <p className="ui-kicker">Freeze date</p>
                  <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">
                    {new Date(snapshot.season.freezeAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="ui-browser-module">
                <p className="ui-kicker">Operator summary</p>
                <div className="ui-chip-stack mt-4">
                  <span className="ui-browser-tag">cycle control</span>
                  <span className="ui-browser-tag">remote setup</span>
                  <span className="ui-browser-tag">bags launch</span>
                  <span className="ui-browser-tag">metrics polling</span>
                </div>
              </div>
            </div>
          </article>
        </section>

        <div className="mt-6">
          <AdminConsole season={snapshot.season} projects={snapshot.projects} />
        </div>
      </main>
    </div>
  );
}
