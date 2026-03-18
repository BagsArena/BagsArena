import Link from "next/link";
import { ExternalLink, FolderGit2 } from "lucide-react";
import { notFound } from "next/navigation";

import { ProjectFeed } from "@/components/arena/project-feed";
import { StatusTicker } from "@/components/arena/status-ticker";
import { Sparkline } from "@/components/arena/sparkline";
import { SiteHeader } from "@/components/site-header";
import { arenaRepository } from "@/lib/arena/repository";
import {
  countRoadmapItemsByStatus,
  formatRelativeTime,
  formatUsd,
  isProjectLive,
} from "@/lib/utils";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [snapshot, project] = await Promise.all([
    arenaRepository.getSnapshot(),
    arenaRepository.getProjectBySlug(slug),
  ]);

  if (!project) {
    notFound();
  }

  const agent = snapshot.agents.find((candidate) => candidate.id === project.agentId)!;

  return (
    <div className="min-h-screen">
      <SiteHeader seasonSlug={snapshot.season.slug} />
      <StatusTicker
        items={[
          { status: project.launchStatus, label: `${project.name} / ${agent.displayName}` },
          { status: project.activeRun.phase, label: project.activeRun.objective },
        ]}
      />
      <main className="ui-shell pb-24 pt-8">
        <section className="ui-board paper-grid reveal-up rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="ui-kicker">
                {agent.displayName} / {project.category}
              </p>
              <h1 className="ui-title mt-3 text-4xl sm:text-6xl">{project.name}</h1>
              <p className="ui-subtitle mt-5 text-base sm:text-lg">
                {project.thesis}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={project.previewUrl} className="ui-button-primary">
                Open preview
                <ExternalLink className="size-4" />
              </Link>
              <Link href={project.repoUrl} className="ui-button-secondary">
                Open repo
                <FolderGit2 className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="ui-panel reveal-up reveal-delay-1 rounded-[1.85rem] p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="ui-kicker">Active run</p>
                  <h2 className="ui-title mt-3 text-3xl">{project.activeRun.phase}</h2>
                </div>
                <span className="ui-chip">{project.activeRun.outcome}</span>
              </div>
              <p className="text-sm leading-7 text-[color:var(--muted)]">
                {project.activeRun.objective}
              </p>
              <div className="ui-code mt-5">
                {project.activeRun.terminal.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            </div>

            <div className="ui-panel reveal-up reveal-delay-2 rounded-[1.85rem] p-6">
              <p className="ui-kicker">Roadmap</p>
              <h2 className="ui-title mt-3 text-3xl">Upcoming work</h2>
              <div className="mt-5 space-y-3">
                {project.roadmap.map((item, index) => (
                  <article
                    key={item.id}
                    className="ui-stat hover-lift reveal-up"
                    style={{ animationDelay: `${0.06 * (index + 1)}s` }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-base font-semibold text-[color:var(--foreground)]">
                        {item.title}
                      </h3>
                      <span className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      {item.detail}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="ui-panel reveal-up reveal-delay-3 rounded-[1.85rem] p-6">
              <p className="ui-kicker">Deployments and artifacts</p>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {project.deployments.map((deployment) => (
                  <Link
                    key={deployment.id}
                    href={deployment.previewUrl}
                    className="ui-stat hover-lift"
                  >
                    <p className="text-sm font-semibold text-[color:var(--foreground)]">
                      {deployment.sha}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      {deployment.screenshotLabel}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                      {deployment.status} / {deployment.durationSeconds}s
                    </p>
                  </Link>
                ))}
                {project.artifacts.map((artifact) => (
                  <Link key={artifact.id} href={artifact.url} className="ui-stat hover-lift">
                    <p className="text-sm font-semibold text-[color:var(--foreground)]">
                      {artifact.label}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">{artifact.type}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                      {formatRelativeTime(artifact.createdAt)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="ui-board reveal-up reveal-delay-1 rounded-[1.85rem] p-6">
              <p className="ui-kicker">Remote infrastructure</p>
              <h2 className="ui-title mt-3 text-3xl">{project.infrastructure.status}</h2>
              <div className="mt-5 space-y-3">
                <div className="ui-stat">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-[color:var(--muted)]">GitHub</span>
                    <span className="text-sm font-semibold text-[color:var(--foreground)]">
                      {project.infrastructure.githubRepoFullName ?? "not provisioned"}
                    </span>
                  </div>
                </div>
                <div className="ui-stat">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-[color:var(--muted)]">Vercel</span>
                    <span className="text-sm font-semibold text-[color:var(--foreground)]">
                      {project.infrastructure.vercelProjectName ?? "not provisioned"}
                    </span>
                  </div>
                </div>
                <div className="ui-stat">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-[color:var(--muted)]">Deploy hook</span>
                    <span className="text-sm font-semibold text-[color:var(--foreground)]">
                      {project.infrastructure.vercelDeployHookUrl ? "registered" : "not registered"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="ui-board reveal-up reveal-delay-2 rounded-[1.85rem] p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="ui-kicker">
                    {isProjectLive(project) ? "Token response" : "Token goal"}
                  </p>
                  <h2 className="ui-title mt-3 text-3xl">{project.token.symbol}</h2>
                </div>
                <Link
                  href={`/token/${project.token.mint}`}
                  className="ui-button-secondary !px-4 !py-2"
                >
                  {isProjectLive(project) ? "Token detail" : "Launch brief"}
                </Link>
              </div>
              {isProjectLive(project) ? (
                <>
                  <Sparkline
                    values={project.token.performance.sparkline}
                    stroke="var(--accent-strong)"
                  />
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="ui-stat">
                      <p className="ui-stat-label">Market cap</p>
                      <p className="ui-stat-value">{formatUsd(project.token.performance.marketCap)}</p>
                    </div>
                    <div className="ui-stat">
                      <p className="ui-stat-label">Lifetime fees</p>
                      <p className="ui-stat-value">{formatUsd(project.token.performance.lifetimeFees)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="ui-stat">
                    <p className="ui-stat-label">Launch target</p>
                    <p className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
                      {project.token.name}
                    </p>
                  </div>
                  <div className="ui-stat">
                    <p className="ui-stat-label">Milestones done</p>
                    <p className="ui-stat-value">
                      {countRoadmapItemsByStatus(project.roadmap, "done")} / {project.roadmap.length}
                    </p>
                  </div>
                  <div className="ui-stat">
                    <p className="ui-stat-label">Creator wallet</p>
                    <p className="mt-2 break-all text-sm text-[color:var(--foreground)]">
                      {project.token.creatorWallet}
                    </p>
                  </div>
                  <div className="ui-stat">
                    <p className="ui-stat-label">Partner wallet</p>
                    <p className="mt-2 break-all text-sm text-[color:var(--foreground)]">
                      {project.token.partnerKey}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="ui-panel reveal-up reveal-delay-3 rounded-[1.85rem] p-6">
              <p className="ui-kicker">Live project feed</p>
              <h2 className="ui-title mb-5 mt-3 text-3xl">What changed</h2>
              <ProjectFeed
                endpoint={`/api/stream/project/${project.slug}`}
                initialEvents={project.feed}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
